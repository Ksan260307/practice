# -*- coding: utf-8 -*-
"""
============================================================================
 高速素因数分解エンジン  (Fast Integer Factorization Engine)
============================================================================
このマシン（純Python + gmpy2/GMP）で "理論上できる限り速い" 実装を目指した版。

■ 何を使っているか（全て実装・検証済みの本物のアルゴリズム）
   1. 試し割り              … 小さい素因数（~10^6 まで）を瞬殺
   2. 完全冪判定            … n = p^k を一撃で分解（gmpy2.iroot）
   3. Fermat法              … 2因数が非常に近いケースを瞬殺
   4. Pollard ρ (Brent+バッチgcd) … ~20桁までの因数を高速に発見
   5. Pollard p-1           … p-1 が滑らかなラッキーケースを回収
   6. 楕円曲線法 ECM        … 中サイズ因数(~35-40桁)の主力。全CPUコアで
                              曲線を並列展開（ECMは曲線ごとに独立=完全並列）。
                              Montgomery曲線XZ座標・stage1(ladder)+stage2(BSGS)。
   7. SIQS finisher (SymPy) … ECMで割り切れなかった中規模の残り(~<100桁)を
                              時間制限付きで仕上げる。

■ 400桁について（正直な話 — ここ重要）
   因数分解の難しさは「数全体の桁数」ではなく「最小の素因数の桁数」で決まる。
   ・400桁でも、因数のどれかが ~35-40桁以下なら → このエンジンが現実的な時間で発見できる。
   ・400桁が "2つの ~200桁素数の積"（＝RSA型の硬い半素数）だと →
       これは地球上のいかなるコンピュータでも分解不可能。RSAの安全性そのもの。
       （一般数体篩の世界記録でも250桁=RSA-250、約2700コア年。400桁は桁違いに無理。）
   本エンジンは、割れる構造があれば全力で最速に割り、
   到達不能なものは無限ループせず、その旨を正直に報告して停止する。
============================================================================
"""

import sys
import os
import time
import math
import random
import multiprocessing
from array import array
from concurrent.futures import ProcessPoolExecutor

try:
    import gmpy2
    from gmpy2 import mpz
except ImportError:
    print("\n[エラー] 'gmpy2' が見つかりません。 'pip install gmpy2' を実行してください。")
    sys.exit(1)

try:
    import sympy  # SIQS finisher / 素数性クロスチェック用（任意）
    _HAS_SYMPY = True
except ImportError:
    _HAS_SYMPY = False


# ===========================================================================
# 小さい素数テーブル（試し割り & ECM stage1 & 篩の基底）
# ===========================================================================
def _sieve(limit):
    bs = bytearray([1]) * (limit + 1)
    bs[0] = bs[1] = 0
    for p in range(2, int(limit ** 0.5) + 1):
        if bs[p]:
            bs[p * p::p] = bytearray(len(range(p * p, limit + 1, p)))
    return array('i', (i for i in range(2, limit + 1) if bs[i]))

SMALL_LIMIT = 1_000_000
SMALL_PRIMES = _sieve(SMALL_LIMIT)          # 78498 個（<=10^6）
_TRIAL_PRIMES = SMALL_PRIMES                 # 試し割りにも流用

# 各ワーカープロセス内でのキャッシュ（B1ごとのstage1乗数、(B1,B2)ごとのstage2素数）
_K_CACHE = {}
_S2_CACHE = {}


# ===========================================================================
# 基本ツール
# ===========================================================================
def is_prime(n):
    return gmpy2.is_prime(mpz(n), 25)


def trial_division(n):
    """小さい素因数を全部剥がす。 (factors, remaining) を返す。"""
    n = mpz(n)
    factors = []
    for p in _TRIAL_PRIMES:
        if p * p > n:
            break
        if n % p == 0:
            while n % p == 0:
                factors.append(mpz(p))
                n //= p
            if n == 1 or gmpy2.is_prime(n, 25):
                break
    return factors, n


