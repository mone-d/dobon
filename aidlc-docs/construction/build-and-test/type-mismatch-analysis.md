# 型定義不一致の横展開調査結果

## 調査日
2026-05-03

---

## 🔍 発見された型定義の不一致

### 1. GameStateForClient の不一致

#### バックエンド型定義 (backend/src/types/domain.ts)
```typescript
export interface PlayerForClient {
  id: string;
  user: User;
  handCount: number;
  hand: Card[];
  isCurrentPlayer: boolean;
}

export interface GameStateForClient {
  gameId: string;
  currentPlayer: { id: string; user: User };
  fieldCard: Card;
  players: PlayerForClient[];
  multiplier: number;
  gamePhase: GamePhase;
  lastPlayedPlayer: { id: string; user: User } | null;
  turnOrder: string[];
  turnDirection: TurnDirection;
}
```

#### バックエンド実装 (GameSocketHandler.buildGameStateForClient)
```typescript
return {
  gameId: session.gameState.gameId,
  currentPlayer: session.gameState.currentPlayer, // ❌ 完全なPlayerオブジェクト
  fieldCard: session.deckState.fieldCard,
  players: session.gameState.players.map((p) => ({
    id: p.id,
    name: p.user.userName, // ✅ 簡略化
    handCount: p.hand.length,
    hand: p.id === playerId ? p.hand : undefined, // ✅ Optional
  })),
  multiplier: session.multiplierState.totalMultiplier,
  gamePhase: session.gameState.gamePhase,
  deckRemaining: session.deckState.deck.length, // ✅ 追加フィールド
};
```

#### フロントエンド型定義 (frontend/src/types/domain.ts)
```typescript
export interface PlayerForClient {
  id: string;
  name: string; // ✅ 修正済み
  handCount: number;
  hand?: Card[]; // ✅ 修正済み
  isCurrentPlayer?: boolean; // ✅ 修正済み
}

export interface GameStateForClient {
  gameId: string;
  currentPlayer: { id: string; user: User } | { id: string; name: string }; // ⚠️ Union型
  fieldCard: Card;
  players: PlayerForClient[];
  multiplier: number;
  gamePhase: GamePhase;
  lastPlayedPlayer?: { id: string; user: User } | { id: string; name: string } | null; // ⚠️ Union型
  turnOrder?: string[]; // ✅ Optional
  turnDirection?: TurnDirection; // ✅ Optional
  deckRemaining?: number; // ✅ 追加
}
```

**問題点**:
- `currentPlayer`が完全なPlayerオブジェクトで返される（簡略化されていない）
- `lastPlayedPlayer`も完全なPlayerオブジェクトで返される可能性がある

---

### 2. game:started イベントの不一致

#### バックエンド実装
```typescript
this.broadcastToRoom(roomId, 'game:started', {
  gameId: session.gameState.gameId,
  players: session.gameState.players, // ❌ 完全なPlayerオブジェクト配列
  fieldCard: session.deckState.fieldCard,
  multiplier: session.multiplierState.totalMultiplier,
  currentPlayer: session.gameState.currentPlayer, // ❌ 完全なPlayerオブジェクト
});
```

#### フロントエンド実装
```typescript
socket.on('game:started', (data: any) => {
  console.log('Game started:', data);
  // ⚠️ データを使用していない（ログのみ）
});
```

**問題点**:
- `game:started`で送信されるデータ構造が`GameStateForClient`と異なる
- フロントエンドで受信したデータを使用していない

---

### 3. game:card-played イベントの不一致

#### バックエンド実装
```typescript
this.broadcastToRoom(roomId, 'game:card-played', {
  playerId,
  cards,
  fieldCard: session.deckState.fieldCard,
  currentPlayer: session.gameState.currentPlayer, // ❌ 完全なPlayerオブジェクト
});
```

**問題点**:
- `currentPlayer`が完全なPlayerオブジェクト

---

### 4. game:dobo イベントの不一致

#### バックエンド実装
```typescript
this.broadcastToRoom(roomId, 'game:dobo', {
  playerId: doboData.playerId,
  formula: doboData.formula,
  cardsUsed: doboData.cards.length,
  timeoutSeconds: 10,
});
```

**問題点**:
- 型定義なし（anyで受信）

---

### 5. game:ended イベントの不一致

#### バックエンド実装
```typescript
this.broadcastToRoom(roomId, 'game:ended', {
  winner,
  multiplier,
});
```

**問題点**:
- `winner`の型が不明（おそらくstring）
- 型定義なし

---

## 🔧 修正が必要な箇所

### 優先度: 高

1. **GameSocketHandler.ts - game:started イベント**
   - `players`を簡略化形式に変換
   - `currentPlayer`を簡略化形式に変換

2. **GameSocketHandler.ts - buildGameStateForClient**
   - `currentPlayer`を簡略化形式に変換
   - `lastPlayedPlayer`を簡略化形式に変換

3. **GameSocketHandler.ts - game:card-played イベント**
   - `currentPlayer`を簡略化形式に変換

### 優先度: 中

4. **backend/src/types/domain.ts**
   - `PlayerForClient`の型定義を実装に合わせる
   - `GameStateForClient`の型定義を実装に合わせる

5. **イベントペイロードの型定義**
   - `game:started`のペイロード型
   - `game:card-played`のペイロード型
   - `game:dobo`のペイロード型
   - `game:ended`のペイロード型

### 優先度: 低

6. **フロントエンド - イベントハンドラー**
   - `game:started`イベントのデータ活用
   - `game:card-played`イベントのデータ活用
   - `game:dobo`イベントのデータ活用
   - `game:ended`イベントのデータ活用

---

## 📋 推奨される修正アプローチ

### アプローチ1: バックエンドを修正（推奨）

**メリット**:
- 型定義と実装の一貫性が保たれる
- フロントエンドの変更が最小限
- パフォーマンス向上（不要なデータを送信しない）

**デメリット**:
- バックエンドの修正箇所が多い

**修正内容**:
1. `buildGameStateForClient`で`currentPlayer`と`lastPlayedPlayer`を簡略化
2. `game:started`イベントで送信するデータを簡略化
3. `game:card-played`イベントで送信するデータを簡略化
4. バックエンドの型定義を実装に合わせる

### アプローチ2: フロントエンドを修正

**メリット**:
- バックエンドの変更が不要

**デメリット**:
- 不要なデータを受信し続ける
- 型定義が複雑になる（Union型が増える）
- パフォーマンスが悪化

**修正内容**:
1. フロントエンドの型定義をバックエンドの実装に合わせる
2. 全てのイベントハンドラーでUnion型を処理

---

## ✅ 推奨: アプローチ1（バックエンド修正）

バックエンドを修正して、全てのイベントで簡略化されたデータ構造を送信するようにします。

### 修正ファイル
1. `backend/src/socket/GameSocketHandler.ts`
2. `backend/src/types/domain.ts`

### 修正内容
- `buildGameStateForClient`を修正
- `game:started`イベントを修正
- `game:card-played`イベントを修正
- 型定義を実装に合わせる

---

## 🎯 次のステップ

1. バックエンドの`GameSocketHandler.ts`を修正
2. バックエンドの型定義を更新
3. フロントエンドの型定義を最終調整
4. 統合テストを実施

