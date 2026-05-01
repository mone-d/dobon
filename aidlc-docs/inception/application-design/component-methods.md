# コンポーネント メソッド定義 - ドボンゲーム

## バックエンド コンポーネント メソッド

### ゲームロジック層

#### GameEngine

```typescript
// ゲーム初期化
startGame(players: Player[], baseRate: number): GameState

// ゲーム状態の取得
getGameState(): GameState

// カード操作
playCard(playerId: string, cards: Card[]): boolean
drawCard(playerId: string): Card
skipTurn(playerId: string): void
reverseTurn(): void
openHand(playerId: string): void

// ターン管理
getCurrentPlayer(): Player
getNextPlayer(): Player
endTurn(): void

// ゲーム終了判定
checkGameEnd(): boolean
getWinner(): Player | null
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

#### DoboDeclaration

```typescript
// ドボン宣言
declareDobo(playerId: string, formula: string, cards: Card[]): DoboResult

// 演算式検証
validateFormula(formula: string, cards: Card[], targetValue: number): boolean

// 返しドボン判定
checkReturn(playerId: string): boolean
declareReturn(playerId: string, formula: string, cards: Card[]): DoboResult

// 勝者決定
determineWinner(doboDeclarations: DoboDeclaration[]): Player
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

#### MultiplierCalculator

```typescript
// 倍率初期化
initializeMultiplier(initialACount: number): number

// 倍率加算
addMultiplier(multiplier: number, condition: string): number

// 倍率計算
calculateMultiplier(conditions: string[]): number

// 支払い金額計算
calculatePayment(drawnCard: Card, baseRate: number, multiplier: number): number
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

#### DeckManager

```typescript
// デッキ初期化
initializeDeck(): Card[]

// カード配布
dealCards(players: Player[], cardsPerPlayer: number): void

// 初期場札決定
determineInitialCard(): Card

// カード操作
drawCard(): Card
playCard(card: Card): void
discardCard(card: Card): void

// 山札再生成
reshuffleDeck(): void

// 山札状態確認
isDeckEmpty(): boolean
getDiscardPile(): Card[]
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

### ユーザー管理層

#### UserService

```typescript
// ゲストユーザー作成
createGuest(): User

// ユーザー情報取得
getUser(userId: string): User

// ユーザー情報更新
updateProfile(userId: string, profile: Profile): User

// ユーザー認証
authenticateGuest(guestId: string): User | null
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

#### GuestManager

```typescript
// 新規ゲストID生成
generateGuestId(): string

// 既存ゲストID再利用
reuseGuestId(guestId: string): boolean

// ゲストID検証
validateGuestId(guestId: string): boolean

// ゲストID保存
saveGuestId(guestId: string): void
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

#### ProfileManager

```typescript
// プロフィール取得
getProfile(userId: string): Profile

// プロフィール更新
updateProfile(userId: string, profile: Profile): Profile

// プロフィール検証
validateProfile(profile: Profile): boolean

// プロフィール削除
deleteProfile(userId: string): void
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

### ゲーム履歴・統計層

#### GameHistoryService

```typescript
// ゲーム結果保存
saveGameResult(gameResult: GameResult): void

// ゲーム履歴取得
getGameHistory(userId: string): GameResult[]

// ゲーム履歴検索
searchGameHistory(userId: string, filters: SearchFilter): GameResult[]

// ゲーム履歴削除
deleteGameHistory(gameId: string): void
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

#### StatisticsService

```typescript
// 統計情報計算
calculateStatistics(userId: string): Statistics

// 統計情報取得
getStatistics(userId: string): Statistics

// 統計情報更新
updateStatistics(userId: string, gameResult: GameResult): void

// 統計情報リセット
resetStatistics(userId: string): void
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

#### RankingService

```typescript
// ランキング計算
calculateRanking(): Ranking[]

// ランキング取得
getRanking(): Ranking[]

// ユーザーランキング位置取得
getUserRankingPosition(userId: string): number

// ランキング更新
updateRanking(userId: string, statistics: Statistics): void
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

### ルーム管理層

#### RoomManager

```typescript
// ルーム作成
createRoom(creatorId: string, baseRate: number): Room

// ルーム参加
joinRoom(roomId: string, userId: string): boolean

// ルーム退出
leaveRoom(roomId: string, userId: string): void

// ルーム削除
deleteRoom(roomId: string): void

// ルーム情報取得
getRoom(roomId: string): Room

// ルーム一覧取得
listRooms(): Room[]

// ルーム検証
validateRoom(roomId: string): boolean
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

#### GameSessionManager

```typescript
// ゲームセッション作成
createGameSession(roomId: string): GameSession

