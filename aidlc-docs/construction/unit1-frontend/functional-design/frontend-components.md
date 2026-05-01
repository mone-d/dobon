# Frontend Components Design - Unit 1 (Frontend)

## フロントエンドコンポーネント設計

### 1. コンポーネント階層

```
App
├── LobbyScreen
│   ├── RoomList
│   └── RoomCreateDialog
├── RoomScreen
│   ├── PlayerList
│   └── GameStartButton
├── GameBoard
│   ├── FieldCard
│   ├── PlayerHands
│   ├── CardHand
│   ├── DoboDeclarationUI
│   ├── ReturnDoboUI
│   ├── PaymentUI
│   └── GameInfo
├── ProfileScreen
│   ├── UserInfo
│   └── ProfileEditForm
└── StatisticsScreen
    ├── GameHistory
    ├── Statistics
    └── Ranking
```

---

### 2. 各コンポーネントの詳細設計

#### 2.1 App コンポーネント

**責務**: アプリケーション全体のルーティングと状態管理

**Props**: なし

**State**:
```typescript
{
  currentScreen: 'login' | 'lobby' | 'room' | 'game' | 'profile' | 'statistics';
}
```

**Methods**:
- navigateTo(screen): 画面遷移
- handleLogout(): ログアウト

**子コンポーネント**: LobbyScreen, RoomScreen, GameBoard, ProfileScreen, StatisticsScreen

---

#### 2.2 LobbyScreen コンポーネント

**責務**: ロビー画面の表示、ルーム一覧表示、ルーム作成

**Props**: なし

**State**:
```typescript
{
  rooms: Room[];
  isCreatingRoom: boolean;
  baseRate: number;
}
```

**Methods**:
- loadRooms(): ルーム一覧を取得
- createRoom(baseRate): ルーム作成
- joinRoom(roomId): ルーム参加
- openCreateDialog(): ルーム作成ダイアログを開く
- closeCreateDialog(): ルーム作成ダイアログを閉じる

**子コンポーネント**: RoomList, RoomCreateDialog

**API 統合**:
- GET /api/rooms - ルーム一覧取得
- POST /api/rooms - ルーム作成
- POST /api/rooms/:id/join - ルーム参加

---

#### 2.3 RoomScreen コンポーネント

**責務**: ルーム画面の表示、プレイヤー一覧表示、ゲーム開始

**Props**:
```typescript
{
  roomId: string;
}
```

**State**:
```typescript
{
  room: Room;
  players: User[];
  baseRate: number;
  isGameStarting: boolean;
}
```

**Methods**:
- loadRoom(roomId): ルーム情報を取得
- startGame(): ゲーム開始
- leaveRoom(): ルーム退出

**子コンポーネント**: PlayerList, GameStartButton

**API 統合**:
- GET /api/rooms/:id - ルーム情報取得
- POST /api/rooms/:id/start - ゲーム開始
- POST /api/rooms/:id/leave - ルーム退出

---

#### 2.4 GameBoard コンポーネント

**責務**: ゲーム盤面の表示、ゲーム進行管理

**Props**:
```typescript
{
  gameState: GameState;
}
```

**State**:
```typescript
{
  selectedCards: Card[];
  isWaitingForResponse: boolean;
  draggedCard: Card | null;
  isDragging: boolean;
}
```

**Methods**:
- selectCard(card): カード選択
- deselectCard(card): カード選択解除
- playCard(cards): カードを出す
- drawCard(): 山札から引く
- declareDobo(formula): ドボン宣言
- declareReturn(formula): 返しドボン宣言
- handleDragStart(card): ドラッグ開始
- handleDragEnd(position): ドラッグ終了
- handleDrop(position): ドロップ処理
- handleDragStart(card): ドラッグ開始
- handleDragEnd(position): ドラッグ終了
- handleDrop(position): ドロップ処理

**子コンポーネント**: FieldCard, PlayerHands, CardHand, DoboDeclarationUI, ReturnDoboUI, PaymentUI, GameInfo

**API 統合**:
- POST /api/games/:id/play-card - カードを出す
- POST /api/games/:id/draw-card - 山札から引く
- POST /api/games/:id/declare-dobo - ドボン宣言
- POST /api/games/:id/declare-return - 返しドボン宣言

**WebSocket 統合**:
- game:state - ゲーム状態更新
- game:dobo - ドボン宣言
- game:return - 返しドボン宣言
- game:payment - 支払い情報

---

#### 2.5 CardHand コンポーネント

**責務**: プレイヤーの手札表示・操作

**Props**:
```typescript
{
  cards: Card[];
  selectedCards: Card[];
  onSelectCard: (card: Card) => void;
  onDeselectCard: (card: Card) => void;
  onDragStart: (card: Card) => void;
  onDragEnd: () => void;
}
```

**State**:
```typescript
{
  hoveredCard: Card | null;
}
```

