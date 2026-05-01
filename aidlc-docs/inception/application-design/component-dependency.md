# コンポーネント依存関係 - ドボンゲーム

## 層状アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    API層 / フロントエンド層                    │
│  (REST API, WebSocket, Vue.js コンポーネント)                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      サービス層                               │
│  (GameService, UserService, HistoryService, RoomService)    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   ビジネスロジック層                           │
│  (GameEngine, DoboDeclaration, MultiplierCalculator, etc.)   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    データアクセス層                            │
│  (Repository: GameRepository, UserRepository, etc.)          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      データベース層                            │
│  (PostgreSQL / MongoDB)                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 依存関係マトリックス

### バックエンド依存関係

| コンポーネント | GameEngine | DoboDeclaration | MultiplierCalculator | DeckManager | UserService | GuestManager | ProfileManager | GameHistoryService | StatisticsService | RankingService | RoomManager | GameSessionManager | WebSocketHandler |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **GameEngine** | - | ✓ | - | ✓ | - | - | - | - | - | - | - | - | - |
| **DoboDeclaration** | - | - | ✓ | - | - | - | - | - | - | - | - | - | - |
| **MultiplierCalculator** | - | - | - | - | - | - | - | - | - | - | - | - | - |
| **DeckManager** | - | - | ✓ | - | - | - | - | - | - | - | - | - | - |
| **UserService** | - | - | - | - | - | ✓ | ✓ | - | - | - | - | - | - |
| **GuestManager** | - | - | - | - | - | - | - | - | - | - | - | - | - |
| **ProfileManager** | - | - | - | - | - | - | - | - | - | - | - | - | - |
| **GameHistoryService** | - | - | - | - | - | - | - | - | - | - | - | - | - |
| **StatisticsService** | - | - | - | - | - | - | - | ✓ | - | - | - | - | - |
| **RankingService** | - | - | - | - | - | - | - | - | ✓ | - | - | - | - |
| **RoomManager** | - | - | - | - | - | - | - | - | - | - | - | - | - |
| **GameSessionManager** | - | - | - | - | - | - | - | - | - | - | ✓ | - | - |
| **WebSocketHandler** | - | - | - | - | - | - | - | - | - | - | - | - | - |

**凡例**: ✓ = 依存あり

---

## サービス層の依存関係

### GameService の依存関係

```
GameService
  ├── GameEngine (ゲーム進行管理)
  ├── DoboDeclaration (ドボン宣言ロジック)
  ├── MultiplierCalculator (倍率計算)
  ├── DeckManager (山札管理)
  ├── GameHistoryService (ゲーム履歴保存)
  └── WebSocketHandler (クライアント通知)
```

**通信フロー**:
1. GameService.startGame() → GameEngine.startGame()
2. GameService.playCard() → GameEngine.playCard()
3. GameService.declareDobo() → DoboDeclaration.declareDobo()
4. GameService.endGame() → GameHistoryService.saveGameResult()
5. GameService.* → WebSocketHandler.broadcastMessage()

---

### UserService の依存関係

```
UserService
  ├── GuestManager (ゲストID管理)
  ├── ProfileManager (プロフィール管理)
  └── UserRepository (データアクセス)
```

**通信フロー**:
1. UserService.createGuest() → GuestManager.generateGuestId()
2. UserService.updateProfile() → ProfileManager.updateProfile()
3. UserService.* → UserRepository.*

---

### HistoryService の依存関係

```
HistoryService
  ├── GameHistoryService (ゲーム履歴管理)
  ├── StatisticsService (統計情報管理)
  ├── RankingService (ランキング管理)
  └── HistoryRepository (データアクセス)
```

**通信フロー**:
1. HistoryService.saveGameResult() → GameHistoryService.saveGameResult()
2. HistoryService.saveGameResult() → StatisticsService.updateStatistics()
3. HistoryService.saveGameResult() → RankingService.updateRanking()
4. HistoryService.* → HistoryRepository.*

---

### RoomService の依存関係

```
RoomService
  ├── RoomManager (ルーム管理)
  ├── GameSessionManager (ゲームセッション管理)
  ├── GameService (ゲーム進行)
  └── WebSocketHandler (クライアント通知)
```

**通信フロー**:
1. RoomService.createRoom() → RoomManager.createRoom()
2. RoomService.startGame() → GameSessionManager.createGameSession()
3. RoomService.startGame() → GameService.startGame()
4. RoomService.* → WebSocketHandler.broadcastMessage()

---

## データフロー

### ゲーム開始時のデータフロー

```
クライアント (RoomScreen)
  ↓ startGame()
RoomService
  ↓ createGameSession()
GameSessionManager
  ↓ startGame()
GameService
  ├─ GameEngine.startGame()
  ├─ DeckManager.initializeDeck()
  ├─ DeckManager.dealCards()
  └─ WebSocketHandler.broadcastMessage()
  ↓
クライアント (GameBoard) - ゲーム状態受信
```

