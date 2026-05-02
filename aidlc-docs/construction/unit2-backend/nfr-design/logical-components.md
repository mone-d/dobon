# Logical Components - Unit 2 (Backend - Game Logic)

## 概要

Unit 2（バックエンド - ゲームロジック）の論理コンポーネントを定義する。
Express.js + Socket.io + TypeScript で構成するシンプルなバックエンド。

---

## 1. エントリーポイント

### 1.1 HTTP サーバー + Socket.io サーバー

**責務**: Express アプリと Socket.io の初期化・起動

**実装位置**: `backend/src/index.ts`

**機能**:
- Express アプリの初期化
- HTTP サーバーの作成
- Socket.io サーバーの初期化
- CORS 設定（全オリジン許可）
- ポート設定（`process.env.PORT` または 3000）
- Socket.io イベントハンドラーの登録

**実装概要**:
```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupGameSocketHandler } from './socket/GameSocketHandler';
import { logger } from './utils/logger';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors({ origin: '*' }));
app.use(express.json());

// REST API ルート（再接続用）
app.get('/api/game/session/:sessionId', getGameSessionHandler);

// Socket.io イベントハンドラー登録
setupGameSocketHandler(io);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
});
```

---

## 2. Socket.io イベントハンドラー層

### 2.1 GameSocketHandler

**責務**: 全 Socket.io イベントの受信・処理・送信

**実装位置**: `backend/src/socket/GameSocketHandler.ts`

**管理するデータ**:
```typescript
// セッションマップ（メモリ管理）
const sessionMap = new Map<string, GameSession>();

// socketId → プレイヤー情報のマッピング
const socketPlayerMap = new Map<string, { playerId: string; roomId: string }>();
```

**受信イベント一覧**:

| イベント | 処理 |
|---|---|
| `connection` | 接続ログ出力 |
| `disconnect` | socketPlayerMap からエントリ削除、ログ出力 |
| `room:join` | Socket.io Room 参加、socketPlayerMap 登録 |
| `game:start` | GameEngine.startGame() 呼び出し、セッション作成 |
| `game:play-card` | GameEngine.playCard() 呼び出し |
| `game:draw-card` | GameEngine.drawCard() 呼び出し |
| `game:select-suit` | EightCardHandler のスート指定処理 |
| `game:declare-dobo` | DoboDeclaration.declareDobo() 呼び出し |
| `game:declare-return` | DoboDeclaration.declareReturn() 呼び出し |
| `game:declare-no-return` | DoboDeclaration.declareNoReturn() 呼び出し |
| `game:leave-next` | leaveNextPlayerIds に追加 |
| `game:rejoin` | 再接続時の GameState 送信 |

**送信イベント一覧**:

| イベント | 送信先 | 内容 |
|---|---|---|
| `game:started` | ルーム全員 | ゲーム開始通知 |
| `game:state-updated` | 各プレイヤー個別 | 更新された GameState（手札情報付き） |
| `game:card-played` | ルーム全員 | カードが出された通知 |
| `game:card-drawn` | ルーム全員 | カードが引かれた通知（枚数のみ） |
| `game:suit-selected` | ルーム全員 | スート指定通知 |
| `game:dobo` | ルーム全員 | ドボン宣言通知 |
| `game:return` | ルーム全員 | 返しドボン発生通知 |
| `game:penalty` | ルーム全員 | ペナルティ発生通知 |
| `game:burst` | ルーム全員 | バースト発生通知 |
| `game:ended` | ルーム全員 | ゲーム終了通知 |
| `game:error` | ルーム全員 | エラー通知 |

**ヘルパー関数**:
```typescript
// プレイヤーごとにカスタマイズした GameState を構築
buildGameStateForClient(session, targetPlayerId): GameStateForClient

// 全プレイヤーに GameState をブロードキャスト
broadcastGameState(session, io): void

// エラーハンドリングラッパー
handleGameAction(socket, roomId, action): Promise<void>
```

---

## 3. ゲームロジック層

### 3.1 GameEngine

**責務**: ゲーム状態管理、ターン管理、カード操作

**実装位置**: `backend/src/game/GameEngine.ts`

**主要メソッド**:
```typescript
class GameEngine {
  startGame(players: Player[], baseRate: number, session: GameSession): void
  playCard(playerId: string, cards: Card[], session: GameSession): boolean
  drawCard(playerId: string, session: GameSession): Card | false
  selectSuit(playerId: string, suit: Suit, session: GameSession): boolean
  finalizeGame(winnerId: string, session: GameSession): GameResult
  getNextPlayerIndex(turnState: TurnState, activePlayers: Player[]): number
  endTurn(session: GameSession): void
}
```

