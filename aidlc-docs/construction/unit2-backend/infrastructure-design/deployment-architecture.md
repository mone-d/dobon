# Deployment Architecture - Unit 2 (Backend - Game Logic)

## 概要

Unit 2（バックエンド - ゲームロジック）のデプロイメントアーキテクチャを定義する。

---

## 1. 全体アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────┐
│                      ユーザーブラウザ                        │
│              (iOS Safari / Android Chrome)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
           ┌───────────┼───────────┐
           │ HTTPS     │ WSS       │
           │           │           │
┌──────────▼──────┐ ┌──▼──────────────────────────────────┐
│  Vercel CDN     │ │         Heroku                       │
│  (Frontend)     │ │  dobon-backend.herokuapp.com         │
│  Vue.js 3 SPA   │ │                                      │
│                 │ │  ┌────────────────────────────────┐  │
│  vercel.app     │ │  │  Express.js + Socket.io        │  │
└─────────────────┘ │  │  Node.js 18 LTS                │  │
                    │  │                                │  │
                    │  │  ┌──────────────────────────┐  │  │
                    │  │  │  GameSocketHandler       │  │  │
                    │  │  │  (Socket.io イベント)    │  │  │
                    │  │  └──────────────────────────┘  │  │
                    │  │                                │  │
                    │  │  ┌──────────────────────────┐  │  │
                    │  │  │  Game Logic Layer        │  │  │
                    │  │  │  GameEngine              │  │  │
                    │  │  │  DoboDeclaration         │  │  │
                    │  │  │  MultiplierCalculator    │  │  │
                    │  │  │  DeckManager             │  │  │
                    │  │  │  CardValidator           │  │  │
                    │  │  │  PaymentCalculator       │  │  │
                    │  │  └──────────────────────────┘  │  │
                    │  │                                │  │
                    │  │  ┌──────────────────────────┐  │  │
                    │  │  │  Memory (sessionMap)     │  │  │
                    │  │  │  Map<roomId, GameSession> │  │  │
                    │  │  └──────────────────────────┘  │  │
                    │  └────────────────────────────────┘  │
                    └──────────────────────────────────────┘
                                      │
                                      │ Firebase SDK
                                      │ (ゲーム結果書き込み)
                              ┌───────▼──────────┐
                              │ Firebase         │
                              │ Realtime DB      │
                              │ (Unit 1 と共有)  │
                              └──────────────────┘
```

---

## 2. デプロイメント環境

### 2.1 開発環境

**構成**:
- バックエンド: ローカル（`ts-node-dev`）
- フロントエンド: ローカル（`vite dev`）
- 通信: HTTP/WS（localhost）

**起動手順**:
```bash
# リポジトリルートから
cd backend
npm install
npm run dev  # ts-node-dev で起動（ポート3000）

# 別ターミナルで
cd frontend
npm install
npm run dev  # Vite で起動（ポート5173）
```

**環境変数** (`backend/.env.development`):
```
PORT=3000
NODE_ENV=development
```

### 2.2 本番環境（Heroku）

**構成**:
- バックエンド: Heroku Eco Dynos
- フロントエンド: Vercel（Unit 1）
- 通信: HTTPS/WSS

**デプロイ手順**:
```bash
# 初回セットアップ
heroku create dobon-backend
heroku buildpacks:set heroku/nodejs --app dobon-backend

# モノレポの場合（backend/ ディレクトリを指定）
heroku buildpacks:add --index 1 heroku-community/multi-procfile --app dobon-backend
heroku config:set PROCFILE=backend/Procfile --app dobon-backend

# 環境変数設定
heroku config:set NODE_ENV=production --app dobon-backend

