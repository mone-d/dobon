# API Contracts - Unit 2 (Backend - Game Logic)

## 概要

Unit 2 バックエンドゲームロジック層の API 契約を定義する。
通信方式: WebSocket（Firebase Realtime Database または Socket.io）

---

## WebSocket イベント一覧

### クライアント → サーバー（送信イベント）

| イベント名 | 説明 |
|---|---|
| `game:play-card` | カードを出す |
| `game:draw-card` | 山札からカードを引く |
| `game:select-suit` | 8（ワイルド）のスート指定 |
| `game:declare-dobo` | ドボン宣言 |
| `game:declare-return` | 返しドボン宣言 |
| `game:declare-no-return` | 返さない宣言 |
| `game:leave-next` | 次のゲームで退出宣言 |

### サーバー → クライアント（受信イベント）

| イベント名 | 説明 |
|---|---|
| `game:started` | ゲーム開始通知 |
| `game:state-updated` | ゲーム状態更新 |
| `game:card-played` | カードが出された通知 |
| `game:card-drawn` | カードが引かれた通知 |
| `game:suit-selected` | スートが指定された通知 |
| `game:dobo` | ドボン宣言通知 |
| `game:return` | 返しドボン発生通知 |
| `game:penalty` | ペナルティ発生通知 |
| `game:burst` | バースト発生通知 |
| `game:ended` | ゲーム終了通知 |
| `game:error` | エラー通知 |

---

## クライアント → サーバー イベント詳細

### `game:play-card`

カードを出す。

```typescript
// リクエスト
{
  sessionId: string;   // ゲームセッションID
  playerId: string;    // プレイヤーID
  cards: Card[];       // 出すカード（1枚以上）
}

// レスポンス（ack）
{
  success: boolean;    // true: 成功 / false: 失敗（無効なカード操作）
}
```

**成功時**: `game:card-played` イベントを全プレイヤーに送信
**失敗時**: `success: false` のみ返す（エラーメッセージなし）

---

### `game:draw-card`

山札からカードを引く。

```typescript
// リクエスト
{
  sessionId: string;
  playerId: string;
}

// レスポンス（ack）
{
  success: boolean;
  card?: Card;         // 引いたカード（自分のみ見える）
}
```

**成功時**: `game:card-drawn` イベントを全プレイヤーに送信（カード情報は宣言者のみ）
**失敗時**: `success: false`（既に引いている場合）

---

### `game:select-suit`

8（ワイルド）のスートを指定する。

```typescript
// リクエスト
{
  sessionId: string;
  playerId: string;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
}

// レスポンス（ack）
{
  success: boolean;
}
```

**成功時**: `game:suit-selected` イベントを全プレイヤーに送信

---

### `game:declare-dobo`

ドボン宣言。システムが自動で演算式を計算する。

```typescript
// リクエスト
{
  sessionId: string;
  playerId: string;
  // 演算子の指定は不要（システムが自動計算）
}

// レスポンス（ack）
{
  success: boolean;
  // false の場合: ペナルティ処理済み（無効な式 or ルール違反）
}
```

**成功時**: `game:dobo` イベントを全プレイヤーに送信
**失敗時**: `success: false` + `game:penalty` イベントを全プレイヤーに送信

---

### `game:declare-return`

返しドボン宣言。システムが自動で演算式を計算する。

```typescript
// リクエスト
{
  sessionId: string;
  playerId: string;
}

// レスポンス（ack）
{
  success: boolean;
}
```

**成功時**: `game:return` イベントを全プレイヤーに送信
**失敗時**: `success: false` + `game:penalty` イベントを全プレイヤーに送信

---

### `game:declare-no-return`

返さない宣言。他のプレイヤーには通知しない。

```typescript
// リクエスト
{
  sessionId: string;
  playerId: string;
}

// レスポンス（ack）
{
  success: boolean;
}
```

**成功時**: 宣言者にのみ `success: true` を返す（他プレイヤーへの通知なし）

---

### `game:leave-next`

次のゲームで退出宣言。

```typescript
// リクエスト
{
  sessionId: string;
  playerId: string;
}

// レスポンス（ack）
{
  success: boolean;
}
```

---

## サーバー → クライアント イベント詳細

### `game:started`

ゲーム開始通知。

```typescript
{
  sessionId: string;
  gameState: {
    gameId: string;
    players: Array<{
      id: string;
      user: User;
      handCount: number;       // 手札枚数（他プレイヤーの手札枚数）
      hand?: Card[];           // 自分の手札のみ含まれる
      isCurrentPlayer: boolean;
    }>;
    fieldCard: Card;
    multiplier: number;
    gamePhase: 'playing';
    turnOrder: string[];       // プレイヤーIDの順序
    turnDirection: 'forward';
    lastPlayedPlayer: null;
  };
}
```

---

### `game:state-updated`

ゲーム状態更新通知（汎用）。

```typescript
{
  sessionId: string;
  gameState: GameStateForClient;  // 下記参照
}

// GameStateForClient（クライアントに送信する状態）
interface GameStateForClient {
  gameId: string;
  currentPlayer: { id: string; user: User; };
  fieldCard: Card;
  players: Array<{
    id: string;
    user: User;
    handCount: number;
    hand?: Card[];           // 自分のみ、または isPublic=true のカードのみ
    isCurrentPlayer: boolean;
  }>;
  multiplier: number;
  gamePhase: GamePhase;
  lastPlayedPlayer: { id: string; user: User; } | null;
  turnOrder: string[];
  turnDirection: 'forward' | 'reverse';
}
```

