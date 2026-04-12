# A.D.A. Tactical Command System

戦術支援AI ADAシステムのコマンドインターフェース。システム整合性の監視とコア動作の管理を行うリアルタイムダッシュボード。

## 概要

**A.D.A.** (Advanced Defensive Architecture) は、複数のコアモジュール（A、B、C）を持つハイブリッド戦術AI。リアルタイムでシステム状態を監視し、ユーザー入力に応じてコア動作を調整します。

## 主要機能

### コアシステム
- **Core Module (A, B, C)**: 3つの独立したコアモジュールで戦術判断を実施
- **Ruin Score**: システム不安定性の指標（0-1）
- **Sync Rate**: システム整合性パーセンテージ

### インタラクション
- チャットベースのコマンドインターフェース
- Gemini APIによるリアルタイムレスポンス生成
- JSON形式のシステムパラメータ自動調整

### 環境パラメータ (EF)
- **E0**: 安定性（Stability）
- **E1**: 周囲環境（Surroundings）
- **E2**: 評価値（Evaluation）
- **E3**: ノイズレベル（Noise Level）

### データ永続化
- Firebase Firestoreを使用したセッション管理
- コア状態、チャット履歴、環境パラメータ自動保存
- クラウド同期対応

## 技術スタック

- **フレームワーク**: React 18+
- **スタイリング**: Tailwind CSS
- **アイコン**: lucide-react
- **バックエンド**: Firebase (Auth, Firestore)
- **AI API**: Google Generative AI (Gemini)
- **状態管理**: React Hooks (useState, useRef, useMemo)

## セットアップ

### 必要な環境変数

```javascript
__firebase_config  // Firebase設定JSON
__app_id           // アプリケーションID（デフォルト: 'ada-tactical-v1'）
__initial_auth_token // 初期認証トークン（オプション）
```

### インストール

```bash
npm install
npm start
```

## 使用方法

1. アプリケーション起動時に自動的に認証を実施
2. チャットボックスにコマンドを入力
3. ADAがレスポンスを生成し、コアパラメータが自動調整
4. ダッシュボード右上のDatabase アイコンをクリックしてシステムコンソールを開く
5. コアベロシティと環境パラメータを手動調整可能

## システムパラメータ

### Core Velocity
各コア（A、B、C）の活動レベル（0-2）

### Ruin Score計算式
```
RuinScore = (強度合計/6) × 0.4 + (揮発性合計/3) × 0.3 + (EF影響/2) × 0.3
```

### Sync Rate
```
SyncRate = floor((1 - RuinScore) × 100)%
```

## ビジュアルフィードバック

- **Sync Rate > 75%**: シアン色（#00f7ff） - 安定状態
- **Sync Rate 40-75%**: ライム色（#a2ff00） - 注意状態
- **Sync Rate < 40%**: 赤色（#ff3300） - 警告状態

RuinScore > 0.6 で画面全体に赤いオーバーレイが表示され、システム不安定を視覚化。

## コールドリセット

システムコンソールの「Perform Cold Reset」ボタンで全パラメータを初期状態にリセット。

## ライセンス

Trial Phase - ABC_MOD

## 注記

- Firebase設定が存在しない場合、モックモードで動作
- APIキーは環境から読み込むか、コード内で設定必要
- モバイルデバイス対応（Tailwind responsive design）
