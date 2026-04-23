# UCD-F Avatar Demo

このプロジェクトは「UCD-F Avatar Demo」と題した、2Dアバターの動的シミュレーションデモです。

## 概要
- UCD-F（Universal Constrained Dynamics Framework）を用いた2Dアバターの物理挙動・制約下動的状態遷移のデモです。
- SoA（Structure of Arrays）アーキテクチャを採用し、GC負荷を抑えた設計です。
- マウスやタッチ操作でアバターの顔や髪の動きがリアルタイムに変化します。
- 負荷スライダーでシステムのデグラデーション挙動を体験できます。
- 主な実装ファイル: `main.html`

## 使い方
1. `main.html` をブラウザで開いてください。
2. マウスやタッチでアバターを操作できます。
3. UIパネルのスライダーで負荷やスムージングを調整できます。

## ディレクトリ構成
```
OTHER/
└── src/
    └── UCD-F Avatar Demo/
        ├── main.html
        └── README.md
```

## ライセンス
ライセンスについては、親ディレクトリのライセンスファイルを参照してください。
