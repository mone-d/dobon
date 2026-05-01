# Functional Design Plan - Unit 1 (Frontend)

## ユニット概要

**Unit 1: フロントエンド**
- 責務: ゲーム画面、ロビー・ルーム管理、プロフィール・統計画面の実装
- 技術スタック: Vue.js 3 / React + TypeScript
- 実装方針: モックデータ、モックAPI、モックWebSocket を使用

---

## 機能設計計画

### [x] 1. ドメインモデル設計

#### 1.1 主要なドメインエンティティ

フロントエンドで管理する主要なドメインエンティティについて、以下を提案します：

**ユーザー**
- userId: string
- userName: string
- avatar: string
- bio: string

**ゲーム状態**
- gameId: string
- currentPlayer: Player
- fieldCard: Card
- players: Player[]
- multiplier: number
- gamePhase: 'playing' | 'dobo-declaration' | 'return-dobo' | 'payment' | 'ended'

**ルーム**
- roomId: string
- roomCode: string
- creator: User
- players: User[]
- baseRate: number
- status: 'waiting' | 'playing' | 'ended'

**ゲーム履歴**
- gameId: string
- date: Date
- players: User[]
- winner: User
- payment: number
- multiplier: number

これらのエンティティで十分ですか？追加・削除・変更が必要な部分はありますか？

[Answer]: ok

---

#### 1.2 エンティティ間の関係

エンティティ間の関係について、以下を提案します：

- **ユーザー** ← → **ルーム**: 1対多（1つのルームに複数のユーザー）
- **ルーム** ← → **ゲーム状態**: 1対1（1つのルームで1つのゲーム進行中）
- **ゲーム状態** ← → **プレイヤー**: 1対多（1つのゲームに複数のプレイヤー）
- **ユーザー** ← → **ゲーム履歴**: 1対多（1人のユーザーが複数のゲームに参加）

この関係で問題ありませんか？変更が必要な部分はありますか？

[Answer]: ok

---

### [x] 2. 状態管理設計

#### 2.1 グローバル状態

フロントエンドのグローバル状態（Pinia/Redux）について、以下を提案します：

**ユーザーストア**
- currentUser: User | null
- isLoggedIn: boolean
- actions: createGuest(), updateProfile()

**ゲームストア**
- gameState: GameState | null
- gameHistory: GameResult[]
- actions: startGame(), playCard(), drawCard(), declareDobo(), declareReturn()

**ルームストア**
- rooms: Room[]
- currentRoom: Room | null
- actions: createRoom(), joinRoom(), leaveRoom(), listRooms()

**統計ストア**
- statistics: Statistics | null
- ranking: Ranking[]
- actions: getStatistics(), getRanking()

この状態管理構成で問題ありませんか？変更が必要な部分はありますか？

[Answer]: ok

---

#### 2.2 ローカル状態

各コンポーネントのローカル状態について、以下を提案します：

**GameBoard コンポーネント**
- selectedCards: Card[]
- isWaitingForResponse: boolean

**DoboDeclarationUI コンポーネント**
- selectedFormula: string | null
- formulaOptions: string[]

**ReturnDoboUI コンポーネント**
- isReturning: boolean | null

**CardHand コンポーネント**
- hoveredCard: Card | null

この構成で問題ありませんか？変更が必要な部分はありますか？

[Answer]: ok

---

### [x] 3. ユーザーインタラクション設計

#### 3.1 ゲーム画面のインタラクション

ゲーム画面でのユーザーインタラクションについて、以下を提案します：

**カード操作**
1. ユーザーが手札からカードを選択
2. 選択されたカードがハイライト表示
3. 「カードを出す」ボタンをクリック
4. サーバーに playCard リクエスト送信
5. ゲーム状態が更新され、画面が再描画

**ドボン宣言**
1. ユーザーが「ドボン」ボタンをクリック
2. ドボン宣言UIが表示
3. ユーザーが演算式を選択
4. 「宣言」ボタンをクリック
5. サーバーに declareDobo リクエスト送信
6. 返し判定フェーズに移行

**返しドボン判定**
1. 他のプレイヤーがドボンを宣言
2. 返しドボン判定UIが表示
3. ユーザーが「返す」または「返さない」を選択
4. サーバーに declareReturn リクエスト送信
5. ゲーム結果が表示

このインタラクション設計で問題ありませんか？変更が必要な部分はありますか？

[Answer]: いろいろ変更したいです。
カード操作として、場に出すときはドラッグ操作で場に出したいです。
場の一定領域までドラッグして離したら場に出る感じです。
また、複数枚をまとめて出す場合は手札で複数枚を事前にタップして選択した状態でドラッグすることで場に出る感じです。
ドボン宣言は常にドボン宣言UIが出ていて、演算式が選べるようにして欲しいです。ドボン宣言までのスピードが大事なので常にワンタップでできる状態にしたいです。

