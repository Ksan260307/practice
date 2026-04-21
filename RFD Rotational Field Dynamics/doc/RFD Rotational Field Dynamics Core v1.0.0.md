# Rotational Field Dynamics（RFD）設計書

## 1. 概要

本設計書は、「回転」「ベロシティ（10段階）」「力場」「収束」「黄金比」を基盤としたダイナミクスモデルを定義し、汎用的にプロダクトへ適用可能なフレームワークとして体系化することを目的とする。

本モデルは、時間変化する状態を「回転」として捉え、その回転に伴い発生する力（影響度）を定量化し、最終的に収束へ導く構造を持つ。

---

## 2. コアコンセプト

### 2.1 回転（Rotation）

すべての状態変化は周期性を持つ回転運動として扱う。

* **状態：** 角度 $\theta(t)$。
* **数値的安定性：** 内部位相 $\theta$ は常に $[0, 2\pi)$ の範囲で正規化（Wrapping）を行う。
* **サブステッピング：** 高速回転時の計算精度を担保するため、角速度が閾値を超える場合は、1フレームの更新（$dt$）を細分化して演算を行う。
* **揺らぎ（Jitter）：** 黄金角（約137.508度）をベースとした決定論的な摂動を加え、機械的な周期性を排する。

### 2.2 ベロシティ（Velocity: 10段階）

ベロシティは回転速度を決定する離散パラメータとする。

* **定義域：** $v \in \{0, 1, 2, \dots, 10\}$。$v=0$ を完全停止とする。
* **幾何級数マッピング：** 角速度 $\omega$ への写像は指数関数的に定義し、人間の感覚的な等比性を実現する。
* **動的追従：** $v$ 設定時は目標角速度 $\omega_{target}$ へ向けて滑らかに補間（Lerp）を行う。

### 2.3 力場（Field）

回転により生成される影響度を力場として定義する。

$$F(t) = A \times |\sin(\theta(t))|^k \times \omega(t)^n$$

* **形状係数 $k$：** 力場の鋭敏度を制御する。
* **エネルギー指数 $n$：** 速度低下に伴う振幅の減衰度を制御する。標準値 $n=2$ では物理的な運動エネルギーに近似した減衰感を得られる。
* **出力の正規化：** システムは絶対値 $F$ に加え、$\omega_{max}$ 時の最大出力を $1.0$ とした正規化値 $F_{norm}$ を提供する。

### 2.4 位相イベント（Phase Events）

周期的な動態における特定のタイミングをイベントとして検知する。

* **ゼロクロス検知：** 位相が $\pi$（半周）または $2\pi$（全周）を跨いだ瞬間にフラグを立て、視覚・触覚的なフィードバック（バイブレーション、SE等）との同期を可能にする。

### 2.5 収束（Convergence）

回転は外部入力が途絶えた後、黄金比に基づいた減衰定数を用い、自然に収束する。

* **減衰定数：** $\lambda = \ln(\phi) \approx 0.4812$。
* **自然停止：** 入力が途絶えた「自由減衰フェーズ」において、単位時間あたり速度を $1/\phi$ の比率で減衰させる。

---

## 3. 数理モデル

### 3.1 状態方程式

**目標角速度：**
$v > 0$ のとき：
$$\omega_{target} = \omega_{min} \times \left(\frac{\omega_{max}}{\omega_{min}}\right)^{\frac{v-1}{9}}$$

**時間発展：**
1.  **能動追従（Active）：** $\omega(t + \Delta t) = \text{lerp}(\omega(t), \omega_{target}, \alpha)$
2.  **自由減衰（Decay）：** $v=0$ のとき： $\omega(t + \Delta t) = \omega(t) \times \phi^{-\Delta t \cdot f}$
3.  **サブステッピング：** $\omega \cdot \Delta t > \pi/2$ の場合、$\Delta t$ を $N$ 分割して更新を繰り返す。
4.  **位相更新：** $\theta(t + \Delta t) = (\theta(t) + \omega(t) \cdot \Delta t + \xi) \pmod{2\pi}$

### 3.2 力場方程式

$$F(t) = A \times |\sin(\theta(t))|^k \times \omega(t)^n$$

**正規化出力：**
$$F_{norm}(t) = |\sin(\theta(t))|^k \times \left(\frac{\omega(t)}{\omega_{max}}\right)^n$$