---

### ドボン宣言時のデータフロー

```
クライアント (DoboDeclarationUI)
  ↓ declareDobo()
GameService
  ├─ DoboDeclaration.declareDobo()
  ├─ DoboDeclaration.checkReturn()
  ├─ MultiplierCalculator.calculatePayment()
  ├─ GameHistoryService.saveGameResult()
  ├─ StatisticsService.updateStatistics()
  ├─ RankingService.updateRanking()
  └─ WebSocketHandler.broadcastMessage()
  ↓
クライアント (PaymentUI) - 支払い情報受信
```

---

### ゲーム履歴・統計取得時のデータフロー

```
クライアント (StatisticsScreen)
  ↓ getStatistics()
HistoryService
  ├─ GameHistoryService.getGameHistory()
  ├─ StatisticsService.getStatistics()
  ├─ RankingService.getRanking()
  └─ HistoryRepository.query()
  ↓
クライアント (StatisticsScreen) - 統計情報表示
```

---

## リアルタイム通信の統合

### WebSocket通信パターン

```
クライアント (Socket.io)
  ↔ WebSocketHandler
    ├─ GameService (ゲーム状態更新)
    ├─ RoomService (ルーム情報更新)
    └─ UserService (ユーザー情報更新)
```

**メッセージタイプ**:
1. **game:state** - ゲーム状態更新
2. **game:dobo** - ドボン宣言
3. **game:return** - 返しドボン判定
4. **game:payment** - 支払い情報
5. **room:join** - ルーム参加
6. **room:leave** - ルーム退出
7. **room:start** - ゲーム開始
8. **user:update** - ユーザー情報更新

---

## 循環依存の確認

### 確認項目

- [ ] GameEngine → DoboDeclaration → GameEngine: **なし** ✓
- [ ] GameService → GameEngine → GameService: **なし** ✓
- [ ] UserService → GuestManager → UserService: **なし** ✓
- [ ] HistoryService → StatisticsService → RankingService → HistoryService: **なし** ✓
- [ ] RoomService → GameService → RoomService: **なし** ✓

**結論**: 循環依存なし ✓

---

## 依存関係の方向性

### 原則

1. **上位層から下位層への一方向依存**
   - API層 → サービス層 → ビジネスロジック層 → データアクセス層

2. **同一層内での依存は最小限**
   - サービス層内のサービス間依存は許可（オーケストレーション）
   - ビジネスロジック層内のコンポーネント間依存は許可（機能分割）

3. **下位層から上位層への依存は禁止**
   - データアクセス層がビジネスロジック層に依存しない
   - ビジネスロジック層がサービス層に依存しない

---

## 依存関係の複雑度

### コンポーネント別の依存数

| コンポーネント | 依存数 | 被依存数 |
|---|---|---|
| GameEngine | 2 | 1 |
| DoboDeclaration | 1 | 1 |
| MultiplierCalculator | 0 | 2 |
| DeckManager | 1 | 1 |
| UserService | 2 | 0 |
| GuestManager | 0 | 1 |
| ProfileManager | 0 | 1 |
| GameHistoryService | 0 | 1 |
| StatisticsService | 1 | 1 |
| RankingService | 1 | 1 |
| RoomManager | 0 | 1 |
| GameSessionManager | 1 | 1 |
| WebSocketHandler | 0 | 3 |

**平均依存数**: 0.77（低い）
**最大依存数**: 2（GameEngine）
**複雑度**: 低い ✓

---

## 依存関係の管理戦略

### 1. インターフェース分離

各コンポーネントは明確なインターフェースを定義し、実装詳細を隠蔽します。

```typescript
// GameEngine インターフェース
interface IGameEngine {
  startGame(players: Player[], baseRate: number): GameState;
  playCard(playerId: string, cards: Card[]): boolean;
  drawCard(playerId: string): Card;
  // ...
}
```

### 2. 依存性注入

サービス層がビジネスロジック層のコンポーネントを注入します。

```typescript
class GameService {
  constructor(
    private gameEngine: IGameEngine,
    private doboDeclaration: IDoboDeclaration,
    private multiplierCalculator: IMultiplierCalculator,
    private deckManager: IDeckManager
  ) {}
}
```

### 3. イベント駆動

コンポーネント間の通信をイベント駆動で実装し、疎結合を実現します。

```typescript
// ゲーム終了イベント
gameEngine.on('gameEnd', (winner: Player) => {
  historyService.saveGameResult(winner);
});
```

---

## 依存関係の可視化

### 依存関係グラフ

```
API層
  ↓
GameService ←→ RoomService ←→ UserService ←→ HistoryService
  ↓              ↓              ↓              ↓
GameEngine    RoomManager    GuestManager    GameHistoryService
DoboDeclaration GameSessionManager ProfileManager StatisticsService
MultiplierCalculator                          RankingService
DeckManager
  ↓
WebSocketHandler
  ↓
データアクセス層
  ↓
データベース層
```

