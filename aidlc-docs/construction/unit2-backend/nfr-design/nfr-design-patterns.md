# NFR Design Patterns - Unit 2 (Backend - Game Logic)

## 概要

Unit 2（バックエンド - ゲームロジック）の非機能要件を実現するためのデザインパターンを定義する。
POCレベルのシンプルな構成を優先し、Express.js + Socket.io + TypeScript で実装する。

---

## 1. レジリエンスパターン

### 1.1 クライアント再接続時のゲーム状態復元パターン

**パターン**: Socket.io `connect` イベントで自動送信（C: どちらでも良い → 自動送信を採用）

**実装方針**:
```typescript
// src/socket/GameSocketHandler.ts

io.on('connection', (socket: Socket) => {
  // 再接続時: クライアントが roomId を送信してくる
  socket.on('game:rejoin', ({ roomId, playerId }) => {
    const session = sessionMap.get(roomId);
    if (!session) {
      socket.emit('game:error', { errorCode: 'SESSION_NOT_FOUND' });
      return;
    }

    // Socket.io Room に再参加
    socket.join(roomId);

    // 現在の GameState を送信（自分の手札情報付き）
    const gameStateForClient = buildGameStateForClient(session, playerId);
    socket.emit('game:state-updated', {
      sessionId: session.sessionId,
      gameState: gameStateForClient,
    });

    logger.info('Player rejoined', { roomId, playerId });
  });
});
```

**特徴**:
- クライアントが `game:rejoin` イベントを送信して再参加
- サーバーは現在の GameState を即座に返す
- 自分の手札情報（非公開カード）も含めて送信
- セッションが存在しない場合は `game:error` を返す

---

### 1.2 サーバーエラー処理パターン

**パターン**: エラーログ出力 → 全プレイヤーに `game:error` 送信 → セッション終了（Q1.2: 回答A）

**実装方針**:
```typescript
// src/socket/GameSocketHandler.ts

const handleGameAction = async (
  socket: Socket,
  roomId: string,
  action: () => void
) => {
  try {
    action();
  } catch (error) {
    // エラーログ出力
    logger.error('Game action failed', {
      roomId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // 全プレイヤーに game:error を送信
    io.to(roomId).emit('game:error', {
      sessionId: sessionMap.get(roomId)?.sessionId,
      errorCode: 'GAME_STATE_INCONSISTENT',
      message: 'ゲームでエラーが発生しました。ルームに戻ります。',
    });

    // セッションをメモリから削除
    sessionMap.delete(roomId);
  }
};
```

**特徴**:
- try-catch でゲームアクション全体をラップ
- エラー発生時はスタックトレース付きでログ出力
- 全プレイヤーに `game:error` イベントを送信
- セッションをメモリから削除してクリーンアップ
- クライアントはルーム画面に戻る

---

### 1.3 タイムアウト管理パターン

**パターン**: `setTimeout` でセッションごとに管理

**実装方針**:
```typescript
// src/game/DoboDeclaration.ts

class DoboDeclaration {
  private timeoutId: NodeJS.Timeout | null = null;

  startReturnPhase(session: GameSession, io: Server): void {
    const { doboPhaseState } = session;
    doboPhaseState.isActive = true;
    doboPhaseState.timeoutAt = Date.now() + 10_000; // 10秒

    // タイムアウト監視
    this.timeoutId = setTimeout(() => {
      if (doboPhaseState.isActive) {
        logger.info('Return phase timed out', {
          sessionId: session.sessionId,
          pendingPlayerIds: doboPhaseState.pendingPlayerIds,
        });
        // pending プレイヤーを全員「返さない」として処理
        doboPhaseState.pendingPlayerIds = [];
        this.checkDoboPhaseEnd(session, io);
      }
    }, 10_000);
  }

  cleanup(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
```

**特徴**:
- セッションごとに独立した `setTimeout`
- セッション終了時に `clearTimeout` でクリーンアップ
- タイムアウト時は pending プレイヤーを「返さない」として処理

---

## 2. スケーラビリティパターン

### 2.1 ゲームセッション管理パターン

