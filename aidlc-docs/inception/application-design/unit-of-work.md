# Unit of Work Definition - ドボンゲーム

## ユニット分割戦略

**分割アプローチ**: 機能別分割
**ユニット数**: 5ユニット
**開発順序**: フロントエンド → バックエンド

---

## ユニット定義

### Unit 1: フロントエンド

**ユニットID**: `frontend`

**責務**:
- ゲーム画面の実装（GameBoard, CardHand, DoboDeclarationUI, ReturnDoboUI, PaymentUI）
- ロビー・ルーム管理画面の実装（LobbyScreen, RoomScreen）
- プロフィール・統計画面の実装（ProfileScreen, StatisticsScreen）
- バックエンドとの通信（REST API、WebSocket）
- ユーザーインタラクションの処理
- 状態管理

**技術スタック**:
- 言語: TypeScript
- フレームワーク: Vue.js 3 または React
- UI/UXライブラリ: Tailwind CSS または Material-UI
- リアルタイム通信: Socket.io クライアント
- 状態管理: Pinia（Vue）または Redux（React）
- ビルドツール: Vite または Webpack

**デプロイ**:
- 静的ファイルホスティング（CDN）

**ディレクトリ構成**:
```
frontend/
├── src/
│   ├── components/
│   │   ├── game/
│   │   │   ├── GameBoard.vue
│   │   │   ├── CardHand.vue
│   │   │   ├── DoboDeclarationUI.vue
│   │   │   ├── ReturnDoboUI.vue
│   │   │   └── PaymentUI.vue
│   │   ├── lobby/
│   │   │   ├── LobbyScreen.vue
│   │   │   └── RoomScreen.vue
│   │   ├── profile/
│   │   │   ├── ProfileScreen.vue
│   │   │   └── StatisticsScreen.vue
│   │   └── common/
│   ├── stores/
│   │   ├── game-store.ts
│   │   ├── user-store.ts
│   │   ├── room-store.ts
│   │   └── history-store.ts
│   ├── services/
│   │   ├── api-service.ts
│   │   ├── websocket-service.ts
│   │   └── storage-service.ts
│   ├── types/
│   ├── utils/
│   ├── App.vue
│   └── main.ts
├── tests/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

**主要な成果物**:
- Vue.js/React コンポーネント
- 状態管理ストア
- API通信サービス
- WebSocket通信サービス
- ユニットテスト
- E2Eテスト

---

### Unit 2: ゲームロジック

**ユニットID**: `backend-game`

**責務**:
- ゲーム進行管理（GameEngine）
- ドボン宣言ロジック（DoboDeclaration）
- 倍率計算ロジック（MultiplierCalculator）
- 山札管理（DeckManager）

**技術スタック**:
- 言語: Node.js + TypeScript
- フレームワーク: Express.js または Nest.js
- テストフレームワーク: Jest

**ディレクトリ構成**:
```
backend/src/game/
├── engine/
│   ├── game-engine.ts
│   ├── game-engine.interface.ts
│   └── game-engine.test.ts
├── dobo-declaration/
│   ├── dobo-declaration.ts
│   ├── dobo-declaration.interface.ts
│   └── dobo-declaration.test.ts
├── multiplier-calculator/
│   ├── multiplier-calculator.ts
│   ├── multiplier-calculator.interface.ts
│   └── multiplier-calculator.test.ts
└── deck-manager/
    ├── deck-manager.ts
    ├── deck-manager.interface.ts
    └── deck-manager.test.ts
```

**主要な成果物**:
- GameEngine クラス
- DoboDeclaration クラス
- MultiplierCalculator クラス
- DeckManager クラス
- ユニットテスト

---

### Unit 3: ユーザー管理

**ユニットID**: `backend-user`

**責務**:
- ユーザー認証（UserService）
- ゲストID管理（GuestManager）
- プロフィール管理（ProfileManager）

**技術スタック**:
- 言語: Node.js + TypeScript
- フレームワーク: Express.js または Nest.js
- テストフレームワーク: Jest

**ディレクトリ構成**:
```
backend/src/user/
├── user-service/
│   ├── user-service.ts
│   ├── user-service.interface.ts
│   └── user-service.test.ts
├── guest-manager/
│   ├── guest-manager.ts
│   ├── guest-manager.interface.ts
│   └── guest-manager.test.ts
└── profile-manager/
    ├── profile-manager.ts
    ├── profile-manager.interface.ts
    └── profile-manager.test.ts