def as_perfect_power(n):
    """n が完全冪 (b^e, e>1) なら (b, e) を返す。そうでなければ None。"""
    n = mpz(n)
    if not gmpy2.is_power(n):
        return None
    # 指数は素数だけ試せば十分（b^(e) の e は素数因子で必ず割れる）
    maxe = n.bit_length()
    for e in SMALL_PRIMES:
        if e > maxe:
            break
        r, exact = gmpy2.iroot(n, int(e))
        if exact:
            return mpz(r), int(e)
    return None


def fermat(n, max_iters=200_000):
    """2因数が近いときの一撃。近くなければ None。"""
    n = mpz(n)
    a = gmpy2.isqrt(n)
    if a * a == n:
        return a
    a += 1
    b2 = a * a - n
    for _ in range(max_iters):
        if gmpy2.is_square(b2):
            b = gmpy2.isqrt(b2)
            f = a - b
            if 1 < f < n:
                return f
        b2 += 2 * a + 1
        a += 1
    return None


def pollard_rho(n, deadline=None):
    """Brentの改良ρ + バッチgcd。~18-20桁までの因数に強い。"""
    n = mpz(n)
    if n % 2 == 0:
        return mpz(2)
    if n % 3 == 0:
        return mpz(3)
    while True:
        c = mpz(random.randrange(1, int(n - 1)))
        y = mpz(random.randrange(2, int(n - 1)))
        m = 256
        g = q = mpz(1)
        r = 1
        x = ys = y
        while g == 1:
            x = y
            for _ in range(r):
                y = (y * y + c) % n
            k = 0
            while k < r and g == 1:
                ys = y
                for _ in range(min(m, r - k)):
                    y = (y * y + c) % n
                    q = q * (x - y) % n
                g = gmpy2.gcd(q, n)
                k += m
            r <<= 1
            if deadline and time.time() > deadline:
                return None
        if g == n:
            g = mpz(1)
            while g == 1:
                ys = (ys * ys + c) % n
                g = gmpy2.gcd(x - ys if x > ys else ys - x, n)
        if 1 < g < n:
            return g
        # g == n のまま抜けたら別の c で再試行（deadlineで打ち切り）
        if deadline and time.time() > deadline:
            return None


def pollard_pm1(n, B1=1_000_000, B2=10_000_000, deadline=None):
    """p-1 が滑らかな素因数を回収。ラッキー狙いの安価な一手。"""
    n = mpz(n)
    a = mpz(2)
    # stage 1
    for i, p in enumerate(SMALL_PRIMES):
        if p > B1:
            break
        pe = p
        while pe * p <= B1:
            pe *= p
        a = gmpy2.powmod(a, int(pe), n)
        if (i & 1023) == 0:
            g = gmpy2.gcd(a - 1, n)
            if 1 < g < n:
                return g
            if deadline and time.time() > deadline:
                return None
    g = gmpy2.gcd(a - 1, n)
    if 1 < g < n:
        return g
    if g == n:
        return None
    # stage 2: (B1, B2] の素数 q について a^q-1 を積んで一括gcd
    s2 = _stage2_primes(B1, min(B2, 30_000_000))
    if not s2:
        return None
    # 素数間ギャップ（偶数）ごとの a^gap を前計算
    a2 = gmpy2.powmod(a, 2, n)
    gap_pow = {2: a2}
    cur = a2
    for gp in range(4, 512, 2):
        cur = cur * a2 % n
        gap_pow[gp] = cur
    prev = int(s2[0])
    val = gmpy2.powmod(a, prev, n)
    acc = (val - 1) % n
    for idx in range(1, len(s2)):
        q = int(s2[idx])
        d = q - prev
        gp = gap_pow.get(d)
        if gp is None:
            val = gmpy2.powmod(a, q, n)
        else:
            val = val * gp % n
        acc = acc * (val - 1) % n
        prev = q
        if (idx & 8191) == 0:
            g = gmpy2.gcd(acc, n)
            if 1 < g < n:
                return g
            if deadline and time.time() > deadline:
                return None
    g = gmpy2.gcd(acc, n)
    if 1 < g < n:
        return g
    return None