---

### 3.2 DoboDeclaration

**責務**: ドボン宣言処理、演算式自動計算、返し判定フェーズ管理

**実装位置**: `backend/src/game/DoboDeclaration.ts`

**主要メソッド**:
```typescript
class DoboDeclaration {
  declareDobo(playerId: string, lastPlayedPlayerId: string, session: GameSession, io: Server): boolean
  declareReturn(playerId: string, lastPlayedPlayerId: string, session: GameSession, io: Server): boolean
  declareNoReturn(playerId: string, session: GameSession): void
  validateDoboFormula(hand: Card[], targetValue: number): string | null
  checkDoboPhaseEnd(session: GameSession, io: Server): void
  determineWinner(session: GameSession): string
  startReturnPhase(session: GameSession, io: Server): void
  cleanup(): void  // タイムアウトのクリーンアップ
}
```

---

### 3.3 MultiplierCalculator

**責務**: 倍率計算

**実装位置**: `backend/src/game/MultiplierCalculator.ts`

**主要メソッド**:
```typescript
class MultiplierCalculator {
  calculateTotalMultiplier(state: MultiplierState): number
  addInitialA(state: MultiplierState): MultiplierState
  addDrawDobo(state: MultiplierState): MultiplierState
  addOpenDobo(state: MultiplierState): MultiplierState
  addReturnDobo(state: MultiplierState): MultiplierState
  addReshuffle(state: MultiplierState): MultiplierState
  isDrawDobo(playerId: string, turnState: TurnState): boolean
  isOpenDobo(playerId: string, players: Player[]): boolean
}
```

---

### 3.4 DeckManager

**責務**: 山札管理、カード配布、初期場札決定

**実装位置**: `backend/src/game/DeckManager.ts`

**主要メソッド**:
```typescript
class DeckManager {
  initializeDeck(): Card[]
  dealCards(players: Player[], cardsPerPlayer: number, deckState: DeckState): void
  determineInitialCard(deckState: DeckState, multiplierState: MultiplierState): Card
  drawCard(deckState: DeckState): Card
  reshuffleDeck(deckState: DeckState): void
}
```

---

### 3.5 CardValidator

**責務**: カード操作ルール検証

**実装位置**: `backend/src/game/CardValidator.ts`

**主要メソッド**:
```typescript
class CardValidator {
  validatePlayableCards(cards: Card[], fieldCard: Card): CardValidationResult
  canPlayDrawnCard(card: Card, turnState: TurnState): boolean
}
```

---

### 3.6 PaymentCalculator

**責務**: 支払い金額計算

**実装位置**: `backend/src/game/PaymentCalculator.ts`

**主要メソッド**:
```typescript
class PaymentCalculator {
  calculateDoboPayment(baseRate: number, multiplierState: MultiplierState, deckState: DeckState, lastPlayedPlayer: Player): Payment
  calculateBurstPayment(baseRate: number, multiplierState: MultiplierState, deckState: DeckState, burstPlayer: Player, allPlayers: Player[]): Payment[]
  calculatePenaltyPayment(baseRate: number, multiplierState: MultiplierState, deckState: DeckState, penaltyPlayer: Player, allPlayers: Player[]): Payment[]
}
```

---

### 3.7 特殊カードハンドラー

**責務**: 各特殊カードの効果処理

**実装位置**: `backend/src/game/handlers/`

```typescript
// インターフェース
interface SpecialCardHandler {
  handle(session: GameSession): void;
}

// 各ハンドラー
ACardHandler      // backend/src/game/handlers/ACardHandler.ts
TwoCardHandler    // backend/src/game/handlers/TwoCardHandler.ts
EightCardHandler  // backend/src/game/handlers/EightCardHandler.ts
JCardHandler      // backend/src/game/handlers/JCardHandler.ts
KCardHandler      // backend/src/game/handlers/KCardHandler.ts
```

---

## 4. ユーティリティ層

### 4.1 Logger

**責務**: ログ出力（クラスベース、ログレベル管理）

**実装位置**: `backend/src/utils/logger.ts`

**インターフェース**:
```typescript
class Logger {
  debug(message: string, data?: unknown): void
  info(message: string, data?: unknown): void
  warn(message: string, data?: unknown): void
  error(message: string, data?: unknown): void
}

export const logger = new Logger();
```

**ログ形式**: `[ISO timestamp] [LEVEL] message {data}`

---

## 5. テスト層