// ゲームセッション開始
startGameSession(sessionId: string): void

// ゲームセッション進行管理
updateGameSession(sessionId: string, gameState: GameState): void

// ゲームセッション終了
endGameSession(sessionId: string, winner: Player): void

// ゲームセッション情報取得
getGameSession(sessionId: string): GameSession

// ゲームセッション検証
validateGameSession(sessionId: string): boolean
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

### リアルタイム通信層

#### WebSocketHandler

```typescript
// WebSocket接続管理
handleConnection(socket: Socket): void
handleDisconnection(socket: Socket): void

// メッセージ受信
onMessage(socket: Socket, message: Message): void

// メッセージ送信
sendMessage(socket: Socket, message: Message): void
broadcastMessage(message: Message): void

// 接続状態管理
getConnectedUsers(): User[]
isUserConnected(userId: string): boolean

// エラーハンドリング
handleError(socket: Socket, error: Error): void
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

## フロントエンド コンポーネント メソッド

### ゲーム画面

#### GameBoard

```typescript
// ゲーム盤面初期化
initializeGameBoard(gameState: GameState): void

// ゲーム状態更新
updateGameState(gameState: GameState): void

// 子コンポーネント管理
renderCardHand(): void
renderDoboDeclarationUI(): void
renderReturnDoboUI(): void
renderPaymentUI(): void

// ゲーム進行
handleCardPlay(cards: Card[]): void
handleCardDraw(): void
handleDoboDeclaration(formula: string): void
handleReturnDobo(formula: string): void
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

#### CardHand

```typescript
// 手札表示
renderCardHand(cards: Card[]): void

// カード選択
selectCard(card: Card): void
deselectCard(card: Card): void
getSelectedCards(): Card[]

// カード操作
playSelectedCards(): void
drawCard(): void

// 手札更新
updateCardHand(cards: Card[]): void
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

#### DoboDeclarationUI

```typescript
// ドボン宣言UI表示
renderDoboDeclarationUI(): void

// 演算式選択
selectFormula(formula: string): void
getSelectedFormula(): string

// ドボン宣言送信
submitDoboDeclaration(): void

// UI非表示
hideDoboDeclarationUI(): void
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

#### ReturnDoboUI

```typescript
// 返しドボン判定UI表示
renderReturnDoboUI(): void

// 返し宣言
declareReturn(formula: string): void
declareNoReturn(): void

// UI非表示
hideReturnDoboUI(): void
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

#### PaymentUI

```typescript
// 支払い画面表示
renderPaymentUI(payment: Payment): void

// ランダムカード引き演出
animateCardDraw(): void

// 支払い金額表示
displayPaymentAmount(amount: number): void

// 支払い完了確認
confirmPayment(): void

// UI非表示
hidePaymentUI(): void
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

### ロビー・ルーム管理画面

#### LobbyScreen

```typescript
// ロビー画面初期化
initializeLobbyScreen(): void

// ルーム一覧表示
renderRoomList(rooms: Room[]): void

// ルーム作成
createRoom(baseRate: number): void

// ルーム参加
joinRoom(roomId: string): void

// ルーム一覧更新
updateRoomList(rooms: Room[]): void
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

#### RoomScreen

```typescript
// ルーム画面初期化
initializeRoomScreen(room: Room): void

// プレイヤー一覧表示
renderPlayerList(players: Player[]): void

// 基本レート設定
setBaseRate(baseRate: number): void

// ゲーム開始
startGame(): void

// ルーム情報更新
updateRoomInfo(room: Room): void
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

### プロフィール・統計画面

#### ProfileScreen

```typescript
// プロフィール画面初期化
initializeProfileScreen(user: User): void

// ユーザー情報表示
renderUserInfo(user: User): void

// ユーザー情報編集
editUserInfo(profile: Profile): void

// ユーザー情報保存
saveUserInfo(profile: Profile): void

// プロフィール更新
updateProfile(user: User): void
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

#### StatisticsScreen

```typescript
// 統計画面初期化
initializeStatisticsScreen(userId: string): void

// ゲーム履歴表示
renderGameHistory(gameHistory: GameResult[]): void

// 統計情報表示
renderStatistics(statistics: Statistics): void

// ランキング表示
renderRanking(ranking: Ranking[]): void

// 統計情報更新
updateStatistics(statistics: Statistics): void
```

**注**: 詳細なビジネスロジックは Functional Design フェーズで定義

---

## メソッド数

- **バックエンド**: 約60メソッド
- **フロントエンド**: 約40メソッド
- **合計**: 約100メソッド

**注**: 詳細なビジネスロジック（パラメータ検証、エラーハンドリング、データ変換など）は Functional Design フェーズで定義されます。

