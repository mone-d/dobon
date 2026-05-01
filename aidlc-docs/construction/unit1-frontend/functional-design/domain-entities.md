# Domain Entities - Unit 1 (Frontend)

## ドメインエンティティ定義

### 1. User（ユーザー）

```typescript
interface User {
  userId: string;           // ゲストID
  userName: string;         // ユーザー名
  avatar: string;          // アバター画像URL
  bio: string;             // 自己紹介
}
```

**説明**:
- ゲストユーザーを表現
- ローカルストレージに保存可能
- プロフィール編集可能

---

### 2. Card（カード）

```typescript
interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';  // スート
  value: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;  // 数字（A=1, J=11, Q=12, K=13）
  isPublic: boolean;  // このカードが公開されているか（K効果で公開されたカードのみ true）
}
```

**説明**:
- トランプカードを表現
- スートと数字で一意に識別
- isPublic: K（13）が出た時に持っていた手札のカードのみ true
- その後に引いたカードは isPublic = false
- 手札の公開状態は各カードの isPublic 属性で個別に管理される

---

### 3. Player（プレイヤー）

```typescript
interface Player {
  id: string;              // プレイヤーID
  user: User;              // ユーザー情報
  hand: Card[];            // 手札
  handCount: number;       // 手札枚数（表示用）
  isCurrentPlayer: boolean; // 現在のターンか
}
```

**説明**:
- ゲーム中のプレイヤーを表現
- 手札情報を保持
- ターン情報を保持
- 手札の公開状態は各Card の isPublic 属性で管理（Player レベルではなくカードレベルで管理）

---

### 4. GameState（ゲーム状態）

```typescript
interface GameState {
  gameId: string;                                    // ゲームID
  currentPlayer: Player;                             // 現在のプレイヤー
  fieldCard: Card;                                   // 場札
  players: Player[];                                 // プレイヤー一覧
  multiplier: number;                               // 倍率
  gamePhase: 'playing' | 'dobo-declaration' | 'return-dobo' | 'payment' | 'ended';  // ゲームフェーズ
  doboDeclarations: DoboDeclaration[];              // ドボン宣言一覧
  returnDoboDeclarations: ReturnDoboDeclaration[];  // 返しドボン宣言一覧
  lastPlayedPlayer: Player | null;                  // 最後にカードを出したプレイヤー
  turnOrder: Player[];                              // ターン順序
  turnDirection: 'forward' | 'reverse';             // ターン方向
}
```

**説明**:
- ゲーム全体の状態を表現
- 複数のフェーズを管理
- ドボン宣言と返しドボン宣言を管理

---

### 5. DoboDeclaration（ドボン宣言）

```typescript
interface DoboDeclaration {
  playerId: string;        // プレイヤーID
  formula: string;         // 演算式（例: "3+4+5"）
  cards: Card[];          // 使用したカード
  timestamp: number;      // 宣言時刻
  isValid: boolean;       // 有効か
}
```

**説明**:
- ドボン宣言を表現
- 演算式と使用カードを記録
- 有効性を判定

---

### 6. ReturnDoboDeclaration（返しドボン宣言）

```typescript
interface ReturnDoboDeclaration {
  playerId: string;        // プレイヤーID
  formula: string;         // 演算式
  cards: Card[];          // 使用したカード
  timestamp: number;      // 宣言時刻
  isValid: boolean;       // 有効か
}
```

**説明**:
- 返しドボン宣言を表現
- ドボン宣言と同じ構造

---

### 7. Room（ルーム）

```typescript
interface Room {
  roomId: string;          // ルームID
  roomCode: string;        // ルームコード（表示用）
  creator: User;           // ルーム作成者
  players: User[];         // プレイヤー一覧
  baseRate: number;        // 基本レート（掛け金）
  status: 'waiting' | 'playing' | 'ended';  // ルームステータス
  createdAt: Date;         // 作成日時
}
```

**説明**:
- ゲームルームを表現
- プレイヤー管理
- ゲーム設定を保持

---

### 8. GameResult（ゲーム結果）

```typescript
interface GameResult {
  gameId: string;          // ゲームID
  date: Date;              // ゲーム日時
  players: User[];         // 参加プレイヤー
  winner: User;            // 勝者（ドボン宣言者）
  loser: User;             // 敗者（支払い者）
  payments: Payment[];     // 支払い情報（複数の支払い者がいる場合）
  multiplier: number;      // 倍率
  baseRate: number;        // 基本レート
}

interface Payment {
  payer: User;             // 支払い者
  amount: number;          // 支払い金額
  reason: 'dobo' | 'burst' | 'invalid-formula';  // 支払い理由
}
```

