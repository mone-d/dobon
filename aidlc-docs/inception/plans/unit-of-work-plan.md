# Unit of Work Plan - ドボンゲーム

## ユニット分割の目的

ドボンゲームのシステムを、開発効率と保守性を考慮して、複数のユニット（開発単位）に分割します。

各ユニットは、独立して設計・実装・テストが可能な論理的なグループです。

---

## ユニット分割計画

### [ ] 1. ユニット分割戦略

#### 1.1 分割アプローチ

ドボンゲームのシステムを以下のアプローチで分割することを提案します：

**A) 層別分割**
- Unit 1: バックエンド（ゲームロジック、ユーザー管理、ゲーム履歴・統計、ルーム管理）
- Unit 2: フロントエンド（ゲーム画面、ロビー・ルーム管理、プロフィール・統計）

**B) 機能別分割**
- Unit 1: ゲームロジック（GameEngine, DoboDeclaration, MultiplierCalculator, DeckManager）
- Unit 2: ユーザー管理（UserService, GuestManager, ProfileManager）
- Unit 3: ゲーム履歴・統計（GameHistoryService, StatisticsService, RankingService）
- Unit 4: ルーム管理（RoomManager, GameSessionManager）
- Unit 5: フロントエンド（すべてのフロントエンドコンポーネント）

**C) ドメイン別分割**
- Unit 1: ゲームドメイン（ゲームロジック、ルーム管理、ゲーム履歴）
- Unit 2: ユーザードメイン（ユーザー管理、プロフィール）
- Unit 3: 統計ドメイン（統計情報、ランキング）
- Unit 4: フロントエンド（すべてのフロントエンドコンポーネント）

どのアプローチが最適ですか？

[Answer]: B

---

#### 1.2 ユニット数

ユニット分割の粒度について、以下のどれが最適ですか？

A) 2ユニット（バックエンド、フロントエンド）
B) 3-4ユニット（機能別またはドメイン別）
C) 5ユニット以上（細粒度分割）
D) その他

[Answer]: C

---

### [ ] 2. ユニット定義

#### 2.1 ユニット1: バックエンド（提案）

**責務**:
- ゲームロジック（GameEngine, DoboDeclaration, MultiplierCalculator, DeckManager）
- ユーザー管理（UserService, GuestManager, ProfileManager）
- ゲーム履歴・統計（GameHistoryService, StatisticsService, RankingService）
- ルーム管理（RoomManager, GameSessionManager）
- リアルタイム通信（WebSocketHandler）

**技術スタック**:
- 言語: Node.js + TypeScript
- フレームワーク: Express.js または Nest.js
- リアルタイム通信: Socket.io
- データベース: PostgreSQL または MongoDB

**デプロイ**:
- 単一のバックエンドサーバー

このユニット定義で問題ありませんか？変更が必要な部分はありますか？

[Answer]: OK

---

#### 2.2 ユニット2: フロントエンド（提案）

**責務**:
- ゲーム画面（GameBoard, CardHand, DoboDeclarationUI, ReturnDoboUI, PaymentUI）
- ロビー・ルーム管理画面（LobbyScreen, RoomScreen）
- プロフィール・統計画面（ProfileScreen, StatisticsScreen）

**技術スタック**:
- 言語: TypeScript
- フレームワーク: Vue.js 3 または React
- UI/UXライブラリ: Tailwind CSS または Material-UI
- リアルタイム通信: Socket.io クライアント
- 状態管理: Pinia（Vue）または Redux（React）

**デプロイ**:
- 静的ファイルホスティング（CDN）

このユニット定義で問題ありませんか？変更が必要な部分はありますか？

[Answer]: ok

---

### [ ] 3. ユニット間の依存関係

#### 3.1 依存関係

ユニット間の依存関係について、以下の方針を提案します：

- **フロントエンド → バックエンド**: REST API + WebSocket通信
- **バックエンド → フロントエンド**: なし（バックエンドはフロントエンドに依存しない）

