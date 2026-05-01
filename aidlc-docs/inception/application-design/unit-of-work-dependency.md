# Unit of Work Dependency Matrix - ドボンゲーム

## ユニット依存関係マトリックス

### 依存関係表

| ユニット | Unit 1 | Unit 2 | Unit 3 | Unit 4 | Unit 5 | Unit 6 | 依存数 |
|---|---|---|---|---|---|---|---|
| **Unit 1 (Frontend)** | - | - | - | - | - | ✓ | 1 |
| **Unit 2 (Game Logic)** | - | - | - | - | - | ✓ | 1 |
| **Unit 3 (User)** | - | - | - | - | - | ✓ | 1 |
| **Unit 4 (History)** | - | - | - | - | - | ✓ | 1 |
| **Unit 5 (Room)** | - | - | - | - | - | ✓ | 1 |
| **Unit 6 (Integration)** | - | - | - | - | - | - | 0 |
| **被依存数** | 0 | 1 | 1 | 1 | 1 | 5 | - |

**凡例**: ✓ = 依存あり

---

## 依存関係の詳細

### Unit 1 (Frontend) の依存関係

```
Unit 1 (Frontend)
  ↓ REST API + WebSocket
Unit 6 (Integration)
  ├─ Unit 2 (Game Logic)
  ├─ Unit 3 (User)
  ├─ Unit 4 (History)
  └─ Unit 5 (Room)
```

**依存理由**:
- REST API でユーザー管理、ゲーム履歴・統計、ルーム管理にアクセス
- WebSocket でゲーム状態、ドボン宣言、支払い情報をリアルタイム受信

---

### Unit 2 (Game Logic) の依存関係

```
Unit 2 (Game Logic)
  ↓ メソッド呼び出し
Unit 6 (Integration)
  ├─ GameService
  └─ WebSocketHandler
```

**依存理由**:
- GameService がゲームロジックをオーケストレーション
- WebSocketHandler がゲーム状態をクライアントに通知

---

### Unit 3 (User) の依存関係

```
Unit 3 (User)
  ↓ メソッド呼び出し
Unit 6 (Integration)
  ├─ UserService
  └─ REST API
```

**依存理由**:
- UserService がユーザー管理をオーケストレーション
- REST API でクライアントからのリクエストを処理

---

### Unit 4 (History) の依存関係

```
Unit 4 (History)
  ↓ メソッド呼び出し
Unit 6 (Integration)
  ├─ HistoryService
  └─ REST API
```

**依存理由**:
- HistoryService がゲーム履歴・統計をオーケストレーション
- REST API でクライアントからのリクエストを処理

---

### Unit 5 (Room) の依存関係

```
Unit 5 (Room)
  ↓ メソッド呼び出し
Unit 6 (Integration)
  ├─ RoomService
  ├─ GameService
  └─ WebSocketHandler
```

**依存理由**:
- RoomService がルーム管理をオーケストレーション
- GameService がゲーム開始時に呼ばれる
- WebSocketHandler がルーム情報をクライアントに通知

---

### Unit 6 (Integration) の依存関係

```
Unit 6 (Integration)
  ├─ Unit 2 (Game Logic)
  ├─ Unit 3 (User)
  ├─ Unit 4 (History)
  └─ Unit 5 (Room)
```

**依存理由**:
- サービス層がすべてのビジネスロジックユニットをオーケストレーション
- REST API エンドポイントがすべてのユニットを呼び出し
- WebSocketHandler がすべてのユニットの状態更新を通知

---

## 依存関係の方向性

### 層状依存関係

```
┌─────────────────────────────────────────┐
│         Unit 1 (Frontend)               │
│  (Vue.js/React コンポーネント)           │
└─────────────────────────────────────────┘
                    ↓
        REST API + WebSocket
                    ↓
┌─────────────────────────────────────────┐
│      Unit 6 (Integration)               │
│  (サービス層、REST API、WebSocket)       │
└─────────────────────────────────────────┘
        ↓       ↓       ↓       ↓
    Unit 2  Unit 3  Unit 4  Unit 5
    (Game)  (User) (History)(Room)
```

### 依存関係の原則

1. **一方向依存**: すべての依存関係が Unit 6 に向かう
2. **循環依存なし**: ユニット間に循環参照がない
3. **疎結合**: ユニット間は REST API + WebSocket で疎結合
4. **高凝集**: ユニット内のコンポーネント間は密接に関連

