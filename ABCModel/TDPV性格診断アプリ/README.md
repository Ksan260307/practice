# TDPV性格診断アプリ

12次元ベクトルモデル（TDPV: Twelve Dimensional Personality Vector）を使用した性格診断アプリケーション。チャット形式で7つの質問に答えると、あなたの「心のカタチ」が12軸で可視化されます。

## 概要

TDPV診断は、従来の性格タイプ分類ではなく、連続的な12の軸によってあなたの感性・行動傾向をスコア化します。Gemini APIによるAI分析により、各質問の回答をリアルタイムに解釈し、より正確なプロファイリングを実現します。

## 主要機能

### 12次元ベクトルモデル（TDPV）

以下の12軸で性格を多角的に評価します：

| 軸 | 日本語名 | 説明 |
|----|----------|------|
| 1 | Sensitivity | 感受性・繊細さ |
| 2 | Abstraction | 抽象思考度 |
| 3 | FocusDepth | 集中の深さ |
| 4 | SocialFit | 社交適応性 |
| 5 | InterpersonalDistance | 対人距離 |
| 6 | EmotionalRange | 感情変動幅 |
| 7 | SelfStandard | 自己基準の強さ |
| 8 | PracticalStability | 実践的安定性 |
| 9 | CreativityStyle | 創造性スタイル |
| 10 | Adaptability | 適応性 |
| 11 | ImpulseDynamics | 衝動性・ダイナミズム |
| 12 | ValueOrientation | 価値志向性 |

各軸は **1.0～5.0** のスケール（0.5刻み）で評価されます。

### 診断フロー

#### ステップ1: ウェルカム画面
- 診断の概要説明
- 「診断をはじめる」ボタンで開始

#### ステップ2: 質問フェーズ（7質問）

質問例：
1. 「最近、心が動いたこと（嬉しい・楽しい・感動したなど）はありますか？」
2. 「初めてのこと・知らないことに触れるとき、あなたはどう動くタイプですか？」
3. 「『一人の時間』と『人と一緒にいる時間』はどちらが好きですか？」
4. 「仕事や作業に没頭することはありますか？」
5. 「気持ちが揺れたり気分が変わりやすい方ですか？」
6. 「物事の筋道や美しさを重視するほうですか？」
7. 「理想よりも効率・現実を優先することは多いですか？」

各質問後、AIが回答を分析し、簡潔な解釈コメントと次の質問を提示します。

#### ステップ3: 結果表示
- 12軸のスコアをビジュアルバー表示
- 全体的な性格分析サマリー
- 診断をリセットして再度実施可能

### AIの役割

Gemini APIを使用して以下を実施：

1. **回答解釈**: 各質問の回答内容から心理傾向を分析
2. **スコア推定**: 回答に基づいて12軸の推定値を算出
3. **段階的分析**: 各段階で「この軸がやや高めに見えます」などのコメントを生成
4. **最終プロファイル**: 全7回答を総合して最終スコアとサマリーを作成

## 技術スタック

- **フレームワーク**: React 18+
- **スタイリング**: Tailwind CSS
- **UI コンポーネント**: lucide-react
- **AI API**: Google Generative AI (Gemini 2.5-flash-preview)
- **データ形式**: JSON
- **通信**: REST API

## セットアップ

### 必要な環境

- React 18 以上
- Google AIプラットフォームAPIキー（Gemini API）

### インストール

```bash
npm install
npm start
```

### 依存パッケージ
- react
- lucide-react

### APIキー設定

```javascript
// コード内（本番環境では環境変数推奨）
const API_KEY = "YOUR_GEMINI_API_KEY";
```

環境変数経由の設定：
```javascript
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
```

## 使用方法

### ユーザーの観点

1. **診断開始**: ホーム画面の「診断をはじめる」ボタンをクリック
2. **質問に回答**: チャットボックスに自由形式で回答を入力
3. **進行**: Enterキーまたは送信ボタンで次へ進む
4. **結果確認**: 最後の質問後、自動的に結果画面へ遷移
5. **再診断**: 結果画面からリセットボタンで再度診断可能

### デベロッパーの観点