# ===========================================================================
# 楕円曲線法 ECM （Montgomery曲線・XZ座標）
# ===========================================================================
def _xDBL(X, Z, a24, n):
    t = (X + Z)
    t = t * t % n
    u = (X - Z)
    u = u * u % n
    X2 = t * u % n
    w = (t - u) % n
    Z2 = w * (u + a24 * w) % n
    return X2, Z2


def _xADD(XP, ZP, XQ, ZQ, Xd, Zd, n):
    t = (XP - ZP) * (XQ + ZQ) % n
    u = (XP + ZP) * (XQ - ZQ) % n
    s = t + u
    d = t - u
    X3 = Zd * s % n * s % n
    Z3 = Xd * d % n * d % n
    return X3, Z3


def _ladder(k, X, Z, a24, n):
    """k*P を Montgomery ladder で計算（Pの差分を保ちながら）。"""
    if k == 1:
        return X, Z
    X0, Z0 = X, Z
    X1, Z1 = _xDBL(X, Z, a24, n)
    for b in bin(k)[3:]:
        if b == '1':
            X0, Z0 = _xADD(X0, Z0, X1, Z1, X, Z, n)
            X1, Z1 = _xDBL(X1, Z1, a24, n)
        else:
            X1, Z1 = _xADD(X0, Z0, X1, Z1, X, Z, n)
            X0, Z0 = _xDBL(X0, Z0, a24, n)
    return X0, Z0


def _stage1_multiplier(B1):
    """k = Π p^e (p^e <= B1) を前計算（B1ごとにワーカー内キャッシュ）。"""
    k = _K_CACHE.get(B1)
    if k is not None:
        return k
    k = mpz(1)
    for p in SMALL_PRIMES:
        if p > B1:
            break
        pe = p
        while pe * p <= B1:
            pe *= p
        k *= pe
    _K_CACHE[B1] = k
    return k


