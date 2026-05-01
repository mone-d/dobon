# サービス層定義 - ドボンゲーム

## サービス層の役割

サービス層は、複数のコンポーネントを組み合わせて、ビジネスロジックをオーケストレーションします。

---

## サービス定義

### 1. GameService

**責務**: ゲーム進行の全体的なオーケストレーション

**主要機能**:
- ゲーム開始時の初期化
- ゲーム進行中の状態管理
- ゲーム終了時の処理
- ゲーム結果の保存

**依存コンポーネント**:
- GameEngine（ゲーム進行管理）
- DoboDeclaration（ドボン宣言ロジック）
- MultiplierCalculator（倍率計算）
- DeckManager（山札管理）
- GameHistoryService（ゲーム履歴保存）
- WebSocketHandler（クライアント通知）

**メソッド**:
```typescript
startGame(players: Player[], baseRate: number): GameSession
playCard(sessionId: string, playerId: string, cards: Card[]): void
drawCard(sessionId: string, playerId: string): void
declareDobo(sessionId: string, playerId: string, formula: string, cards: Card[]): void
declareReturn(sessionId: string, playerId: string, formula: string, cards: Card[]): void
endGame(sessionId: string, winner: Player): void
getGameState(sessionId: string): GameState
```

**オーケストレーション例**:
```
1. startGame() が呼ばれる
   ↓
2. GameEngine.startGame() でゲーム初期化
3. DeckManager.initializeDeck() でデッキ初期化
4. DeckManager.dealCards() でカード配布
5. WebSocketHandler.broadcastMessage() でクライアントに通知
   ↓
6. playCard() が呼ばれる
   ↓
7. GameEngine.playCard() でカード操作
8. GameEngine.checkGameEnd() でゲーム終了判定
9. WebSocketHandler.broadcastMessage() でクライアントに通知
   ↓
10. declareDobo() が呼ばれる
    ↓
11. DoboDeclaration.declareDobo() でドボン宣言処理
12. DoboDeclaration.checkReturn() で返し判定
13. MultiplierCalculator.calculatePayment() で支払い金額計算
14. GameHistoryService.saveGameResult() でゲーム結果保存
15. WebSocketHandler.broadcastMessage() でクライアントに通知
```

---

### 2. UserService

**責務**: ユーザー管理のオーケストレーション

**主要機能**:
- ゲストユーザーの作成
- ユーザー情報の取得・更新
- ユーザー認証

**依存コンポーネント**:
- GuestManager（ゲストID管理）
- ProfileManager（プロフィール管理）
- UserRepository（データアクセス）

**メソッド**:
```typescript
createGuest(): User
getUser(userId: string): User
updateProfile(userId: string, profile: Profile): User
authenticateGuest(guestId: string): User | null
```

**オーケストレーション例**:
```
1. createGuest() が呼ばれる
   ↓
2. GuestManager.generateGuestId() で新規ゲストID生成
3. UserRepository.saveUser() でユーザー情報保存
   ↓
4. updateProfile() が呼ばれる
   ↓
5. ProfileManager.validateProfile() でプロフィール検証
6. UserRepository.updateProfile() でプロフィール更新
```

---

### 3. HistoryService

**責務**: ゲーム履歴・統計のオーケストレーション

**主要機能**:
- ゲーム履歴の保存・取得
- 統計情報の計算・取得
- ランキング情報の計算・取得

**依存コンポーネント**:
- GameHistoryService（ゲーム履歴管理）
- StatisticsService（統計情報管理）
- RankingService（ランキング管理）
- HistoryRepository（データアクセス）

**メソッド**:
```typescript
saveGameResult(gameResult: GameResult): void
getGameHistory(userId: string): GameResult[]
getStatistics(userId: string): Statistics
getRanking(): Ranking[]
```

**オーケストレーション例**:
```
1. saveGameResult() が呼ばれる
   ↓
2. GameHistoryService.saveGameResult() でゲーム履歴保存
3. StatisticsService.updateStatistics() で統計情報更新
4. RankingService.updateRanking() でランキング更新
   ↓
5. getStatistics() が呼ばれる
   ↓
6. StatisticsService.getStatistics() で統計情報取得
7. RankingService.getUserRankingPosition() でランキング位置取得
```

---

### 4. RoomService

**責務**: ルーム管理のオーケストレーション

**主要機能**:
- ルーム作成・参加・削除
- ゲームセッション管理
- ゲーム開始

**依存コンポーネント**:
- RoomManager（ルーム管理）
- GameSessionManager（ゲームセッション管理）
- GameService（ゲーム進行）
- WebSocketHandler（クライアント通知）

**メソッド**:
```typescript
createRoom(creatorId: string, baseRate: number): Room
joinRoom(roomId: string, userId: string): boolean
leaveRoom(roomId: string, userId: string): void
startGame(roomId: string): GameSession
listRooms(): Room[]
```

**オーケストレーション例**:
```
1. createRoom() が呼ばれる
   ↓
2. RoomManager.createRoom() でルーム作成
3. WebSocketHandler.broadcastMessage() でクライアントに通知
   ↓
4. joinRoom() が呼ばれる
   ↓
5. RoomManager.joinRoom() でルーム参加
6. WebSocketHandler.broadcastMessage() でクライアントに通知
   ↓
7. startGame() が呼ばれる
   ↓
8. GameSessionManager.createGameSession() でゲームセッション作成
9. GameService.startGame() でゲーム開始
10. WebSocketHandler.broadcastMessage() でクライアントに通知
```

---

## サービス間の通信パターン

### パターン1: GameService → HistoryService

**シナリオ**: ゲーム終了時にゲーム結果を保存

```
GameService.endGame()
  ↓
HistoryService.saveGameResult()
  ↓
GameHistoryService.saveGameResult()
StatisticsService.updateStatistics()
RankingService.updateRanking()
```

---

### パターン2: RoomService → GameService

**シナリオ**: ルーム内でゲーム開始

```
RoomService.startGame()
  ↓
GameSessionManager.createGameSession()
  ↓
GameService.startGame()
  ↓
GameEngine.startGame()
DeckManager.initializeDeck()
DeckManager.dealCards()
```

---

### パターン3: GameService → WebSocketHandler

**シナリオ**: ゲーム状態をクライアントに通知

```
GameService.playCard()
  ↓
GameEngine.playCard()
  ↓
WebSocketHandler.broadcastMessage()
  ↓
クライアント側の Socket.io が受信
```

---

## サービス層の利点

1. **関心の分離**: 各サービスが特定の責務を持つ
2. **再利用性**: 複数のコンポーネントを組み合わせて再利用
3. **テスト容易性**: 各サービスを独立してテスト可能
4. **保守性**: ビジネスロジックの変更が容易
5. **スケーラビリティ**: 新しいサービスの追加が容易

---

## サービス数

- **合計**: 4サービス
  - GameService
  - UserService
  - HistoryService
  - RoomService