```javascript
// 診断開始
startDiagnosis();

// 回答送信と分析
handleSend();

// AI分析呼び出し
callGeminiAnalysis(userAnswer, qIndex, isLast, previousAnswers);

// リセット
const resetDiagnosis = () => {
  setStep('welcome');
  setCurrentQIndex(0);
  setAnswers([]);
  setHistory([]);
  setFinalProfile(null);
};
```

## UIコンポーネント

### 画面状態

#### Welcome
- タイトルと説明
- スパークルアイコン
- 開始ボタン

#### Diagnosing
- 進捗表示（X / 7）
- チャット履歴エリア
- 入力フィールド
- 送信ボタン

#### Result
- グラデーション背景ヘッダー
- 12軸のバーチャート
- 分析サマリーカード
- リセットボタン

### ビジュアル要素

- **チャット吹き出し**: ユーザー回答は右青、AIコメント左白
- **プログレスバー**: 各軸を1～5段階のブロックで可視化
- **アニメーション**: フェードイン、スライドイン、バウンス

## APIレスポンスフォーマット

```json
{
  "analysis": "ユーザーへの返信メッセージ",
  "profile": {
    "scores": {
      "Sensitivity": 3.5,
      "Abstraction": 4.0,
      "FocusDepth": 3.0,
      // ... その他の軸
    },
    "summary": "全体的なサマリー文"
  }
}
```

## パラメータ構造

```javascript
// 質問オブジェクト
{
  id: 'Q1',
  text: "質問文",
  axes: ["該当する軸名1", "該当する軸名2", ...] // 質問がスコアする軸
}

// 回答履歴
{
  question: "質問文",
  answer: "ユーザーの回答"
}

// 最終プロファイル
{
  scores: { AxisName: score_val, ... },  // 12軸のスコア
  summary: "総合的な分析サマリー"
}
```

## キーロジック

### 質問ごとの軸マッピング

各質問は複数の軸に対応：

- **Q1** (心が動いたこと): Sensitivity, ValueOrientation
- **Q2** (新しいこと対応): Adaptability, ImpulseDynamics, Abstraction
- **Q3** (一人 vs 群れ): SocialFit, InterpersonalDistance
- **Q4** (没頭): FocusDepth, PracticalStability
- **Q5** (気分変動): EmotionalRange, ImpulseDynamics
- **Q6** (筋道・美しさ): SelfStandard, ValueOrientation, Abstraction
- **Q7** (理想 vs 効率): PracticalStability, ValueOrientation, Adaptability

### AI分析ロジック

1. 各回答をシステムプロンプトで分析
2. 12軸について各軸の推定スコア（1.0-5.0）を生成
3. 中間回答では「該当軸がやや高め」というやさしいコメント生成
4. 最終質問では全体的な人格サマリーを作成

### リトライ機構

Gemini API呼び出しが失敗した場合：
- 最大5回まで自動リトライ
- 指数バックオフ: 2秒、4秒、8秒、16秒、32秒

## エラーハンドリング

- **APIエラー**: 最大5回までリトライ後、「通信エラー」メッセージ表示
- **入力エラー**: 空の回答は送信不可
- **パース エラー**: JSON形式の不正な応答は処理スキップ

## レスポンシブデザイン

- モバイル対応（全画面スマートフォン表示）
- タッチフレンドリーなボタンサイズ
- チャット履歴の自動スクロール

## ユースケース

- **自己理解**: 自分の性格特性を多角的に理解したい
- **適職発見**: 性格と職業適性のマッチング
- **コミュニケーション改善**: 対人関係の相互理解
- **心理研究**: 性格特性の定量化と分析
- **心理学教育**: TDPV概念の理解と活用

## 注記

- このアプリは医学的な診断ツールではありません
- Gemini APIの利用制限に準じます
- テキスト入力はGoogleサーバーに送信されます
- 返答の精度はユーザーの入力品質に依存します

## ライセンス

TDPV性格診断 v1.0

## 参考資料

- 12次元ベクトルモデル（TDPV: Twelve Dimensional Personality Vector）
- Google Generative AI Platform
- Psychology & Personality Assessment