### 5.1 テストファクトリー

**責務**: テストデータ生成（ファクトリーパターン）

**実装位置**: `backend/tests/factories/`

```typescript
CardFactory       // tests/factories/CardFactory.ts
PlayerFactory     // tests/factories/PlayerFactory.ts
GameStateFactory  // tests/factories/GameStateFactory.ts
DeckStateFactory  // tests/factories/DeckStateFactory.ts
```

### 5.2 ユニットテスト

**実装位置**: `backend/tests/game/`

```
tests/game/
├── DoboDeclaration.test.ts   // 演算式計算、勝者決定
├── MultiplierCalculator.test.ts  // 倍率計算全パターン
├── CardValidator.test.ts     // カード操作ルール
├── PaymentCalculator.test.ts // 支払い計算
└── DeckManager.test.ts       // デッキ初期化、再生成
```

---

## 6. 論理コンポーネント依存関係図

```
┌─────────────────────────────────────────────────────────┐
│                  GameSocketHandler                       │
│  (Socket.io イベント受信・送信、sessionMap 管理)          │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌───▼──────────────┐
│  GameEngine  │ │DoboDeclaration│ │MultiplierCalculator│
│  (ターン管理) │ │(ドボン判定)  │ │(倍率計算)         │
└───────┬──────┘ └─────┬──────┘ └───────────────────┘
        │              │
        ├──────────────┤
        │              │
┌───────▼──────┐ ┌─────▼──────────┐
│  DeckManager │ │ CardValidator  │
│  (山札管理)  │ │ (カード検証)   │
└──────────────┘ └────────────────┘
        │
┌───────▼──────────┐
│ PaymentCalculator│
│ (支払い計算)     │
└──────────────────┘

共通:
┌──────────────────────────────────────────────────────────┐
│  Logger (全コンポーネントから使用)                        │
└──────────────────────────────────────────────────────────┘
```

---

## 7. プロジェクト構造

```
backend/
├── src/
│   ├── index.ts                    # エントリーポイント
│   ├── types/
│   │   └── domain.ts               # ドメインエンティティ（Unit 1 と共通）
│   ├── game/
│   │   ├── GameEngine.ts
│   │   ├── DoboDeclaration.ts
│   │   ├── MultiplierCalculator.ts
│   │   ├── DeckManager.ts
│   │   ├── CardValidator.ts
│   │   ├── PaymentCalculator.ts
│   │   └── handlers/
│   │       ├── ACardHandler.ts
│   │       ├── TwoCardHandler.ts
│   │       ├── EightCardHandler.ts
│   │       ├── JCardHandler.ts
│   │       └── KCardHandler.ts
│   ├── socket/
│   │   └── GameSocketHandler.ts    # 全 Socket.io イベント
│   └── utils/
│       └── logger.ts               # クラスベースロガー
├── tests/
│   ├── game/
│   │   ├── DoboDeclaration.test.ts
│   │   ├── MultiplierCalculator.test.ts
│   │   ├── CardValidator.test.ts
│   │   ├── PaymentCalculator.test.ts
│   │   └── DeckManager.test.ts
│   └── factories/
│       ├── CardFactory.ts
│       ├── PlayerFactory.ts
│       ├── GameStateFactory.ts
│       └── DeckStateFactory.ts
├── package.json
├── tsconfig.json
├── jest.config.js
├── Procfile                        # web: node dist/index.js
├── .env.development
└── README.md
```

---

## 8. 論理コンポーネント実装チェックリスト

### エントリーポイント
- [ ] `src/index.ts`（Express + Socket.io 初期化）

### Socket.io 層
- [ ] `src/socket/GameSocketHandler.ts`（全イベントハンドラー）

### ゲームロジック層
- [ ] `src/game/GameEngine.ts`
- [ ] `src/game/DoboDeclaration.ts`
- [ ] `src/game/MultiplierCalculator.ts`
- [ ] `src/game/DeckManager.ts`
- [ ] `src/game/CardValidator.ts`
- [ ] `src/game/PaymentCalculator.ts`
- [ ] `src/game/handlers/ACardHandler.ts`
- [ ] `src/game/handlers/TwoCardHandler.ts`
- [ ] `src/game/handlers/EightCardHandler.ts`
- [ ] `src/game/handlers/JCardHandler.ts`
- [ ] `src/game/handlers/KCardHandler.ts`

### ユーティリティ層
- [ ] `src/utils/logger.ts`

### テスト層
- [ ] `tests/factories/` （4ファクトリー）
- [ ] `tests/game/` （5テストファイル）