---

#### 3.2 ロビー・ルーム管理のインタラクション

ロビー・ルーム管理でのユーザーインタラクションについて、以下を提案します：

**ロビー画面**
1. ユーザーがロビー画面を表示
2. ルーム一覧が表示
3. ユーザーが「ルーム作成」ボタンをクリック
4. ルーム作成ダイアログが表示
5. ユーザーが基本レートを入力
6. 「作成」ボタンをクリック
7. ルームが作成され、ルーム画面に遷移

**ルーム画面**
1. ユーザーがルーム画面を表示
2. プレイヤー一覧が表示
3. ユーザーが基本レートを確認
4. 全プレイヤーが準備完了
5. ユーザーが「ゲーム開始」ボタンをクリック
6. ゲーム画面に遷移

このインタラクション設計で問題ありませんか？変更が必要な部分はありますか？

[Answer]: 良いです。気になるのは次のゲームに移るときです。毎回ルームに戻るのは面倒なので、一度ゲームを始めたら無限に次のゲームが開始するようにしてください。ゲームをやめるときはゲーム中に次で抜けることを宣言させるようにします。一人抜けたら全員ルームに戻るようにしてください。

---

### [x] 4. ビジネスルール設計

#### 4.1 ゲームプレイのビジネスルール

ゲームプレイのビジネスルールについて、以下を提案します：

**カード操作の検証**
- 出すカードは場札の条件を満たす必要がある（同じ数字またはスート）
- 複数枚出す場合は同じ数字である必要がある
- 1ターンに1枚のみ山札から引ける

**ドボン宣言の検証**
- 手札の全カードを使用する必要がある
- 演算式は四則演算のうち1種類のみ
- 自分が直前に出したカードに対してはドボン不可

**返しドボン判定**
- 各プレイヤーの返し宣言は他のプレイヤーには見えない
- 全プレイヤーが返し宣言の有無を確定させるまで待機
- 複数人がドボン可能な場合、最後に宣言したプレイヤーが勝者

このビジネスルール設計で問題ありませんか？変更が必要な部分はありますか？

[Answer]: 返し宣言のうち、返さない宣言は他プレイヤーに見えないで良いのですが、返しが発生した場合は都度反映して他プレイヤーにもゲーム進行としてわかるようにしてください。

---

#### 4.2 ユーザー管理のビジネスルール

ユーザー管理のビジネスルールについて、以下を提案します：

**ゲストログイン**
- 新規ゲストIDを生成するか、既存のゲストIDを入力して再利用するかを選択
- ゲストIDはブラウザのローカルストレージに保存可能

**プロフィール管理**
- ユーザー名、アバター、自己紹介を編集可能
- 編集内容はサーバーに保存

このビジネスルール設計で問題ありませんか？変更が必要な部分はありますか？

[Answer]: ゲストIDはストレージに保管もしくは手入力できるようにしてください。

---

### [x] 5. データフロー設計

#### 5.1 ゲーム開始時のデータフロー

ゲーム開始時のデータフローについて、以下を提案します：

```
1. ユーザーが「ゲーム開始」ボタンをクリック
2. フロントエンドが startGame() API を呼び出し
3. バックエンド（モック）がゲーム状態を返す
4. フロントエンドがゲーム状態をストアに保存
5. GameBoard コンポーネントが再描画
6. ゲーム画面が表示
```

このデータフロー設計で問題ありませんか？変更が必要な部分はありますか？

[Answer]: ok

---

#### 5.2 ドボン宣言時のデータフロー

ドボン宣言時のデータフローについて、以下を提案します：

```
1. ユーザーが「ドボン」ボタンをクリック
2. DoboDeclarationUI が表示
3. ユーザーが演算式を選択
4. フロントエンドが declareDobo() API を呼び出し
5. バックエンド（モック）がドボン結果を返す
6. フロントエンドが返し判定フェーズに移行
7. ReturnDoboUI が表示
8. 各プレイヤーが返し宣言
9. フロントエンドが支払い情報を表示
10. PaymentUI が表示
```

このデータフロー設計で問題ありませんか？変更が必要な部分はありますか？

[Answer]: 前の指摘を踏まえて考え直してください。

---

### [x] 6. モック実装設計

#### 6.1 モックデータ

モックデータについて、以下を提案します：