```

**主要な成果物**:
- UserService クラス
- GuestManager クラス
- ProfileManager クラス
- ユニットテスト

---

### Unit 4: ゲーム履歴・統計

**ユニットID**: `backend-history`

**責務**:
- ゲーム履歴管理（GameHistoryService）
- 統計情報管理（StatisticsService）
- ランキング管理（RankingService）

**技術スタック**:
- 言語: Node.js + TypeScript
- フレームワーク: Express.js または Nest.js
- テストフレームワーク: Jest

**ディレクトリ構成**:
```
backend/src/history/
├── game-history-service/
│   ├── game-history-service.ts
│   ├── game-history-service.interface.ts
│   └── game-history-service.test.ts
├── statistics-service/
│   ├── statistics-service.ts
│   ├── statistics-service.interface.ts
│   └── statistics-service.test.ts
└── ranking-service/
    ├── ranking-service.ts
    ├── ranking-service.interface.ts
    └── ranking-service.test.ts
```

**主要な成果物**:
- GameHistoryService クラス
- StatisticsService クラス
- RankingService クラス
- ユニットテスト

---

### Unit 5: ルーム管理

**ユニットID**: `backend-room`

**責務**:
- ルーム管理（RoomManager）
- ゲームセッション管理（GameSessionManager）

**技術スタック**:
- 言語: Node.js + TypeScript
- フレームワーク: Express.js または Nest.js
- テストフレームワーク: Jest

**ディレクトリ構成**:
```
backend/src/room/
├── room-manager/
│   ├── room-manager.ts
│   ├── room-manager.interface.ts
│   └── room-manager.test.ts
└── game-session-manager/
    ├── game-session-manager.ts
    ├── game-session-manager.interface.ts
    └── game-session-manager.test.ts
