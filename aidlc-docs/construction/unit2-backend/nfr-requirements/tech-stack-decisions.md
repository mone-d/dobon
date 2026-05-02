# Tech Stack Decisions - Unit 2 (Backend - Game Logic)

## 概要

Unit 2（バックエンド - ゲームロジック）の技術スタック選定理由を記載する。
Unit 1（フロントエンド）との整合性を保ちつつ、POCレベルに適したシンプルな構成を選定した。

---

## 1. ランタイム

### 選定: Node.js 18 LTS 以上

**理由**:
1. **Unit 1 との統一**: フロントエンドと同じ言語（TypeScript）でコード共有が可能
2. **ユーザーの経験**: Node.js に親しんでいる
3. **WebSocket 親和性**: Socket.io との相性が良い
4. **非同期処理**: ゲームのリアルタイム処理に適したイベントループ

**決定**: **Node.js 18 LTS** を採用

---

## 2. 言語

### 選定: TypeScript

**理由**:
1. **Unit 1 との統一**: フロントエンドと同じ言語でドメインエンティティを共有可能
2. **型安全性**: ゲームロジックの複雑な状態管理を型で保護
3. **開発効率**: IDEのインテリセンスでゲームロジック実装を効率化
4. **バグ防止**: コンパイル時に型エラーを検出

**設定**:
- strict mode: 有効
- target: ES2020 以上

**決定**: **TypeScript** を採用

---

## 3. バックエンドフレームワーク

### 選定: Express.js

**理由**:
1. **シンプルさ**: 最小限の設定で動作、POCレベルに最適
2. **実績**: Node.js の事実上の標準フレームワーク
3. **Socket.io 統合**: `http.Server` を共有して Socket.io と簡単に統合可能
4. **学習コスト**: ユーザーが親しんでいる可能性が高い
5. **軽量**: NestJS のような重厚なフレームワークは不要

**代替案との比較**:
- Fastify: 高速だが、Socket.io との統合が若干複雑
- NestJS: TypeScript ファーストだが、学習コストが高くPOCには過剰
- 素のNode.js: 設定が煩雑になる

**決定**: **Express.js** を採用

---

## 4. WebSocket ライブラリ

### 選定: Socket.io

**理由**:
1. **Unit 1 との統一**: フロントエンドも Socket.io-client を使用、同じライブラリで通信
2. **自動再接続**: クライアントの接続切断時に自動再接続
3. **Room 機能**: ゲームルームごとの接続管理が標準機能で提供
4. **フォールバック**: WebSocket 非対応環境でも動作
5. **イベント駆動**: ゲームイベント（`game:dobo`, `game:return` 等）の管理が直感的

**接続管理方針**:
- Socket.io の **Room 機能** でルームごとに接続を管理
- `socket.join(roomId)` でルームに参加
- `io.to(roomId).emit(event)` でルーム内全員に送信
- セッションIDをキーにした Map でゲームセッションを管理

**決定**: **Socket.io** を採用

---

## 5. タイムアウト管理

### 選定: setTimeout（セッションごと）

**理由**:
1. **シンプルさ**: 各セッションに1つの setTimeout、コードが明快
2. **精度**: setInterval より正確なタイムアウト管理
3. **クリーンアップ**: セッション終了時に clearTimeout で確実にクリア
4. **POCレベル**: 1セッション想定のため、複雑な一括管理は不要

**実装パターン**:
```typescript
// ドボン宣言時
const timeoutId = setTimeout(() => {
  handleDoboTimeout(sessionId);
}, 10_000);

// セッション終了時
clearTimeout(timeoutId);
```

**決定**: **setTimeout** を採用

---

## 6. ログ

### 選定: コンソール出力（console.log / console.error）

**理由**:
1. **シンプルさ**: 追加ライブラリ不要
2. **Heroku 対応**: Heroku のログダッシュボードでコンソール出力を確認可能
3. **POCレベル**: winston 等のログライブラリは過剰
4. **開発効率**: ローカル開発時もターミナルで即確認

**ログ出力方針**:
- `console.log`: ゲームイベント、状態変化
- `console.error`: エラー（スタックトレース付き）
- 本番環境でも同様（Heroku ダッシュボードで確認）

**Heroku でのログ確認方法**:
```bash
heroku logs --tail --app <app-name>
```

**決定**: **コンソール出力のみ** を採用

---

## 7. テストフレームワーク

### 選定: Jest + ts-jest

**理由**:
1. **Node.js 標準**: バックエンドテストの事実上の標準
2. **TypeScript 対応**: ts-jest で TypeScript を直接テスト可能
3. **豊富な機能**: モック、スパイ、カバレッジ計測が標準搭載
4. **Functional Design で決定済み**: 一貫性を保つ

