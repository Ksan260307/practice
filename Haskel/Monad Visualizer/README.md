# Monad Visualizer

Haskellの**モナド**という概念を、インタラクティブなビジュアライゼーションで直感的に理解するための教育用ツール。複雑な関数型プログラミングの抽象化を、「箱」というメタファーで可視化します。

## 概要

モナドは関数型プログラミングの最も強力で抽象的な概念の一つです。しかし、教科書的な説明では理解しにくいため、このツールでは：

- 値を常に「箱」として扱う
- 計算ステップを視覚的なボックスで表示
- 正常値（Just）と失敗状態（Nothing）を色分け表示
- Bind操作（>>=）を矢印と説明テキストで可視化

という方法で、モナドの本質を直感的に交わします。

## 主要機能

### 1. Maybe モナド（結果型）

このツールで実装されている **Maybe モナド** は、計算が成功するか失敗するかを型安全に表現します。

#### Just (値が存在する状態)
- 計算が成功した状態
- 青いボックスで表示
- 値を含んでいる

#### Nothing (値が空である状態)
- 計算が失敗した状態
- 赤いボックスで表示
- 後続の計算が全てスキップされる

### 2. 計算ステップ

4つのステップで構成された処理パイプライン：

| ステップ | 操作 | 説明 |
|---------|------|------|
| 1. Input | 入力値 | ユーザーが設定した初期値 |
| 2. Double | × 2 | 値に2を乗じる |
| 3. Add Five | + 5 | 値に5を加える |
| 4. Square | ^ 2 | 値を2乗する |

例: 入力値 10 の場合
```
10 → (×2) → 20 → (+5) → 25 → (^2) → 625
```

### 3. Bind 操作（>>=）

モナドの心臓部となる結合子。各ステップ間の矢印で表現されます：

```haskell
(>>=) :: Maybe a -> (a -> Maybe b) -> Maybe b
```

**動作**：
1. 前のステップから値を取り出す（またはNothingを検出）
2. Nothingなら後続の計算を無視（SKIP）
3. 値があれば次の関数に渡す

### 4. 文脈の切り替え

#### Just モード（値が存在する）
- すべてのステップが計算される
- 通常の数値計算が実行される
- 青いボックスで表示

#### Nothing モード（値が空）
- 最初のステップで Nothing に
- 後続のすべての計算が自動的にスキップ
- 赤いボックスで表示
- プログラムが安全に失敗状態を伝播

### 5. 計算結果の例

| 入力値 | Just/Nothing | 最終結果 | 計算過程 |
|--------|-------------|--------|--------|
| 10 | Just | 625 | 10 → 20 → 25 → 625 |
| 0 | Just | 25 | 0 → 0 → 5 → 25 |
| 5 | Just | 225 | 5 → 10 → 15 → 225 |
| (any) | Nothing | Nothing | 全ステップスキップ |

## 技術スタック

- **フレームワーク**: React 18+
- **スタイリング**: Tailwind CSS
- **UI コンポーネント**: lucide-react
- **状態管理**: React Hooks (useState)

## セットアップ

### インストール

```bash
npm install
npm start
```

### 依存パッケージ
- react
- lucide-react
- tailwindcss

## 使用方法

### 基本操作

1. **1. 値をセット**:
   - スライダーで 0～50 の範囲から初期値を選択
   - リアルタイムで計算結果が更新される

2. **2. 文脈（コンテキスト）の切り替え**:
   - **「値が存在する (Just)」**: 通常モード、すべての計算が実行
   - **「値が空 (Nothing)」**: エラーモード、すべての計算がスキップ

3. **結果の観察**:
   - 各ステップのボックスに計算結果が表示
   - Bind操作の成功/スキップが矢印に表示

### インタラクティブな学習

#### 実験1: 正常な計算フロー
1. 「Just」を選択
2. スライダーを 10 に設定
3. 各ステップで計算が進む様子を観察
4. 最終値 625 に到達

#### 実験2: 失敗の伝播
1. 「Nothing」に切り替え
2. すべてのステップが Nothing に
3. "SKIP" という表示で計算がスキップされることを確認
4. 値が一度失敗すると、後続が全て失敗することを理解

#### 実験3: 初期値の変化
1. 「Just」を選択したまま
2. スライダーを段階的に変更（0→10→20→30）
3. 各値での中間結果と最終結果の変化を追跡

## UI コンポーネント

### モナド ボックス
各ステップを表現する 24×24px のボックス：