**パターン**: `Map<roomId, GameSession>` でシンプルに管理（C → シンプルな Map を採用）

**実装方針**:
```typescript
// src/index.ts または src/socket/GameSocketHandler.ts

// セッションマップ（メモリ管理）
const sessionMap = new Map<string, GameSession>();

// セッション作成
const createSession = (roomId: string, players: Player[], baseRate: number): GameSession => {
  const session: GameSession = {
    sessionId: `session-${Date.now()}`,
    roomId,
    gameState: initializeGameState(players),
    deckState: initializeDeckState(),
    turnState: initializeTurnState(players),
    multiplierState: initializeMultiplierState(),
    doboPhaseState: initializeDoboPhaseState(),
    createdAt: Date.now(),
    startedAt: null,
    endedAt: null,
  };
  sessionMap.set(roomId, session);
  return session;
};

// セッション削除
const deleteSession = (roomId: string): void => {
  sessionMap.delete(roomId);
  logger.info('Session deleted', { roomId });
};
```

**特徴**:
- `roomId` をキーにした `Map` でシンプルに管理
- ゲーム終了・エラー時にセッションを削除
- サーバー再起動でセッションは消える（POCレベルで許容）

---

### 2.2 Socket.io 接続管理パターン

**パターン**: Room + Map の組み合わせ（C: 両方を組み合わせる）

**実装方針**:
```typescript
// src/socket/GameSocketHandler.ts

// socketId → playerId のマッピング
const socketPlayerMap = new Map<string, { playerId: string; roomId: string }>();

io.on('connection', (socket: Socket) => {
  // ルーム参加時
  socket.on('room:join', ({ roomId, playerId }) => {
    // Socket.io Room に参加（ルーム全体へのブロードキャスト用）
    socket.join(roomId);

    // socketId → playerId のマッピングを記録（個別送信用）
    socketPlayerMap.set(socket.id, { playerId, roomId });

    logger.info('Player joined room', { roomId, playerId, socketId: socket.id });
  });

  // 切断時のクリーンアップ
  socket.on('disconnect', () => {
    const playerInfo = socketPlayerMap.get(socket.id);
    if (playerInfo) {
      logger.info('Player disconnected', playerInfo);
      socketPlayerMap.delete(socket.id);
    }
  });
});

// ルーム全体への送信（Socket.io Room 使用）
io.to(roomId).emit('game:state-updated', gameState);

// 特定プレイヤーへの送信（socketId 使用）
const targetSocketId = [...socketPlayerMap.entries()]
  .find(([, info]) => info.playerId === targetPlayerId)?.[0];
if (targetSocketId) {
  io.to(targetSocketId).emit('game:your-hand', { hand: playerHand });
}
```

**特徴**:
- **Socket.io Room**: ルーム全体へのブロードキャスト（`game:state-updated` 等）
- **socketPlayerMap**: 特定プレイヤーへの個別送信（手札情報等の非公開データ）
- 切断時に `socketPlayerMap` からエントリを削除

---

## 3. パフォーマンスパターン

### 3.1 ゲーム状態送信パターン

**パターン**: 全状態を毎回送信（Q3.1: 回答B）

**実装方針**:
```typescript
// src/socket/GameSocketHandler.ts

// クライアント向け GameState を構築（プレイヤーごとに異なる内容）
const buildGameStateForClient = (
  session: GameSession,
  targetPlayerId: string
): GameStateForClient => {
  const { gameState, turnState, multiplierState } = session;

  return {
    gameId: gameState.gameId,
    currentPlayer: {
      id: gameState.currentPlayer.id,
      user: gameState.currentPlayer.user,
    },
    fieldCard: gameState.fieldCard,
    players: gameState.players.map((player) => ({
      id: player.id,
      user: player.user,
      handCount: player.hand.length,
      // 自分の手札は全て送信、他プレイヤーは isPublic=true のカードのみ
      hand: player.id === targetPlayerId
        ? player.hand
        : player.hand.filter((card) => card.isPublic),
      isCurrentPlayer: player.id === gameState.currentPlayer.id,
    })),
    multiplier: multiplierState.totalMultiplier,
    gamePhase: gameState.gamePhase,
    lastPlayedPlayer: gameState.lastPlayedPlayer
      ? { id: gameState.lastPlayedPlayer.id, user: gameState.lastPlayedPlayer.user }
      : null,
    turnOrder: turnState.turnOrder,
    turnDirection: turnState.turnDirection,
  };
};

// 全プレイヤーに状態を送信（各プレイヤー向けにカスタマイズ）
const broadcastGameState = (session: GameSession, io: Server): void => {
  for (const [socketId, { playerId, roomId }] of socketPlayerMap.entries()) {
    if (roomId === session.roomId) {
      const gameStateForClient = buildGameStateForClient(session, playerId);
      io.to(socketId).emit('game:state-updated', {
        sessionId: session.sessionId,
        gameState: gameStateForClient,
      });
    }
  }
};
```

