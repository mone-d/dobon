# 成績記録機能 - 機能設計

## 1. 概要

ゲーム結果を永続化し、プレイヤー統計情報とルーム内収支を表示する機能。

## 2. データモデル

### 2.1 ゲーム結果レコード (GameRecord)

```typescript
interface GameRecord {
  gameId: string;
  roomId: string;
  timestamp: string;          // ISO 8601
  players: string[];          // 参加プレイヤーID
  playerNames: Record<string, string>; // ID→名前マッピング
  winnerId: string;
  loserId: string;
  endReason: 'dobon' | 'return_dobon' | 'burst' | 'penalty';
  multiplier: number;
  baseRate: number;
  payments: {
    payerId: string;
    payeeId: string;
    amount: number;
  }[];
}
```

### 2.2 プレイヤー統計 (PlayerStats)

```typescript
interface PlayerStats {
  playerId: string;
  playerName: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;            // wins / totalGames
  totalEarned: number;        // 総獲得金額
  totalPaid: number;          // 総支払金額
  netBalance: number;         // 収支 (earned - paid)
  maxMultiplier: number;      // 最高倍率
}
```

### 2.3 ルーム内収支 (RoomBalance)

```typescript
interface RoomBalanceEntry {
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  totalAmount: number;        // 累計支払額
}
```

## 3. バックエンド設計

### 3.1 GameHistoryStore

JSONファイルベースの永続化。`data/game-history.json`に保存。

```typescript
class GameHistoryStore {
  private filePath = 'data/game-history.json';
  
  saveRecord(record: GameRecord): void;
  getAllRecords(): GameRecord[];
  getRecordsByPlayer(playerId: string): GameRecord[];
  getRecordsByRoom(roomId: string): GameRecord[];
}
```

### 3.2 StatsCalculator

保存済みレコードから統計を計算。

```typescript
class StatsCalculator {
  getPlayerStats(playerId: string): PlayerStats;
  getRoomBalance(roomId: string): RoomBalanceEntry[];
  getRanking(): PlayerStats[];
}
```

### 3.3 WebSocketイベント

| イベント | 方向 | データ |
|---------|------|--------|
| `stats:get-player` | Client→Server | `{ playerId }` |
| `stats:player` | Server→Client | `PlayerStats` |
| `stats:get-room-balance` | Client→Server | `{ roomId }` |
| `stats:room-balance` | Server→Client | `RoomBalanceEntry[]` |

### 3.4 ゲーム終了時の保存フロー

```
game:ended 送信時
  ↓
GameHistoryStore.saveRecord(record)
  ↓
ファイルに追記
```

## 4. フロントエンド設計

### 4.1 統計表示のUI

- **相手プレイヤーをタップ** → そのプレイヤーの統計情報をモーダル表示
- **ルーム収支ボタン**（ヘッダーまたはルーム画面） → ルーム内全員の収支テーブル表示

### 4.2 プレイヤー統計モーダル

```
┌─────────────────────────┐
│  📊 まなみ の成績        │
├─────────────────────────┤
│  総ゲーム数: 15          │
│  勝利: 8  敗北: 4        │
│  勝率: 53.3%             │
│                          │
│  総獲得: ¥12,400         │
│  総支払: ¥8,200          │
│  収支: +¥4,200           │
│                          │
│  最高倍率: ×8            │
└─────────────────────────┘
```

### 4.3 ルーム収支テーブル

```
┌──────────────────────────────┐
│  💰 ルーム収支               │
├──────────────────────────────┤
│  まなみ → phone: ¥3,200     │
│  phone → まなみ: ¥1,800     │
│                              │
│  差引: まなみ +¥1,400       │
└──────────────────────────────┘
```

### 4.4 コンポーネント

- `PlayerStatsModal` - プレイヤー統計モーダル
- `RoomBalanceModal` - ルーム収支モーダル
- `OpponentPlayer`にタップイベント追加（統計表示トリガー）

## 5. ファイル構成

```
backend/
  src/
    stats/
      GameHistoryStore.ts
      StatsCalculator.ts
  data/
    game-history.json

frontend/
  src/
    components/
      PlayerStatsModal.tsx
      RoomBalanceModal.tsx
```