```

**主要な成果物**:
- RoomManager クラス
- GameSessionManager クラス
- ユニットテスト

---

### Unit 6: バックエンド統合（サービス層 + リアルタイム通信）

**ユニットID**: `backend-integration`

**責務**:
- サービス層のオーケストレーション（GameService, UserService, HistoryService, RoomService）
- WebSocket通信管理（WebSocketHandler）
- REST API エンドポイント定義
- データベース接続管理
- エラーハンドリング

**技術スタック**:
- 言語: Node.js + TypeScript
- フレームワーク: Express.js または Nest.js
- リアルタイム通信: Socket.io
- データベース: PostgreSQL または MongoDB
- テストフレームワーク: Jest

**ディレクトリ構成**:
```
backend/
├── src/
│   ├── services/
│   │   ├── game-service/
│   │   ├── user-service/
│   │   ├── history-service/
│   │   └── room-service/
│   ├── websocket/
│   │   └── websocket-handler/
│   ├── repositories/
│   │   ├── game-repository/
│   │   ├── user-repository/
│   │   └── history-repository/
│   ├── models/
│   ├── utils/
│   ├── app.ts
│   └── server.ts
├── tests/
├── package.json
└── tsconfig.json
```

**主要な成果物**:
- GameService クラス
- UserService クラス
- HistoryService クラス
- RoomService クラス
- WebSocketHandler クラス
- Repository クラス
- REST API エンドポイント
- 統合テスト

---

## ユニット間の依存関係

### 依存関係マトリックス

| ユニット | Unit 1 | Unit 2 | Unit 3 | Unit 4 | Unit 5 | Unit 6 |
|---|---|---|---|---|---|---|
| **Unit 1 (Frontend)** | - | - | - | - | - | ✓ |
| **Unit 2 (Game Logic)** | - | - | - | - | - | ✓ |
| **Unit 3 (User)** | - | - | - | - | - | ✓ |
| **Unit 4 (History)** | - | - | - | - | - | ✓ |
| **Unit 5 (Room)** | - | - | - | - | - | ✓ |
| **Unit 6 (Integration)** | - | - | - | - | - | - |

**凡例**: ✓ = 依存あり

### 依存関係の説明

- **Unit 1 (Frontend) → Unit 6 (Integration)**: REST API + WebSocket通信
- **Unit 2-5 (各バックエンドユニット) → Unit 6 (Integration)**: サービス層でオーケストレーション

---

## 開発順序

### 推奨開発順序

1. **Unit 1: フロントエンド** (1-2日)
   - UI/UXコンポーネント実装
   - 状態管理ストア実装
   - モックAPI通信実装

2. **Unit 2: ゲームロジック** (2-3日)
   - GameEngine実装
   - DoboDeclaration実装
   - MultiplierCalculator実装
   - DeckManager実装
   - ユニットテスト

3. **Unit 3: ユーザー管理** (1日)
   - UserService実装
   - GuestManager実装
   - ProfileManager実装
   - ユニットテスト

4. **Unit 4: ゲーム履歴・統計** (1-2日)
   - GameHistoryService実装
   - StatisticsService実装
   - RankingService実装
   - ユニットテスト

5. **Unit 5: ルーム管理** (1日)
   - RoomManager実装
   - GameSessionManager実装
   - ユニットテスト

6. **Unit 6: バックエンド統合** (2-3日)
   - サービス層実装
   - WebSocketHandler実装
   - REST API実装
   - 統合テスト
   - フロントエンド統合テスト

**総開発期間**: 8-12日（1-2週間）

---

## 統合ポイント

### REST API 統合ポイント

| エンドポイント | ユニット | 説明 |
|---|---|---|
| POST /api/users | Unit 3 + Unit 6 | ゲストユーザー作成 |
| GET /api/users/:id | Unit 3 + Unit 6 | ユーザー情報取得 |
| PUT /api/users/:id | Unit 3 + Unit 6 | ユーザー情報更新 |
| GET /api/history | Unit 4 + Unit 6 | ゲーム履歴取得 |
| GET /api/statistics | Unit 4 + Unit 6 | 統計情報取得 |
| GET /api/ranking | Unit 4 + Unit 6 | ランキング取得 |
| POST /api/rooms | Unit 5 + Unit 6 | ルーム作成 |
| GET /api/rooms | Unit 5 + Unit 6 | ルーム一覧取得 |
| POST /api/rooms/:id/join | Unit 5 + Unit 6 | ルーム参加 |
| POST /api/rooms/:id/start | Unit 5 + Unit 6 | ゲーム開始 |

### WebSocket 統合ポイント

| メッセージタイプ | ユニット | 説明 |
|---|---|---|
| game:state | Unit 2 + Unit 6 | ゲーム状態更新 |
| game:dobo | Unit 2 + Unit 6 | ドボン宣言 |
| game:return | Unit 2 + Unit 6 | 返しドボン判定 |
| game:payment | Unit 2 + Unit 6 | 支払い情報 |
| room:join | Unit 5 + Unit 6 | ルーム参加 |
| room:leave | Unit 5 + Unit 6 | ルーム退出 |
| room:start | Unit 5 + Unit 6 | ゲーム開始 |
| user:update | Unit 3 + Unit 6 | ユーザー情報更新 |

---

## ユニット検証

### ユニット境界の検証

- [x] 各ユニットが単一の責務を持つ
  - Unit 1: UI/UX表示
  - Unit 2: ゲームロジック
  - Unit 3: ユーザー管理
  - Unit 4: ゲーム履歴・統計
  - Unit 5: ルーム管理
  - Unit 6: 統合・オーケストレーション

- [x] ユニット間の依存関係が最小限
  - 各バックエンドユニットは Unit 6 にのみ依存
  - フロントエンドは Unit 6 にのみ依存

- [x] ユニット内のコンポーネント間の結合度が高い
  - 各ユニット内のコンポーネントは密接に関連

- [x] ユニット間の結合度が低い
  - ユニット間は REST API + WebSocket で疎結合

### ユニット依存関係の検証

- [x] 循環依存がない
  - すべての依存関係が Unit 6 に向かう

- [x] 依存関係の方向が明確
  - Unit 1-5 → Unit 6（一方向）

- [x] 統合ポイントが明確
  - REST API エンドポイント定義
  - WebSocket メッセージタイプ定義

---

## 次のステップ

1. **Unit 1 (フロントエンド)** の詳細設計・実装
2. **Unit 2-5 (バックエンドユニット)** の詳細設計・実装
3. **Unit 6 (バックエンド統合)** の詳細設計・実装
4. 統合テスト
5. エンドツーエンドテスト