**Methods**:
- handleCardClick(card): カードクリック処理
- handleCardDragStart(card): ドラッグ開始処理
- handleCardDragEnd(): ドラッグ終了処理
- handleCardMouseEnter(card): マウスホバー処理
- handleCardMouseLeave(): マウスリーブ処理

**子コンポーネント**: Card

---

#### 2.6 DoboDeclarationUI コンポーネント

**責務**: ドボン宣言UI、演算式選択

**Props**:
```typescript
{
  cards: Card[];
  fieldCard: Card;
  onDeclareDobo: (formula: string) => void;
}
```

**State**:
```typescript
{
  selectedFormula: string | null;
  formulaOptions: string[];
}
```

**Methods**:
- generateFormulaOptions(cards, fieldCard): 演算式オプションを生成
- selectFormula(formula): 演算式を選択してワンタップで宣言
- declareDobo(): ドボン宣言（自動実行）

---

#### 2.7 ReturnDoboUI コンポーネント

**責務**: 返しドボン判定UI

**Props**:
```typescript
{
  onDeclareReturn: (formula: string) => void;
  onDeclareNoReturn: () => void;
}
```

**State**:
```typescript
{
  isReturning: boolean | null;
  selectedFormula: string | null;
}
```

**Methods**:
- declareReturn(formula): 返しドボン宣言
- declareNoReturn(): 返さないを宣言

---

#### 2.8 PaymentUI コンポーネント

**責務**: 支払い画面、山札からのランダムカード引き演出

**Props**:
```typescript
{
  payment: Payment;
  onConfirm: () => void;
}
```

**State**:
```typescript
{
  drawnCard: Card | null;
  isAnimating: boolean;
}
```

**Methods**:
- animateCardDraw(): カード引き演出
- displayPaymentAmount(): 支払い金額表示
- confirmPayment(): 支払い確認

---

#### 2.9 ProfileScreen コンポーネント

**責務**: プロフィール画面、ユーザー情報表示・編集

**Props**: なし

**State**:
```typescript
{
  user: User;
  isEditing: boolean;
  editedUser: User;
}
```

**Methods**:
- loadUser(): ユーザー情報を取得
- editProfile(): プロフィール編集開始
- saveProfile(): プロフィール保存
- cancelEdit(): 編集キャンセル

**子コンポーネント**: UserInfo, ProfileEditForm

**API 統合**:
- GET /api/users/:id - ユーザー情報取得
- PUT /api/users/:id - ユーザー情報更新

---

#### 2.10 StatisticsScreen コンポーネント

**責務**: 統計情報画面、ゲーム履歴・統計・ランキング表示

**Props**: なし

**State**:
```typescript
{
  gameHistory: GameResult[];
  statistics: Statistics;
  ranking: Ranking[];
  activeTab: 'history' | 'statistics' | 'ranking';
}
```

**Methods**:
- loadGameHistory(): ゲーム履歴を取得
- loadStatistics(): 統計情報を取得
- loadRanking(): ランキングを取得
- switchTab(tab): タブ切り替え

**子コンポーネント**: GameHistory, Statistics, Ranking

**API 統合**:
- GET /api/history - ゲーム履歴取得
- GET /api/statistics - 統計情報取得
- GET /api/ranking - ランキング取得

---

### 3. コンポーネント間の通信

#### 3.1 親子通信

**Props で親から子へデータ渡す**
```typescript
// 親コンポーネント
<GameBoard :gameState="gameState" />

// 子コンポーネント
props: {
  gameState: GameState
}
```

**emit で子から親へイベント送信**
```typescript
// 子コンポーネント
this.$emit('selectCard', card);

// 親コンポーネント
<CardHand @selectCard="handleSelectCard" />
```

#### 3.2 兄弟通信

**グローバルストア（Pinia/Redux）を使用**
```typescript
// ストア
const gameStore = useGameStore();

// コンポーネント1
gameStore.playCard(cards);

// コンポーネント2
const gameState = gameStore.gameState;
```

#### 3.3 API 通信

**各コンポーネントがストアのアクションを呼び出し**
```typescript
// ストア
async playCard(cards) {
  const response = await api.post('/games/:id/play-card', { cards });
  this.gameState = response.data;
}

// コンポーネント
const gameStore = useGameStore();
await gameStore.playCard(selectedCards);
```

---

### 4. 状態管理設計

#### 4.1 グローバル状態（Pinia/Redux）

**ユーザーストア**
```typescript
{
  currentUser: User | null;
  isLoggedIn: boolean;
  
  actions: {
    createGuest(): Promise<User>;
    updateProfile(profile: Profile): Promise<User>;
  }
}
```

**ゲームストア**
```typescript
{
  gameState: GameState | null;
  gameHistory: GameResult[];
  
  actions: {
    startGame(): Promise<GameState>;
    playCard(cards: Card[]): Promise<GameState>;
    drawCard(): Promise<GameState>;
    declareDobo(formula: string): Promise<DoboResult>;
    declareReturn(formula: string): Promise<DoboResult>;
  }
}
```