**設定**:
```json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "testMatch": ["**/*.test.ts"]
}
```

**決定**: **Jest + ts-jest** を採用

---

## 8. ホスティング

### 選定: Heroku

**理由**:
1. **簡単なデプロイ**: GitHub 連携で `git push` だけでデプロイ
2. **WebSocket 対応**: Socket.io が動作する
3. **HTTPS/WSS 自動**: SSL証明書の手動管理不要
4. **無料枠**: Eco Dynos（月550時間、POCレベルで十分）
5. **ログ確認**: ダッシュボードまたは CLI でコンソールログを確認可能

**デプロイ設定**:
- `Procfile`: `web: node dist/index.js`
- 環境変数: Heroku Config Vars で管理
- ビルド: `npm run build`（TypeScript → JavaScript）

**注意点**:
- Eco Dynos は30分アクセスがないとスリープする
- スリープ中は WebSocket 接続が切れる
- POCレベルでは許容（使う前にアクセスして起動）

**決定**: **Heroku** を採用

---

## 9. 依存ライブラリ一覧

### コア

```json
{
  "dependencies": {
    "express": "^4.18.x",
    "socket.io": "^4.x",
    "cors": "^2.8.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/express": "^4.17.x",
    "@types/cors": "^2.8.x",
    "@types/node": "^18.x",
    "ts-node": "^10.x",
    "ts-node-dev": "^2.x",
    "jest": "^29.x",
    "ts-jest": "^29.x",
    "@types/jest": "^29.x"
  }
}
```

### ライブラリ選定理由

| ライブラリ | 用途 | 理由 |
|---|---|---|
| express | HTTPサーバー | シンプル、実績豊富 |
| socket.io | WebSocket | Unit 1 と統一、自動再接続 |
| cors | CORS設定 | Express の標準ミドルウェア |
| typescript | 言語 | Unit 1 と統一、型安全性 |
| ts-node-dev | 開発サーバー | ホットリロード対応 |
| jest + ts-jest | テスト | Node.js 標準、TypeScript 対応 |

---

## 10. プロジェクト構造

```
backend/                        # バックエンドルート
├── src/
│   ├── index.ts                # エントリーポイント（Express + Socket.io 初期化）
│   ├── types/
│   │   └── domain.ts           # ドメインエンティティ（Unit 1 と共通）
│   ├── game/
│   │   ├── GameEngine.ts       # ゲーム状態管理
│   │   ├── DoboDeclaration.ts  # ドボン宣言ロジック
│   │   ├── MultiplierCalculator.ts
│   │   ├── DeckManager.ts
│   │   ├── CardValidator.ts
│   │   ├── PaymentCalculator.ts
│   │   └── handlers/           # 特殊カードハンドラー
│   │       ├── ACardHandler.ts
│   │       ├── TwoCardHandler.ts
│   │       ├── EightCardHandler.ts
│   │       ├── JCardHandler.ts
│   │       └── KCardHandler.ts
│   ├── socket/
│   │   └── GameSocketHandler.ts # WebSocket イベントハンドラー
│   └── utils/
│       └── logger.ts           # ログユーティリティ
├── tests/
│   ├── game/
│   │   ├── DoboDeclaration.test.ts
│   │   ├── MultiplierCalculator.test.ts
│   │   ├── CardValidator.test.ts
│   │   ├── PaymentCalculator.test.ts
│   │   └── DeckManager.test.ts
│   └── factories/              # テストデータファクトリー
│       ├── CardFactory.ts
│       ├── PlayerFactory.ts
│       └── GameStateFactory.ts
├── package.json
├── tsconfig.json
├── jest.config.js
├── Procfile                    # Heroku デプロイ設定
├── .env.development
├── .env.production
└── README.md
```

---

## 11. 環境変数

### 開発環境（.env.development）

```
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 本番環境（Heroku Config Vars）

```
NODE_ENV=production
FRONTEND_URL=https://<vercel-app>.vercel.app
# PORT は Heroku が自動設定
```

---

## 12. 決定サマリー

| 項目 | 選定 | 理由 |
|---|---|---|
| ランタイム | Node.js 18 LTS | Unit 1 と統一 |
| 言語 | TypeScript | 型安全性、Unit 1 と統一 |
| フレームワーク | Express.js | シンプル、実績豊富 |
| WebSocket | Socket.io | Unit 1 と統一、自動再接続 |
| タイムアウト | setTimeout | シンプル |
| ログ | コンソール出力 | Heroku 対応、POCレベル |
| テスト | Jest + ts-jest | Node.js 標準 |
| ホスティング | Heroku | 簡単、WebSocket 対応 |