---

## 4. システム構造

### 4.1 入力

| パラメータ | 内容 |
| :--- | :--- |
| **velocity_level** | 0〜10の離散値 |
| **impulse ($I$)** | 外部から注入される角速度増分 |
| **friction ($f$)** | 環境摩擦係数 |
| **env_params** | $\omega_{min}, \omega_{max}, \alpha, \text{sub\_steps}$ |

### 4.2 出力

* **force_value：** 影響度スコア（絶対値）
* **norm_force：** 正規化されたスコア（$0.0 \sim 1.0$）
* **phase_event：** 半周・全周到達時のイベントフラグ
* **convergence_state：** 完全停止フラグ

---

## 5. 処理フロー

1.  **速度更新：** $v$ レベルに応じた $\omega_{target}$ への追従、または自由減衰を実行。
2.  **サブステッピング分割：** 現在の $\omega$ に基づき、最適なステップ数 $N$ を算出しループを開始。
3.  **回転更新：** $\theta$ を加算。更新前後の位相を比較し `phase_event` を判定。
4.  **正規化・算出：** $\omega_{max}$ との比率から $F_{norm}$ を計算し、出力を生成。
5.  **零化判定：** $\omega$ が絶対閾値 $\omega_{\epsilon}$ を下回った場合、状態を完全零化。

---

## 6. 収束条件

* **絶対速度閾値：** $\omega < \omega_{\epsilon}$（標準: $0.001$）
* **理論的収束時間：** 停止までの予測時間 $T_{conv}$ を算出し、タイムアウト監視に利用する。

---

## 7. 抽象インターフェース

```pseudo
class RFDSystem:
    init(v, theta0, A, env):
        self.phi = 1.6180339887
        self.omega = 0.0
        self.theta = theta0 % (2 * PI)
        self.A = A
        self.env = env # omega_min, omega_max, friction, k, n, alpha, sub_steps

    update(v_level, dt, impulse = 0):
        self.omega += impulse
        
        # 1. 速度更新
        if v_level > 0:
            target = env.omega_min * pow(env.omega_max / env.omega_min, (v_level - 1) / 9)
            self.omega = lerp(self.omega, target, env.alpha)
        else:
            self.omega *= pow(self.phi, -dt * env.friction)

        # 2. 収束判定
        if self.omega < 0.001:
            self.omega = 0
            return 0, 0, self.theta, true
        
        # 3. サブステッピング & 位相更新
        sub_dt = dt / env.sub_steps
        event_triggered = false
        for i in range(env.sub_steps):
            prev_theta = self.theta
            self.theta = (self.theta + self.omega * sub_dt) % (2 * PI)
            # ゼロクロス検知 (0 or PI を跨いだか)
            if floor(prev_theta / PI) != floor(self.theta / PI):
                event_triggered = true
        
        # 4. 力場算出
        sin_val = pow(abs(sin(self.theta)), env.k)
        F = self.A * sin_val * pow(self.omega, env.n)
        F_norm = sin_val * pow(self.omega / env.omega_max, env.n)
        
        return F, F_norm, event_triggered, false

    export_state():
        return {theta: self.theta, omega: self.omega}
```

---

## 8. 応用パターン

### 8.1 触覚同期UX
`phase_event` をトリガーに Haptics（振動）を生成。速度 $\omega$ に応じて振動の強弱を $F_{norm}$ で制御することで、機械的な回転体を手で触れているような質感を再現する。

### 8.2 パフォーマンス最適化
高負荷環境では、$k=2$ 時に `pow(abs(sin), k)` を `(s*s)` に置き換える最適化パスを適用する。また、$\theta$ の更新にサイン・ルックアップテーブル（LUT）を併用し、計算コストを低減する。

---

## 9. 制約と注意点

* **浮動小数点の精度：** 長時間稼働時は $\theta$ の正規化を厳密に行い、精度の累積誤差を排除すること。
* **エイリアシング：** 高速回転時に $F$ のサンプリングが疎にならないよう、`sub_steps` を適切に設定すること。

---

## 10. 結論

本フレームワークは、回転と黄金比という普遍的原理に、数値的安定性と実用的なイベント制御を統合したものである。物理現象としての美しさを保ちつつ、マルチプラットフォームでの柔軟な実装を可能にする。