**モックゲーム状態**
```typescript
const mockGameState = {
  gameId: 'game123',
  currentPlayer: 'player1',
  fieldCard: { suit: 'hearts', value: 7 },
  players: [
    { id: 'player1', name: 'Player 1', hand: [...], handCount: 5 },
    { id: 'player2', name: 'Player 2', hand: [...], handCount: 6 }
  ],
  multiplier: 1,
  gamePhase: 'playing'
};
```

**モックユーザー**
```typescript
const mockUser = {
  userId: 'guest123',
  userName: 'Guest User',
  avatar: 'avatar1.png',
  bio: 'Hello!'
};
```

このモックデータ設計で問題ありませんか？変更が必要な部分はありますか？

[Answer]: 前の指摘を踏まえて考え直してください。

---

#### 6.2 モックAPI

モックAPIについて、以下を提案します：

```typescript
const mockApi = {
  createGuest: () => Promise.resolve({ id: 'guest123', name: 'Guest' }),
  createRoom: (baseRate) => Promise.resolve({ id: 'room123', code: 'ABC123' }),
  joinRoom: (roomId) => Promise.resolve({ success: true }),
  startGame: () => Promise.resolve(mockGameState),
  playCard: (cards) => Promise.resolve({ success: true, newState: {...} }),
  drawCard: () => Promise.resolve({ card: {...}, newState: {...} }),
  declareDobo: (formula) => Promise.resolve({ valid: true, winner: 'player1' }),
  declareReturn: (formula) => Promise.resolve({ valid: true, winner: 'player1' })
};
```

このモックAPI設計で問題ありませんか？変更が必要な部分はありますか？

[Answer]: 前の指摘を踏まえて考え直してください。

---

#### 6.3 モックWebSocket

モックWebSocketについて、以下を提案します：

```typescript
const mockWebSocket = {
  on: (event, callback) => {
    // イベントシミュレーション
    if (event === 'game:state') {
      setTimeout(() => callback(mockGameState), 1000);
    }
    if (event === 'game:dobo') {
      setTimeout(() => callback({ playerId: 'player2', formula: '3+4' }), 2000);
    }
  },
  emit: (event, data) => console.log('Emit:', event, data)
};
```

このモックWebSocket設計で問題ありませんか？変更が必要な部分はありますか？

[Answer]: 前の指摘を踏まえて考え直してください。

---

### [x] 7. コンポーネント設計

#### 7.1 コンポーネント階層

コンポーネント階層について、以下を提案します：

```
App
├── LobbyScreen
│   └── RoomList
├── RoomScreen
│   └── PlayerList
├── GameBoard
│   ├── CardHand
│   ├── DoboDeclarationUI
│   ├── ReturnDoboUI
│   └── PaymentUI
├── ProfileScreen
└── StatisticsScreen
    ├── GameHistory
    ├── Statistics
    └── Ranking
```

このコンポーネント階層で問題ありませんか？変更が必要な部分はありますか？

[Answer]: 前の指摘を踏まえて考え直してください。

---

#### 7.2 コンポーネント間の通信

コンポーネント間の通信について、以下を提案します：

- **親子通信**: Props で親から子へデータ渡す、emit で子から親へイベント送信
- **兄弟通信**: グローバルストア（Pinia/Redux）を使用
- **API通信**: 各コンポーネントがストアのアクションを呼び出し

このコンポーネント間通信設計で問題ありませんか？変更が必要な部分はありますか？

[Answer]: 前の指摘を踏まえて考え直してください。

---

### [x] 8. 検証設計

#### 8.1 入力検証

入力検証について、以下を提案します：

**ユーザー入力**
- ユーザー名: 1-20文字
- 基本レート: 正の整数
- 演算式: 有効な四則演算式

**カード操作**
- 出すカード: 場札の条件を満たす
- 複数枚出す: 同じ数字

このバリデーション設計で問題ありませんか？変更が必要な部分はありますか？

[Answer]: 前の指摘を踏まえて考え直してください。

---

#### 8.2 エラーハンドリング

エラーハンドリングについて、以下を提案します：

**API エラー**
- ネットワークエラー: リトライ表示
- バリデーションエラー: エラーメッセージ表示
- サーバーエラー: エラーメッセージ表示

**ユーザーエラー**
- 無効なカード操作: 警告メッセージ表示
- 無効なドボン宣言: 警告メッセージ表示

このエラーハンドリング設計で問題ありませんか？変更が必要な部分はありますか？

[Answer]: 前の指摘を踏まえて考え直してください。

---

## 機能設計計画の実行

上記のすべての質問に回答いただければ、以下の機能設計成果物を生成します：

1. **business-logic-model.md** - ビジネスロジックモデル
2. **business-rules.md** - ビジネスルール
3. **domain-entities.md** - ドメインエンティティ
4. **frontend-components.md** - フロントエンドコンポーネント設計