この依存関係で問題ありませんか？変更が必要な部分はありますか？

[Answer]: ok

---

#### 3.2 統合ポイント

ユニット間の統合ポイントについて、以下の方針を提案します：

- **REST API**: ユーザー管理、ゲーム履歴・統計、ルーム管理
- **WebSocket**: ゲーム進行、リアルタイム状態更新

この統合ポイントで問題ありませんか？変更が必要な部分はありますか？

[Answer]: ok

---

### [ ] 4. ユニット内の構成

#### 4.1 バックエンド ユニット内の構成

バックエンド ユニット内を以下のように構成することを提案します：

```
backend/
├── src/
│   ├── game/
│   │   ├── engine/
│   │   ├── dobo-declaration/
│   │   ├── multiplier-calculator/
│   │   └── deck-manager/
│   ├── user/
│   │   ├── user-service/
│   │   ├── guest-manager/
│   │   └── profile-manager/
│   ├── history/
│   │   ├── game-history-service/
│   │   ├── statistics-service/
│   │   └── ranking-service/
│   ├── room/
│   │   ├── room-manager/
│   │   └── game-session-manager/
│   ├── websocket/
│   │   └── websocket-handler/
│   ├── services/
│   │   ├── game-service/
│   │   ├── user-service/
│   │   ├── history-service/
│   │   └── room-service/
│   ├── repositories/
│   │   ├── game-repository/
│   │   ├── user-repository/
│   │   └── history-repository/
│   ├── models/
│   ├── utils/
│   └── app.ts
├── tests/
├── package.json
└── tsconfig.json
```

この構成で問題ありませんか？変更が必要な部分はありますか？

[Answer]: ok

---

#### 4.2 フロントエンド ユニット内の構成

フロントエンド ユニット内を以下のように構成することを提案します：

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

この構成で問題ありませんか？変更が必要な部分はありますか？

[Answer]: ok

---

### [ ] 5. ユニット間の開発順序

#### 5.1 開発順序

ユニット間の開発順序について、以下の方針を提案します：

**順序1**: バックエンド → フロントエンド
- 理由: バックエンドが先に完成していれば、フロントエンドはバックエンドのAPIに対して開発可能

**順序2**: 並列開発
- 理由: バックエンドとフロントエンドを同時に開発し、統合テストで検証

**順序3**: フロントエンド → バックエンド
- 理由: フロントエンドのUIを先に完成させ、バックエンドはそれに合わせて実装

どの開発順序が最適ですか？

[Answer]: 3

---

#### 5.2 統合テスト

ユニット間の統合テストについて、以下の方針を提案します：

- **タイミング**: 各ユニットの実装完了後、統合テストを実施
- **テスト内容**: REST API、WebSocket通信、エンドツーエンドシナリオ

この方針で問題ありませんか？変更が必要な部分はありますか？

[Answer]: ok

---

### [ ] 6. ユニット検証

#### 6.1 ユニット境界の検証

以下の項目について、ユニット境界が適切であることを確認してください：

- [ ] 各ユニットが単一の責務を持つ
- [ ] ユニット間の依存関係が最小限
- [ ] ユニット内のコンポーネント間の結合度が高い
- [ ] ユニット間の結合度が低い

ユニット境界に問題はありますか？

[Answer]: ok

---

#### 6.2 ユニット依存関係の検証

以下の項目について、ユニット依存関係が適切であることを確認してください：

- [ ] 循環依存がない
- [ ] 依存関係の方向が明確
- [ ] 統合ポイントが明確

ユニット依存関係に問題はありますか？

[Answer]: ok

---

## ユニット分割計画の実行

上記のすべての質問に回答いただければ、以下のユニット成果物を生成します：

1. **unit-of-work.md** - ユニット定義と責務
2. **unit-of-work-dependency.md** - ユニット依存関係マトリックス
3. **unit-of-work-story-map.md** - ストーリーのユニットマッピング