**注**: 各プレイヤーの `hand` は以下のルールで送信:
- 自分自身: 全カードを送信
- 他プレイヤー: `isPublic: true` のカードのみ送信（K効果で公開されたカード）

---

### `game:card-played`

カードが出された通知。

```typescript
{
  sessionId: string;
  playerId: string;
  playerName: string;
  cards: Card[];           // 出されたカード
  fieldCard: Card;         // 新しい場札
  nextPlayerId: string;    // 次のプレイヤーID
  specialEffect?: {
    type: 'skip' | 'draw2' | 'wild' | 'reverse' | 'open';
    targetPlayerId?: string;  // 効果対象プレイヤー
  };
}
```

---

### `game:card-drawn`

カードが引かれた通知。

```typescript
{
  sessionId: string;
  playerId: string;
  playerName: string;
  // card は含まない（他プレイヤーには何を引いたか見えない）
  newHandCount: number;    // 引いた後の手札枚数
}
```

---

### `game:suit-selected`

スートが指定された通知（8効果）。

```typescript
{
  sessionId: string;
  playerId: string;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  fieldCard: Card;         // スートが更新された場札
}
```

---

### `game:dobo`

ドボン宣言通知。

```typescript
{
  sessionId: string;
  declaration: {
    playerId: string;
    playerName: string;
    formula: string;         // システムが計算した演算式（例: "3+4+5"）
    cards: Card[];           // 使用したカード（手札全て）
    timestamp: number;
  };
  multiplier: number;        // 現在の倍率（引きドボン・オープンドボン適用後）
  timeoutSeconds: number;    // 返し判定のタイムアウト秒数（10秒）
  pendingPlayerIds: string[]; // 返し判断待ちのプレイヤーID
}
```

---

### `game:return`

返しドボン発生通知。

```typescript
{
  sessionId: string;
  declaration: {
    playerId: string;
    playerName: string;
    formula: string;
    cards: Card[];
    timestamp: number;
  };
  multiplier: number;        // 返し倍率適用後の倍率
  pendingPlayerIds: string[]; // まだ返し判断をしていないプレイヤーID
}
```

---

### `game:penalty`

ペナルティ発生通知（無効ドボン・ルール違反ドボン）。

```typescript
{
  sessionId: string;
  playerId: string;
  playerName: string;
  reason: 'invalid-formula' | 'rule-violation';
  payment: {
    drawnCard: Card;         // 支払い計算に使ったカード
    amount: number;          // 支払い金額
    baseRate: number;
    multiplier: number;
    payees: Array<{          // 受け取るプレイヤー
      playerId: string;
      playerName: string;
    }>;
  };
}
```

---

### `game:burst`

バースト発生通知。

```typescript
{
  sessionId: string;
  playerId: string;
  playerName: string;
  handCount: number;         // バースト時の手札枚数（14）
  payment: {
    drawnCard: Card;
    amount: number;
    baseRate: number;
    multiplier: number;
    payees: Array<{
      playerId: string;
      playerName: string;
    }>;
  };
}
```

---

### `game:ended`

ゲーム終了通知。

```typescript
{
  sessionId: string;
  result: {
    gameId: string;
    winner: {
      playerId: string;
      playerName: string;
    };
    loser: {
      playerId: string;
      playerName: string;
    };
    payments: Array<{
      payer: { playerId: string; playerName: string; };
      payee: { playerId: string; playerName: string; };
      amount: number;
      reason: 'dobo' | 'burst' | 'invalid-formula' | 'rule-violation';
      drawnCard: Card;
    }>;
    multiplier: number;
    multiplierBreakdown: {
      initialACount: number;
      drawDoboCount: number;
      openDoboCount: number;
      returnDoboCount: number;
      reshuffleCount: number;
    };
    baseRate: number;
  };
  nextGameStartsIn?: number;  // 次のゲーム開始までの秒数（自動継続の場合）
}
```

---

### `game:error`

エラー通知（ゲーム状態の不整合など）。

```typescript
{
  sessionId: string;
  errorCode: string;
  message: string;           // ユーザー向けメッセージ
  // ゲームセッションは終了、全プレイヤーはルームに戻る
}
```

---

## REST API（補助的なエンドポイント）

WebSocket が主要通信手段だが、以下は REST API で提供する。

### `GET /api/game/session/:sessionId`

ゲームセッション情報を取得（再接続時に使用）。

```typescript
// レスポンス
{
  sessionId: string;
  gameState: GameStateForClient;
  yourPlayerId: string;
  yourHand: Card[];
}
```

### `GET /api/game/history/:userId`

ゲーム履歴を取得（Unit 4 で実装予定）。

```typescript
// レスポンス
{
  history: GameResult[];
}
```

---

## エラーコード一覧

| コード | 説明 |
|---|---|
| `INVALID_TURN` | 自分のターンでない |
| `INVALID_CARD` | 場札の条件を満たさないカード |
| `ALREADY_DRAWN` | 既に山札から引いている |
| `CANNOT_PLAY_DRAWN_CARD` | 引いたターンに引いたカードは出せない |
| `DOBO_PHASE_INACTIVE` | ドボン判定フェーズでない |
| `GAME_STATE_INCONSISTENT` | ゲーム状態の不整合 |
| `SESSION_NOT_FOUND` | セッションが見つからない |