**特徴**:
- 毎回全状態を送信（差分計算なし、シンプル）
- プレイヤーごとに手札情報をカスタマイズ（自分の手札は全て、他は公開カードのみ）
- POCレベルでは十分なパフォーマンス

---

## 4. セキュリティパターン

### 4.1 CORS 設定パターン

**パターン**: 開発・本番ともに全オリジン許可（Q4.1: 回答C）

**実装方針**:
```typescript
// src/index.ts

import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';

const app = express();
const httpServer = createServer(app);

// Express CORS（REST API 用）
app.use(cors({
  origin: '*',  // 全オリジン許可（POCレベル）
  methods: ['GET', 'POST'],
}));

// Socket.io CORS
const io = new Server(httpServer, {
  cors: {
    origin: '*',  // 全オリジン許可（POCレベル）
    methods: ['GET', 'POST'],
  },
});
```

**特徴**:
- 開発・本番ともに全オリジン許可
- POCレベルのチームメイトのみ利用のため許容
- 本番化時は Vercel ドメインのみに制限する

---

## 5. ロギングパターン

### 5.1 クラスベースロガーパターン

**パターン**: クラスベースのロガー（ログレベル管理）（Q5.1: 回答B）

**実装方針**:
```typescript
// src/utils/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
  }

  debug(message: string, data?: unknown): void {
    console.log(this.formatMessage('debug', message, data));
  }

  info(message: string, data?: unknown): void {
    console.log(this.formatMessage('info', message, data));
  }

  warn(message: string, data?: unknown): void {
    console.warn(this.formatMessage('warn', message, data));
  }

  error(message: string, data?: unknown): void {
    console.error(this.formatMessage('error', message, data));
  }
}

export const logger = new Logger();
```

**ログ出力例**:
```
[2026-05-02T00:00:00.000Z] [INFO] Game started {"sessionId":"session-123","players":["p1","p2"]}
[2026-05-02T00:00:05.000Z] [INFO] Card played {"playerId":"p1","cards":[{"suit":"hearts","value":5}]}
[2026-05-02T00:00:10.000Z] [INFO] Dobo declared {"playerId":"p2","formula":"3+4+5"}
[2026-05-02T00:00:15.000Z] [ERROR] Game action failed {"roomId":"room-1","error":"Invalid state"}
```

**特徴**:
- ISO 8601 タイムスタンプ付き
- ログレベル（DEBUG/INFO/WARN/ERROR）で分類
- JSON 形式でデータを付加
- Heroku ダッシュボードで確認可能

---

## 6. デザインパターンサマリー

| 項目 | パターン | 理由 |
|---|---|---|
| 再接続時の状態復元 | `game:rejoin` イベントで自動送信 | シンプル、確実 |
| サーバーエラー処理 | ログ出力 + `game:error` + セッション終了 | 安全なフェイルファスト |
| タイムアウト管理 | `setTimeout` セッションごと | シンプル |
| セッション管理 | `Map<roomId, GameSession>` | シンプル |
| Socket.io 接続管理 | Room + socketPlayerMap | ブロードキャスト + 個別送信 |
| ゲーム状態送信 | 全状態を毎回送信 | シンプル、POCレベル |
| CORS | 全オリジン許可 | POCレベル |
| ロガー | クラスベース（ログレベル管理） | 可読性、Heroku 対応 |
