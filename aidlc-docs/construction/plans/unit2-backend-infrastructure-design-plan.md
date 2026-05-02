# Infrastructure Design Plan - Unit 2 (Backend - Game Logic)

## プラン概要

**ユニット**: Unit 2 - Backend Game Logic  
**フェーズ**: CONSTRUCTION - Infrastructure Design  
**目的**: バックエンドのインフラ設計（Heroku + Socket.io）

---

## 既に決定済みの事項（前工程より）

以下は NFR Requirements / NFR Design で既に決定済みのため、質問不要：

- **ホスティング**: Heroku（Eco Dynos）
- **ランタイム**: Node.js 18 LTS
- **フレームワーク**: Express.js + Socket.io
- **CORS**: 全オリジン許可
- **ログ**: コンソール出力のみ（Heroku ダッシュボードで確認）
- **認証**: なし（POCレベル）
- **永続化**: なし（メモリのみ）
- **SSL/TLS**: Heroku 自動管理

---

## 質問セクション

### セクション 1: デプロイメント環境

#### Q1.1 Heroku アプリ名
Heroku アプリの名前はどうしますか？（URLに使用: `https://<app-name>.herokuapp.com`）

**選択肢**:
- A: `dobon-backend`（シンプル）
- B: `dobon-game-server`（説明的）
- C: 後で決める（仮名で進める）

[Answer]: A

#### Q1.2 GitHub リポジトリ構成
フロントエンド（Unit 1）とバックエンド（Unit 2）のリポジトリ構成はどうしますか？

**選択肢**:
- A: モノレポ（1つのリポジトリに frontend/ と backend/ ディレクトリ）
- B: 別リポジトリ（frontend と backend を分けて管理）
- C: まだ決めていない

[Answer]: A

---

### セクション 2: ネットワーク

#### Q2.1 フロントエンドからバックエンドへの接続
フロントエンド（Vercel）からバックエンド（Heroku）への接続 URL の形式を確認します。

**想定構成**:
- REST API: `https://<app-name>.herokuapp.com/api/...`
- WebSocket: `wss://<app-name>.herokuapp.com`

この構成で問題ありませんか？

**選択肢**:
- A: 問題ない（上記の構成で進める）
- B: カスタムドメインを使いたい（例: `api.dobon.example.com`）

[Answer]: A
---

## 次のステップ

このプランの全ての質問に回答した後、以下の成果物を生成します：

1. **infrastructure-design.md**: バックエンドのインフラ設計
2. **deployment-architecture.md**: デプロイメントアーキテクチャ

---

## チェックリスト

- [x] セクション 1: デプロイメント環境（2問）
- [x] セクション 2: ネットワーク（1問）

**合計**: 3問