# デプロイ
git push heroku main
```

**Procfile** (`backend/Procfile`):
```
web: node dist/index.js
```

---

## 3. デプロイメントパイプライン

```
┌─────────────────────────────────────────────────────────┐
│ 1. ローカル開発                                          │
│    cd backend && npm run dev                            │
│    TypeScript でコーディング                            │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ 2. ローカルテスト                                        │
│    npm run test（Jest）                                 │
│    npm run build（TypeScript コンパイル確認）           │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ 3. Git コミット・プッシュ                                │
│    git add backend/                                     │
│    git commit -m "feat: add game logic"                 │
│    git push origin main                                 │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ 4. Heroku 自動デプロイ（GitHub 連携）                    │
│    または手動: git push heroku main                     │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ 5. Heroku ビルド                                        │
│    npm install                                         │
│    npm run build（tsc → dist/）                        │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ 6. Heroku 起動                                          │
│    node dist/index.js                                  │
│    ポート: process.env.PORT（Heroku が自動割り当て）    │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ 7. 本番環境で稼働                                       │
│    https://dobon-backend.herokuapp.com                 │
│    wss://dobon-backend.herokuapp.com                   │
└─────────────────────────────────────────────────────────┘
```

---

## 4. モノレポ構成

```
dobon/                              # GitHub リポジトリルート
├── frontend/                       # Unit 1 (Vue.js フロントエンド)
│   ├── src/
│   │   ├── components/
│   │   ├── stores/
│   │   ├── views/
│   │   └── ...
│   ├── package.json
│   ├── vite.config.ts
│   ├── .env.development
│   ├── .env.production
│   └── vercel.json                 # rootDirectory: "frontend"
│
├── backend/                        # Unit 2 (Node.js バックエンド)
│   ├── src/
│   │   ├── index.ts
│   │   ├── game/
│   │   ├── socket/
│   │   └── utils/
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   ├── Procfile                    # web: node dist/index.js
│   ├── .env.development
│   └── README.md
│
└── README.md                       # プロジェクト全体の説明
```

---

## 5. 環境変数

### バックエンド開発環境 (`backend/.env.development`)
```
PORT=3000
NODE_ENV=development
```

### バックエンド本番環境（Heroku Config Vars）
```
NODE_ENV=production
# PORT は Heroku が自動設定（設定不要）
```

### フロントエンド本番環境 (`frontend/.env.production`) - Unit 1 側の更新
```
VITE_API_BASE_URL=https://dobon-backend.herokuapp.com
VITE_WS_URL=wss://dobon-backend.herokuapp.com
```

---

## 6. ネットワークフロー

### ゲームプレイフロー

```
ユーザー（ブラウザ）
  │
  │ 1. WSS 接続確立
  ▼
Heroku (dobon-backend.herokuapp.com)
  │
  │ 2. socket.on('room:join') → Socket.io Room 参加
  │ 3. socket.on('game:start') → GameEngine.startGame()
  │ 4. io.to(roomId).emit('game:started') → 全プレイヤーに通知
  │
  │ 5. socket.on('game:play-card') → GameEngine.playCard()
  │ 6. 各プレイヤーに game:state-updated を個別送信
  │
  │ 7. socket.on('game:declare-dobo') → DoboDeclaration.declareDobo()
  │ 8. io.to(roomId).emit('game:dobo') → 全プレイヤーに通知
  │ 9. setTimeout(10秒) → タイムアウト処理
  │
  │ 10. ゲーム終了 → PaymentCalculator → GameResult 生成
  │ 11. io.to(roomId).emit('game:ended') → 全プレイヤーに通知
  ▼
Firebase Realtime DB（ゲーム結果保存）
```

---

## 7. Heroku セットアップ手順

### 初回セットアップ

```bash
# 1. Heroku CLI インストール
# https://devcenter.heroku.com/articles/heroku-cli

# 2. Heroku ログイン
heroku login

# 3. アプリ作成
heroku create dobon-backend

# 4. モノレポ設定（backend/ ディレクトリをルートとして扱う）
heroku buildpacks:add --index 1 heroku-community/multi-procfile
heroku config:set PROCFILE=backend/Procfile

# 5. Node.js buildpack 設定
heroku buildpacks:set heroku/nodejs

# 6. 環境変数設定
heroku config:set NODE_ENV=production

# 7. GitHub 連携（Heroku ダッシュボードで設定）
# Dashboard → Deploy → GitHub → Connect to GitHub
# → Enable Automatic Deploys

# 8. 初回デプロイ
git push heroku main
```

### ログ確認

```bash
# リアルタイムログ確認
heroku logs --tail --app dobon-backend

# 過去のログ確認
heroku logs -n 200 --app dobon-backend
```

### Dyno 管理

```bash
# Dyno 状態確認
heroku ps --app dobon-backend

# Dyno 再起動
heroku restart --app dobon-backend
```

---

## 8. デプロイメントチェックリスト

### 初回セットアップ
- [ ] Heroku アカウント作成
- [ ] Heroku CLI インストール
- [ ] `heroku create dobon-backend`
- [ ] モノレポ用 buildpack 設定
- [ ] 環境変数設定（`NODE_ENV=production`）
- [ ] GitHub 連携・自動デプロイ設定
- [ ] 初回デプロイ確認（`heroku logs --tail`）

### フロントエンド側の更新（Unit 1）
- [ ] `frontend/.env.production` の API URL を Heroku URL に更新
- [ ] Vercel の環境変数を更新
- [ ] フロントエンドを再デプロイ

### 動作確認
- [ ] `https://dobon-backend.herokuapp.com` にアクセスして起動確認
- [ ] WebSocket 接続確認（フロントエンドから接続テスト）
- [ ] ゲームフロー動作確認