---

## 統合ポイント

### REST API 統合ポイント

#### ユーザー管理 (Unit 3 + Unit 6)

```
POST /api/users
  ↓
UserService.createGuest()
  ↓
GuestManager.generateGuestId()
  ↓
UserRepository.saveUser()
```

#### ゲーム履歴・統計 (Unit 4 + Unit 6)

```
GET /api/history
  ↓
HistoryService.getGameHistory()
  ↓
GameHistoryService.getGameHistory()
  ↓
HistoryRepository.query()
```

#### ルーム管理 (Unit 5 + Unit 6)

```
POST /api/rooms/:id/start
  ↓
RoomService.startGame()
  ↓
GameSessionManager.createGameSession()
  ↓
GameService.startGame()
  ↓
GameEngine.startGame()
```

### WebSocket 統合ポイント

#### ゲーム状態更新 (Unit 2 + Unit 6)

```
GameService.playCard()
  ↓
GameEngine.playCard()
  ↓
WebSocketHandler.broadcastMessage('game:state')
  ↓
クライアント (Unit 1) - ゲーム状態受信
```

#### ドボン宣言 (Unit 2 + Unit 6)

```
GameService.declareDobo()
  ↓
DoboDeclaration.declareDobo()
  ↓
WebSocketHandler.broadcastMessage('game:dobo')
  ↓
クライアント (Unit 1) - ドボン宣言受信
```

---

## 依存関係の複雑度分析

### 複雑度指標

| 指標 | 値 | 評価 |
|---|---|---|
| 平均依存数 | 0.83 | 低い ✓ |
| 最大依存数 | 5 (Unit 6) | 許容範囲 ✓ |
| 循環依存 | 0 | なし ✓ |
| 最大依存深度 | 2 | 浅い ✓ |

### 複雑度評価

- **全体的な複雑度**: 低い ✓
- **ユニット間の結合度**: 低い ✓
- **ユニット内の凝集度**: 高い ✓
- **保守性**: 高い ✓

---

## 依存関係の管理戦略

### 1. インターフェース分離

各ユニットは明確なインターフェースを定義し、実装詳細を隠蔽します。

```typescript
// Unit 2 (Game Logic) インターフェース
export interface IGameEngine {
  startGame(players: Player[], baseRate: number): GameState;
  playCard(playerId: string, cards: Card[]): boolean;
  // ...
}

// Unit 6 (Integration) での使用
class GameService {
  constructor(private gameEngine: IGameEngine) {}
  
  startGame(players: Player[], baseRate: number): GameSession {
    const gameState = this.gameEngine.startGame(players, baseRate);
    // ...
  }
}
```

### 2. 依存性注入

Unit 6 がすべてのユニットの依存関係を管理します。

```typescript
// IoC コンテナ設定
const container = new Container();

// Unit 2-5 の登録
container.bind<IGameEngine>('GameEngine').to(GameEngine);
container.bind<IUserService>('UserService').to(UserService);
container.bind<IHistoryService>('HistoryService').to(HistoryService);
container.bind<IRoomService>('RoomService').to(RoomService);

// Unit 6 のサービス登録
container.bind<IGameService>('GameService').to(GameService);
```

### 3. イベント駆動

ユニット間の通信をイベント駆動で実装し、疎結合を実現します。

```typescript
// Unit 2 (Game Logic) でイベント発行
gameEngine.on('gameEnd', (winner: Player) => {
  // Unit 6 (Integration) でイベント処理
  historyService.saveGameResult(winner);
  webSocketHandler.broadcastMessage('game:end', winner);
});
```

---

## 依存関係の検証チェックリスト

- [x] すべてのユニット間の依存関係が明確に定義されている
- [x] 循環依存がない
- [x] 依存関係の方向が一貫している
- [x] 統合ポイントが明確に定義されている
- [x] インターフェース分離が実装されている
- [x] 依存性注入が使用されている
- [x] イベント駆動が使用されている
- [x] 複雑度が許容範囲内である

---

## 次のステップ

1. **Unit 1 (フロントエンド)** の詳細設計
2. **Unit 2-5 (バックエンドユニット)** の詳細設計
3. **Unit 6 (バックエンド統合)** の詳細設計
4. 各ユニットの実装
5. 統合テスト