**ルームストア**
```typescript
{
  rooms: Room[];
  currentRoom: Room | null;
  
  actions: {
    createRoom(baseRate: number): Promise<Room>;
    joinRoom(roomId: string): Promise<Room>;
    leaveRoom(): Promise<void>;
    listRooms(): Promise<Room[]>;
  }
}
```

**統計ストア**
```typescript
{
  statistics: Statistics | null;
  ranking: Ranking[];
  
  actions: {
    getStatistics(): Promise<Statistics>;
    getRanking(): Promise<Ranking[]>;
  }
}
```

#### 4.2 ローカル状態（コンポーネント）

**GameBoard コンポーネント**
```typescript
{
  selectedCards: Card[];
  isWaitingForResponse: boolean;
  draggedCard: Card | null;
  isDragging: boolean;
}
```

**DoboDeclarationUI コンポーネント**
```typescript
{
  selectedFormula: string | null;
  formulaOptions: string[];
}
```

**ReturnDoboUI コンポーネント**
```typescript
{
  isReturning: boolean | null;
  selectedFormula: string | null;
}
```

**CardHand コンポーネント**
```typescript
{
  hoveredCard: Card | null;
}
```

---

### 5. ユーザーインタラクションフロー

#### 5.1 ゲーム画面のインタラクション

**カード操作**
```
1. ユーザーが手札のカードをタップ
   → CardHand コンポーネントが selectCard イベント発行
   → GameBoard コンポーネントが selectedCards を更新
   → 異なる数字をタップした場合は前の選択を自動解除

2. ユーザーが選択したカードをドラッグ
   → CardHand コンポーネントが dragStart イベント発行
   → GameBoard コンポーネントが isDragging を true に設定

3. ユーザーが場領域で離す
   → GameBoard コンポーネントが drop イベント処理
   → 場札の条件を満たさない場合はキャンセル（手札に戻る）
   → GameBoard コンポーネントが playCard() を呼び出し
   → ゲームストアが API リクエスト送信
   → ゲーム状態が更新
   → GameBoard コンポーネントが再描画
```

**ドボン宣言**
```
1. DoboDeclarationUI が常に画面に表示
   → ユーザーが演算式を選択
   → DoboDeclarationUI コンポーネントが selectFormula() を呼び出し
   → ワンタップで自動的に declareDobo() が実行

2. ドボン宣言送信
   → DoboDeclarationUI コンポーネントが declareDobo イベント発行
   → GameBoard コンポーネントが declareDobo() を呼び出し
   → ゲームストアが API リクエスト送信
   → ゲーム状態が返し判定フェーズに移行
   → ReturnDoboUI コンポーネントが表示

3. 返しドボン判定
   → 各プレイヤーが返し宣言
   → 返さない宣言は他プレイヤーに見えない
   → 返しが発生した場合は WebSocket で game:return イベント受信
   → ゲーム画面に「返しドボン発生」と表示
```

---

### 6. API 統合ポイント

#### 6.1 REST API 統合

| エンドポイント | メソッド | 説明 | コンポーネント |
|---|---|---|---|
| /api/users | POST | ゲストユーザー作成 | App |
| /api/users/:id | GET | ユーザー情報取得 | ProfileScreen |
| /api/users/:id | PUT | ユーザー情報更新 | ProfileScreen |
| /api/rooms | GET | ルーム一覧取得 | LobbyScreen |
| /api/rooms | POST | ルーム作成 | LobbyScreen |
| /api/rooms/:id | GET | ルーム情報取得 | RoomScreen |
| /api/rooms/:id/join | POST | ルーム参加 | LobbyScreen |
| /api/rooms/:id/start | POST | ゲーム開始 | RoomScreen |
| /api/games/:id/play-card | POST | カードを出す | GameBoard |
| /api/games/:id/draw-card | POST | 山札から引く | GameBoard |
| /api/games/:id/declare-dobo | POST | ドボン宣言 | GameBoard |
| /api/games/:id/declare-return | POST | 返しドボン宣言 | GameBoard |
| /api/history | GET | ゲーム履歴取得 | StatisticsScreen |
| /api/statistics | GET | 統計情報取得 | StatisticsScreen |
| /api/ranking | GET | ランキング取得 | StatisticsScreen |

#### 6.2 WebSocket 統合

| イベント | 説明 | コンポーネント |
|---|---|---|
| game:state | ゲーム状態更新 | GameBoard |
| game:dobo | ドボン宣言 | GameBoard |
| game:return | 返しドボン宣言 | GameBoard |
| game:payment | 支払い情報 | GameBoard |
| room:join | ルーム参加 | RoomScreen |
| room:leave | ルーム退出 | RoomScreen |
| room:start | ゲーム開始 | RoomScreen |