```
┌─────────────┐
│ Just Mode   │  ← 青いボックス、値を表示
│    [625]    │
└─────────────┘

┌─────────────┐
│ Nothing     │  ← 赤いボックス、"Nothing"と表示
│   Mode      │
└─────────────┘
```

### コネクター（矢印）
ステップ間を結ぶ矢印：

```
Just:    =====>  (正常に動作)
Nothing: =====>  SKIP (スキップされる)
```

### ラベル

各ボックス下部に **MAYBE** というラベルが表示され、これが Maybe 型モナドであることを強調します。

## モナドの本質

このツールを通じて理解できるモナドの3つの法則：

### 1. 左単位元則 (Left Identity)
```haskell
return a >>= f  ≡  f a
```
最初の値を箱に入れて計算するのは、直接計算するのと同じ。

### 2. 右単位元則 (Right Identity)
```haskell
m >>= return  ≡  m
```
値を取り出して再び箱に入れるのは、何もしないのと同じ。

### 3. 結合則 (Associativity)
```haskell
(m >>= f) >>= g  ≡  m >>= (\x -> f x >>= g)
```
計算の組み合わせ方の順序は結果に影響しない。

## 実装詳細

### 計算ロジック

```javascript
const calculateResults = () => {
  let current = showNone ? null : inputValue;
  const results = [];
  
  for (let i = 0; i < steps.length; i++) {
    if (i === 0) {
      results.push(current);  // 初期値
    } else {
      if (current === null) {
        results.push(null);    // Nothingなら伝播
      } else {
        current = steps[i].operation(current);  // 計算実行
        results.push(current);
      }
    }
  }
  return results;
};
```

### ステップ定義

```javascript
const steps = [
  { id: 1, label: "Input", operation: (x) => x },
  { id: 2, label: "Double (*2)", operation: (x) => x * 2 },
  { id: 3, label: "Add Five (+5)", operation: (x) => x + 5 },
  { id: 4, label: "Square (^2)", operation: (x) => x * x }
];
```

## Haskell との比較

### Haskell での実装

```haskell
main = do
  let value = Just 10
  result <- value >>= (\x -> return (x * 2))
                  >>= (\x -> return (x + 5))
                  >>= (\x -> return (x * x))
  print result  -- Just 625
```

### Python での同等の表現

```python
class Maybe:
    def bind(self, func):
        if self.value is None:
            return Maybe(None)
        else:
            return func(self.value)

value = Maybe(10)
result = value.bind(lambda x: Maybe(x * 2)) \
               .bind(lambda x: Maybe(x + 5)) \
               .bind(lambda x: Maybe(x * x))
# result.value = 625
```

### このツールでの可視化

上記の概念を、視覚的なボックスと矢印で表現。

## 学習パス

### 初級
1. Just モードでスライダーを動かす
2. 各ステップでの計算結果を確認
3. 最終結果がどのように計算されるか理解

### 中級
1. Nothing モードでのスキップ動作を理解
2. Bind操作（>>=）が値の有無で異なる動作をすることを認識
3. 失敗の伝播が自動的に行われることを確認

### 上級
1. モナド則（左単位元、右単位元、結合則）の具体例として観察
2. 計算の順序が結果に影響しないことを理由付ける
3. 他のモナド（List、Either など）の概念へ展開

## 応用例

### 実務プログラミング

- **エラーハンドリング**: Nothingで場合分けないで自動処理
- **オプション値**: null チェックなしでチェーン処理
- **非同期処理**: Promise モナドと同じパターン
- **データベースクエリ**: 複数の結合操作を安全に合成

### 関数型プログラミング

- **型安全性**: コンパイル時に失敗可能性がわかる
- **冗長性排除**: ボイラープレートコードが不要
- **再利用性**: 計算を組み合わせるだけで新しい処理が作成できる

## 注記

- このツールは教育目的で、Haskell の浅い理解向けです
- 実装は単純化されており、完全な Haskell セマンティクスではありません
- ステップ数は4に固定ですが、実際には任意の長さのパイプラインを構築できます
- より詳細な学習には Haskell 公式ドキュメントやオンラインコース（Learn You a Haskell など）を参照ください

## ライセンス

Monad Visualizer v1.0 - Educational Tool

## 参考文献

- Hutton, G. (2016). "Programming in Haskell"
- Lipovaca, M. (2011). "Learn You a Haskell for Great Good!"
- Haskell Official Documentation: https://www.haskell.org/
