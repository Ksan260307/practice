# 姿勢リセット習慣 (Posture Reminder App)

定期的にスマホに通知を送り、「意識ではなく仕組み」で姿勢を正すためのAndroidアプリです。

## アプリのコンセプト

* **30分ごとの強制リセット**: 意識は続かないため、外部からのトリガーで気づかせます。
* **シンプルなアクション**: 通知が鳴ったら「10秒間、肩を回して胸を開く」だけ。
* **習慣化のサポート**: 最小限の操作でリマインダーを開始できます。

## 開発環境

* **言語**: Kotlin
* **UI フレームワーク**: Jetpack Compose
* **バックグラウンド処理**: WorkManager (定期実行)
* **ターゲット**: Android 8.0 (API 26) 以上推奨

## ファイル配置ガイド

Android Studioで「Empty Compose Activity」プロジェクトを作成した後、以下のように配置してください。

1. **MainActivity.kt**
   * パス: `app/src/main/java/com/posture/reminder/MainActivity.kt`
   * アプリのメインロジック、画面表示、通知処理が含まれています。

2. **build.gradle (Module :app)**
   * `dependencies` ブロックに以下を追加してください。
   ```gradle
   implementation "androidx.work:work-runtime-ktx:2.9.0"
   ```

3. **AndroidManifest.xml**
   * 通知権限（Android 13以降用）を `<manifest>` タグ直下に追加してください。
   ```xml
   <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
   ```

## 使い方

1. アプリを起動します。
2. 「リマインダーを開始」ボタンをタップします。
3. 30分ごとに通知が届きます。
4. 通知が届いたら、作業を中断して10秒間肩を回しましょう。

## ストア公開に向けたチェックリスト

* [ ] アプリ用アイコン（姿勢を正すイメージ）の作成。
* [ ] 通知の鳴動時間帯制限（夜間は鳴らさない等）の実装検討。
* [ ] Google Play Consoleへの登録準備。