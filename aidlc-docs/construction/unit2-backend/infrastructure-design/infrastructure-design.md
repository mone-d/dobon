# Infrastructure Design - Unit 2 (Backend - Game Logic)

## 概要

Unit 2（バックエンド - ゲームロジック）のインフラストラクチャ設計を定義する。
POCレベルのシンプルな構成で、Heroku 上で Express.js + Socket.io を動作させる。

---

## 1. デプロイメント環境

### 1.1 クラウドプロバイダー

**選定**: Heroku

**理由**:
- WebSocket（Socket.io）対応
- GitHub 連携で自動デプロイ
- HTTPS/WSS を自動提供
- Eco Dynos で無料枠あり
- コンソールログを Heroku ダッシュボードで確認可能

**アプリ名**: `dobon-backend`
**URL**: `https://dobon-backend.herokuapp.com`

### 1.2 環境構成

**開発環境**: ローカル（`node src/index.ts` または `ts-node-dev`）
**本番環境**: Heroku（Eco Dynos）

---

## 2. コンピュート インフラストラクチャ

### 2.1 Heroku Dyno

**選定**: Eco Dynos

**特徴**:
- 月550時間の無料枠
- 30分アクセスがないとスリープ（POCレベルで許容）
- WebSocket 対応
- HTTPS/WSS 自動提供

**注意点**:
- スリープ中は WebSocket 接続が切れる
- 使う前にブラウザでアクセスして起動する必要がある
- 本番化時は Standard Dyno（有料）に移行推奨

### 2.2 プロセス設定

**Procfile**:
```
web: node dist/index.js
```

**ビルドコマンド**:
```bash
npm run build  # TypeScript → JavaScript (dist/)
```

---

## 3. ストレージ インフラストラクチャ

### 3.1 ゲームセッション

**選定**: メモリのみ（永続化なし）

**理由**:
- POCレベルで許容
- サーバー再起動でセッションはリセット
- データベース不要でシンプル

**実装**:
```typescript
// メモリ上の Map で管理
const sessionMap = new Map<string, GameSession>();
```

### 3.2 ゲーム履歴・統計

**選定**: Unit 1 と共有（Firebase Realtime Database）

**理由**:
- Unit 1 のインフラ設計で決定済み
- バックエンドからゲーム終了時に Firebase に書き込む
- フロントエンドが Firebase から読み込む

**バックエンドからの書き込み**:
```typescript
// ゲーム終了時に Firebase に GameResult を保存
// Unit 4（History & Statistics）で実装予定
```

---

## 4. ネットワーク インフラストラクチャ

### 4.1 エンドポイント

**REST API**:
- 開発: `http://localhost:3000/api/...`
- 本番: `https://dobon-backend.herokuapp.com/api/...`

**WebSocket**:
- 開発: `ws://localhost:3000`
- 本番: `wss://dobon-backend.herokuapp.com`

### 4.2 フロントエンドとの接続

**Unit 1（フロントエンド）の環境変数更新**:
```
# .env.production（Unit 1 側）
VITE_API_BASE_URL=https://dobon-backend.herokuapp.com
VITE_WS_URL=wss://dobon-backend.herokuapp.com
```

### 4.3 CORS 設定

**選定**: 全オリジン許可（POCレベル）

```typescript
app.use(cors({ origin: '*' }));
const io = new Server(httpServer, { cors: { origin: '*' } });
```

### 4.4 SSL/TLS

**選定**: Heroku 自動管理

- Heroku が自動で HTTPS/WSS を提供
- Let's Encrypt 証明書を自動取得・更新
- 追加設定不要

---

## 5. 監視 インフラストラクチャ

### 5.1 ロギング

**選定**: コンソール出力のみ

**確認方法**:
```bash
# Heroku CLI でログ確認
heroku logs --tail --app dobon-backend
```

**ログ形式**:
```
[2026-05-02T00:00:00.000Z] [INFO] Server started on port 12345
[2026-05-02T00:00:05.000Z] [INFO] Player joined room {"roomId":"room-1","playerId":"p1"}
[2026-05-02T00:00:10.000Z] [INFO] Game started {"sessionId":"session-123"}
```

### 5.2 エラー監視

**選定**: なし（POCレベル）

エラーはコンソールログで確認する。

---

## 6. セキュリティ インフラストラクチャ

### 6.1 認証

**選定**: なし（POCレベル）

ゲストIDをプレイヤー識別子として使用。JWT・セッション認証は不要。

### 6.2 通信暗号化

**開発環境**: HTTP/WS（ローカル）
**本番環境**: HTTPS/WSS（Heroku 自動）

---

## 7. 共有インフラストラクチャ

### 7.1 Unit 1 との共有

| インフラ | Unit 1 | Unit 2 |
|---|---|---|
| フロントエンドホスティング | Vercel | - |
| バックエンドホスティング | - | Heroku |
| データベース | Firebase Realtime DB | Firebase Realtime DB（共有） |
| SSL/TLS | Vercel 自動 | Heroku 自動 |

### 7.2 リポジトリ構成

**選定**: モノレポ（Q1.2: 回答A）

```
dobon/                          # リポジトリルート
├── frontend/                   # Unit 1 (Vue.js)
│   ├── src/
│   ├── package.json
│   └── vercel.json
├── backend/                    # Unit 2 (Node.js)
│   ├── src/
│   ├── package.json
│   └── Procfile
└── README.md
```

**Vercel のデプロイ設定**（`vercel.json`）:
```json
{
  "rootDirectory": "frontend"
}
```

**Heroku のデプロイ設定**:
```
# Heroku の "Root Directory" を backend/ に設定
# または heroku-buildpack-monorepo を使用
```

---

## 8. インフラストラクチャコンポーネント一覧

| コンポーネント | 選定 | 備考 |
|---|---|---|
| ホスティング | Heroku Eco Dynos | WebSocket対応、無料枠 |
| ランタイム | Node.js 18 LTS | TypeScript → JS ビルド |
| プロセス管理 | Procfile | `web: node dist/index.js` |
| セッション管理 | メモリ（Map） | 再起動でリセット |
| データベース | Firebase（共有） | ゲーム履歴・統計のみ |
| CORS | 全オリジン許可 | POCレベル |
| SSL/TLS | Heroku 自動 | Let's Encrypt |
| ロギング | コンソール出力 | `heroku logs --tail` |
| 認証 | なし | POCレベル |
| リポジトリ | モノレポ | frontend/ + backend/ |

---

## 9. 本番化への移行ガイドライン

- [ ] Heroku Standard Dyno に移行（スリープなし）
- [ ] CORS を Vercel ドメインのみに制限
- [ ] JWT 認証の導入
- [ ] Sentry でエラー監視
- [ ] Redis でセッション永続化（再起動対応）