**説明**:
- ゲーム結果を表現
- 統計情報の計算に使用
- 複数の支払い者がいる場合に対応
  - ドボン時: 場札を出したプレイヤーが支払い
  - バースト時: 敗者が全員に支払い
  - 演算式エラー時: 敗者が全員に支払い
  - ルール違反ドボン時: 敗者が全員に支払い（バースト時と同じ支払いロジック）

---

### 9. Statistics（統計情報）

```typescript
interface Statistics {
  userId: string;          // ユーザーID
  totalGames: number;      // 総ゲーム数
  wins: number;            // 勝利数
  losses: number;          // 敗北数
  winRate: number;         // 勝率（%）
  totalEarnings: number;   // 総獲得金額
  totalPayments: number;   // 総支払金額
  averageEarnings: number; // 平均獲得金額
  maxMultiplier: number;   // 最高倍率
}
```

**説明**:
- ユーザーの統計情報を表現
- ゲーム履歴から計算

---

### 10. Ranking（ランキング）

```typescript
interface Ranking {
  rank: number;            // ランキング順位
  user: User;              // ユーザー
  totalEarnings: number;   // 総獲得金額
}
```

**説明**:
- ランキング情報を表現
- 総獲得金額でソート

---

## エンティティ間の関係

### 関係図

```
User
  ├─ 1対多 ─→ Room (ルームに参加)
  ├─ 1対多 ─→ Player (ゲームに参加)
  └─ 1対多 ─→ GameResult (ゲーム結果)

Room
  ├─ 1対多 ─→ User (プレイヤー)
  └─ 1対1 ─→ GameState (ゲーム進行中)

GameState
  ├─ 1対多 ─→ Player (プレイヤー)
  ├─ 1対多 ─→ DoboDeclaration (ドボン宣言)
  └─ 1対多 ─→ ReturnDoboDeclaration (返しドボン宣言)

Player
  └─ 多対1 ─→ User (ユーザー情報)

GameResult
  ├─ 多対1 ─→ User (勝者)
  └─ 多対多 ─→ User (参加プレイヤー)

Statistics
  └─ 1対1 ─→ User (ユーザー)

Ranking
  └─ 多対1 ─→ User (ユーザー)
```

---

## エンティティのライフサイクル

### User のライフサイクル

1. **作成**: ゲストログイン時に新規作成または既存IDで再利用
2. **更新**: プロフィール編集時に更新
3. **保存**: ローカルストレージに保存
4. **削除**: ブラウザのキャッシュクリア時に削除

### GameState のライフサイクル

1. **作成**: ゲーム開始時に作成
2. **更新**: ターン進行、カード操作、ドボン宣言時に更新
3. **終了**: ゲーム結果確定時に終了
4. **保存**: GameResult として保存

### Room のライフサイクル

1. **作成**: ルーム作成時に作成
2. **更新**: プレイヤー参加・退出時に更新
3. **ゲーム開始**: ゲーム開始時にステータスを 'playing' に変更
4. **ゲーム終了**: ゲーム終了後、次のゲームを開始するか、ルームに戻るかを判定
5. **削除**: 全プレイヤーが退出時に削除

---

## エンティティの永続化

### ローカルストレージに保存

- **User**: ゲストID、ユーザー名、アバター、自己紹介
- **GameResult**: ゲーム履歴（複数件）
- **Statistics**: 統計情報

### メモリに保存

- **GameState**: ゲーム進行中のみ
- **Room**: ルーム参加中のみ
- **Player**: ゲーム進行中のみ

---

## エンティティの検証ルール

### User

- ユーザー名: 1-20文字
- アバター: 有効なURL
- 自己紹介: 0-100文字

### Card

- スート: 'hearts', 'diamonds', 'clubs', 'spades' のいずれか
- 数字: 1-13 のいずれか

### GameState

- currentPlayer: players に含まれるプレイヤー
- fieldCard: 有効なカード
- multiplier: 正の整数
- gamePhase: 有効なフェーズ

### Room

- baseRate: 正の整数
- players: 2-8人
- status: 有効なステータス

### GameResult

- payment: 正の整数
- multiplier: 正の整数
- drawnCard: 有効なカード