def _stage2_primes(B1, B2):
    """(B1, B2] の素数を array('I') で返す（区間篩・ワーカー内キャッシュ）。"""
    key = (B1, B2)
    cached = _S2_CACHE.get(key)
    if cached is not None:
        return cached
    res = array('I')
    seg = 1 << 20
    lo = B1 + 1
    base = SMALL_PRIMES
    while lo <= B2:
        hi = min(lo + seg - 1, B2)
        size = hi - lo + 1
        block = bytearray([1]) * size
        for p in base:
            pp = p * p
            if pp > hi:
                break
            start = pp if pp >= lo else ((lo + p - 1) // p) * p
            block[start - lo::p] = bytearray(len(range(start, hi + 1, p)))
        res.extend(lo + i for i in range(size) if block[i])
        lo = hi + 1
    _S2_CACHE[key] = res
    return res


def _ecm_one_curve(n, sigma, B1, B2):
    """1曲線分のECM（stage1 + stage2）。因数(int)を返すか None。"""
    n = mpz(n)
    sigma = mpz(sigma)
    # Suyama パラメトリゼーション
    u = (sigma * sigma - 5) % n
    v = (4 * sigma) % n
    vu = (v - u) % n
    num = vu * vu % n * vu % n * ((3 * u + v) % n) % n         # (v-u)^3 (3u+v)
    den = 16 * u % n * u % n * u % n * v % n                    # 16 u^3 v
    g = gmpy2.gcd(den, n)
    if g != 1:
        return int(g) if g != n else None
    a24 = num * gmpy2.invert(den, n) % n
    X = u * u % n * u % n
    Z = v * v % n * v % n

    # ---- stage 1 ----
    k = _stage1_multiplier(B1)
    X, Z = _ladder(k, X, Z, a24, n)
    g = gmpy2.gcd(Z, n)
    if 1 < g < n:
        return int(g)
    if g == n:
        return None

    # ---- stage 2 (BSGS 交差差分・最後に一括gcd) ----
    s2 = _stage2_primes(B1, B2)
    if not s2:
        return None
    D = max(2, int(gmpy2.isqrt(mpz(B2))))
    # baby steps: b*Q  (b = 1..D)
    bx = [None] * (D + 1)
    bz = [None] * (D + 1)
    bx[1], bz[1] = X, Z
    if D >= 2:
        bx[2], bz[2] = _xDBL(X, Z, a24, n)
    for b in range(3, D + 1):
        bx[b], bz[b] = _xADD(bx[b - 1], bz[b - 1], X, Z, bx[b - 2], bz[b - 2], n)
    # giant steps: a*D*Q  (a = a_min..a_max)
    a_min = B1 // D + 1
    a_max = B2 // D + 1
    Tx, Tz = _ladder(D, X, Z, a24, n)
    gx = {}
    gx[a_min] = _ladder(a_min, Tx, Tz, a24, n)
    if a_max >= a_min + 1:
        gx[a_min + 1] = _ladder(a_min + 1, Tx, Tz, a24, n)
        for a in range(a_min + 2, a_max + 1):
            gx[a] = _xADD(gx[a - 1][0], gx[a - 1][1], Tx, Tz,
                          gx[a - 2][0], gx[a - 2][1], n)
    # 積算
    acc = mpz(1)
    cnt = 0
    for qi in s2:
        q = int(qi)
        a = q // D + 1
        b = a * D - q
        if b < 1 or b > D:
            continue
        gg = gx.get(a)
        if gg is None:
            continue
        Ax, Az = gg
        acc = acc * ((Ax * bz[b] - bx[b] * Az) % n) % n
        cnt += 1
        if (cnt & 4095) == 0:
            g = gmpy2.gcd(acc, n)
            if 1 < g < n:
                return int(g)
    g = gmpy2.gcd(acc, n)
    if 1 < g < n:
        return int(g)
    return None


def _ecm_worker(args):
    """プールから呼ばれるトップレベル関数（1曲線）。"""
    n, sigma, B1, B2 = args
    try:
        return _ecm_one_curve(n, sigma, B1, B2)
    except Exception:
        return None


# ECMスケジュール:  (B1, その桁レベルで試すべきおおよその曲線数)
#   下から順に試し、割れなければ B1 を上げて深く掘る。
ECM_SCHEDULE = [
    (2_000,        30),    # ~15桁
    (11_000,       90),    # ~20桁
    (50_000,      300),    # ~25桁
    (250_000,     700),    # ~30桁
    (1_000_000,  1800),    # ~35桁
    (3_000_000,  5000),    # ~40桁
    (11_000_000, 10000),   # ~45桁（このマシンでは実質数日〜）
]

def _b2_for(B1):
    return min(50 * B1, 30_000_000)


# ===========================================================================
# SIQS finisher（SymPy）: ECMで割れなかった中規模の残りを時間制限付きで仕上げる
# ===========================================================================
def _sympy_factor_target(n, q):
    try:
        f = sympy.factorint(int(n))
        for pr in f:
            if 1 < pr < n:
                q.put(int(pr))
                return
    except Exception:
        pass
    q.put(None)


def siqs_finish(n, timeout):
    """SymPyのfactorintを別プロセスで実行し timeout 秒で強制終了。因数 or None。"""
    if not _HAS_SYMPY or timeout <= 0:
        return None
    ctx = multiprocessing.get_context("spawn")
    q = ctx.Queue()
    p = ctx.Process(target=_sympy_factor_target, args=(int(n), q))
    p.start()
    p.join(timeout)
    if p.is_alive():
        p.terminate()
        p.join()
        return None
    try:
        return q.get_nowait()
    except Exception:
        return None


# ===========================================================================
# エンジン本体
# ===========================================================================
class FactorizationEngine:
    def __init__(self, workers=None):
        self.workers = workers or max(1, multiprocessing.cpu_count())
        self.pool = ProcessPoolExecutor(max_workers=self.workers)
        print(f"システム: {self.workers} 個のCPUコアで並列準備完了 "
              f"(gmpy2 {gmpy2.version()} / GMP {gmpy2.mp_version()})")

    def shutdown(self):
        self.pool.shutdown(wait=False, cancel_futures=True)

    # -- 並列ECM: スケジュールを deadline まで登りながら因数を探す --
    def _parallel_ecm(self, n, deadline):
        n_dig = len(str(n))
        for B1, target_curves in ECM_SCHEDULE:
            if time.time() > deadline:
                return None
            B2 = _b2_for(B1)
            done = 0
            announced = False
            while done < target_curves:
                if time.time() > deadline:
                    return None
                wave = min(self.workers, target_curves - done)
                if not announced:
                    reach = {2000: 15, 11000: 20, 50000: 25, 250000: 30,
                             1000000: 35, 3000000: 40, 11000000: 45}.get(B1, "?")
                    print(f"    [ECM] B1={B1:,} (~{reach}桁級の因数を探索) "
                          f"…{self.workers}コア並列", flush=True)
                    announced = True
                args = [(int(n), random.randrange(6, 1 << 31), B1, B2)
                        for _ in range(wave)]
                for r in self.pool.map(_ecm_worker, args):
                    if r and 1 < r < n and n % r == 0:
                        return mpz(r)
                done += wave
        return None

    # -- 1個の合成数から非自明な因数を1つ取り出す --
    def _find_factor(self, n, deadline):
        n = mpz(n)
        # a) Fermat（近接因数）
        f = fermat(n, max_iters=120_000)
        if f and 1 < f < n:
            return f
        # b) Pollard ρ（小〜中の因数）
        rho_deadline = min(deadline, time.time() + 8.0)
        f = pollard_rho(n, deadline=rho_deadline)
        if f and 1 < f < n:
            return f
        # c) Pollard p-1（滑らかな p-1 狙い・安価）
        if time.time() < deadline:
            f = pollard_pm1(n, B1=1_000_000, B2=10_000_000,
                            deadline=min(deadline, time.time() + 6.0))
            if f and 1 < f < n:
                return f
        # d) 並列 ECM（主力）
        f = self._parallel_ecm(n, deadline)
        if f and 1 < f < n:
            return f
        # e) SIQS finisher（中規模の残りを SymPy で仕上げ）
        if len(str(n)) <= 100 and time.time() < deadline:
            remain = deadline - time.time()
            if remain > 5:
                print(f"    [SIQS] SymPyで仕上げを試行 (最大 {remain:.0f}秒)…", flush=True)
                f = siqs_finish(n, timeout=remain)
                if f and 1 < f < n:
                    return mpz(f)
        return None

    # -- 完全分解（再帰） --
    def factor(self, n, time_budget=120.0):
        n = mpz(n)
        start = time.time()
        result = []          # 確定した素因数
        unresolved = []      # 分解しきれなかった合成数

        # 1) 試し割り
        small, n = trial_division(n)
        result.extend(small)
        if n == 1:
            return sorted(int(x) for x in result), [], time.time() - start
        if gmpy2.is_prime(n, 25):
            result.append(n)
            return sorted(int(x) for x in result), [], time.time() - start

        # 2) 完全冪 n = base^e なら base を e 個に展開（base 自体も後で分解される）
        pw = as_perfect_power(n)
        if pw:
            base, e = pw
            work = [base] * e
        else:
            work = [n]

        # 3) 作業スタックを回して分解
        deadline = start + time_budget
        while work:
            m = mpz(work.pop())
            if m == 1:
                continue
            if gmpy2.is_prime(m, 25):
                result.append(m)
                continue
            # まず小因数を再度剥がす（再帰で出てきた合成数向け）
            small, m = trial_division(m)
            result.extend(small)
            if m == 1:
                continue
            if gmpy2.is_prime(m, 25):
                result.append(m)
                continue
            # 完全冪の再チェック
            pw = as_perfect_power(m)
            if pw:
                base, e = pw
                work.extend([base] * e)
                continue

            if time.time() > deadline:
                unresolved.append(m)
                continue

            d = self._find_factor(m, deadline)
            if d and 1 < d < m:
                work.append(d)
                work.append(m // d)
            else:
                unresolved.append(m)

        return (sorted(int(x) for x in result),
                sorted(int(x) for x in unresolved),
                time.time() - start)


# ===========================================================================
# 入力パース & CLI
# ===========================================================================
def parse_input(text):
    text = text.replace('×', '*').replace('＊', '*').strip()
    time_limit = None
    if '--time' in text:
        parts = text.split('--time')
        text = parts[0].strip()
        try:
            time_limit = float(parts[1].strip())
        except (ValueError, IndexError):
            pass
    text = text.replace(' ', '').replace(',', '')
    target = None
    try:
        if '^' in text and '*' not in text:
            base, exp = text.split('^')
            target = int(base) ** int(exp)
        elif '*' in text:
            target = mpz(1)
            for p in text.split('*'):
                if p:
                    target *= int(p)
            target = int(target)
        elif text.isdigit():
            target = int(text)
    except ValueError:
        pass
    return target, time_limit


def _report(target, result, unresolved, elapsed):
    print("\n--- 計算おわり ---")
    all_factors = sorted(result + unresolved)
    if len(result) == 1 and not unresolved:
        print(f">> 結果: {target} は素数でした。 ({elapsed:.2f}秒)")
        return
    # 検算
    prod = mpz(1)
    for f in all_factors:
        prod *= f
    parts = []
    for f in sorted(result):
        tag = "" if is_prime(f) else " (合成: 未分解)"
        parts.append(f"{f}{tag}")
    for f in sorted(unresolved):
        parts.append(f"{f} (⚠未分解の合成数)")
    print(f">> {target}")
    print("   = " + "\n   * ".join(parts))
    print(f"(所要 {elapsed:.2f}秒, 検算 {'OK' if prod == target else 'NG'})")
    if unresolved:
        big = max(unresolved)
        dig = len(str(big))
        print("\n[正直な報告] 残った合成数は、今回の予算内・この実装では分解できませんでした。")
        print(f"  未分解の合成数は {dig} 桁です。")
        print("  このエンジンの現実的な到達範囲(4コア純Python+GMP):")
        print("    ・ECM      … 最小の素因数が ~35〜40桁 程度まで")
        print("    ・SIQS仕上げ … 合成数全体が ~100桁 程度まで")
        if dig >= 110:
            print("  もしこれが2つの大きな素数の積（RSA型）なら、純ソフトウェアでは")
            print("  分解困難〜事実上不可能です（一般数体篩の世界記録=RSA-250=250桁, 約2700コア年）。")
        print("  時間を延ばして再挑戦するには末尾に  --time 秒数  を付けてください（例: --time 3600）。")


def main():
    engine = FactorizationEngine()
    print("=" * 55)
    print(" 高速素因数分解エンジン  (ECM並列 / 400桁対応)")
    print("=" * 55)
    print(" 使い方: 数字 / a*b / a^b を入力。 例) 12345678901234567")
    print("         時間制限:  <式> --time 600   (秒)")
    print("         終了:      exit")
    try:
        while True:
            user_input = input("\n> 割りたい数字を入力してください: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ('exit', 'quit'):
                break
            target, user_time = parse_input(user_input)
            if target is None or target <= 1:
                print(">> 2以上の正の整数、または a*b / a^b を入力してください。")
                continue
            budget = user_time if user_time is not None else 120.0
            print(f"\n--- 計算スタート ({len(str(target))}桁, 予算 {budget:.0f}秒) ---")
            result, unresolved, elapsed = engine.factor(target, time_budget=budget)
            _report(target, result, unresolved, elapsed)
    except (KeyboardInterrupt, EOFError):
        print("\n>> 計算を中止しました。")
    finally:
        engine.shutdown()
        print(">> プログラムを終了しました。")


if __name__ == '__main__':
    multiprocessing.freeze_support()
    main()
