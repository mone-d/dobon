# Domain Entities - Unit 2 (Backend - Game Logic)

## 概要

Unit 1 のフロントエンドエンティティをベースに、バックエンド専用エンティティを追加定義する。
ゲーム進行中はメモリのみで管理し、ゲーム終了後は削除する（永続化なし）。

---

## フロントエンドと共通のエンティティ（再利用）

以下は `unit1-frontend/functional-design/domain-entities.md` で定義済みのエンティティをバックエンドでも使用する。

- `User`
- `Card`
- `Player`
- `GameState`
- `DoboDeclaration`
- `ReturnDoboDeclaration`
- `Room`
- `GameResult`
- `Payment`
- `Statistics`
- `Ranking`

---

## バックエンド専用エンティティ

### 1. DeckState（山札状態）

```typescript
interface DeckState {
  drawPile: Card[];       // 山札（引けるカードの山）
  discardPile: Card[];    // 捨て札（場に出されたカードの履歴）
  fieldCard: Card;        // 現在の場札（最後に出されたカード）
  reshuffleCount: number; // 山札再生成回数（倍率計算に使用）
}
```

**説明**:
- ゲーム中の山札・捨て札・場札を一元管理
- `reshuffleCount` は倍率計算の `×2 per reshuffle` に使用
- 山札が空になった時、`discardPile` から `fieldCard` を除いた全カードをシャッフルして `drawPile` に戻す
- ゲーム終了後はメモリから削除

---

### 2. TurnState（ターン状態）

```typescript
interface TurnState {
  currentPlayerIndex: number;       // 現在のプレイヤーのインデックス（turnOrder 配列の添字）
  turnOrder: string[];               // プレイヤーIDの順序配列
  turnDirection: 'forward' | 'reverse'; // ターン方向（J効果でリバース）
  hasDrawnThisTurn: boolean;         // 今ターンに山札から引いたか
  drawnCardThisTurn: Card | null;    // 今ターンに引いたカード（引いたターンは出せない）
  skippedPlayerIds: string[];        // このターンにスキップされるプレイヤーID（A効果）
  forcedDrawCount: number;           // 強制ドロー累積枚数（2効果スタッキング対応）
  openHandPlayerIds: string[];       // 手札公開中のプレイヤーID（K効果）
  // ※ openHandExpiresAtTurnEnd は削除: カードが場に出されるまでオープン継続のため
}
```

**説明**:
- ターン進行に必要な状態を管理
- `currentPlayerIndex` は `turnOrder` 配列のインデックス
- `turnDirection` が `'reverse'` の場合、インデックスを逆方向に進める
- `hasDrawnThisTurn` が `true` の場合、山札から引くボタンを無効化
- `drawnCardThisTurn` は引いたターンに出せないカードを追跡
- `forcedDrawCount`: 2効果のスタッキング対応。被害者が2を出すたびに加算。最終的に2を出せないプレイヤーが全枚数を引く
- K効果: `openHandPlayerIds` に追加。公開されたカードは場に出されるまで `isPublic = true` を維持（ターン終了でクローズしない）

---

### 3. MultiplierState（倍率状態）

```typescript
interface MultiplierState {
  initialACount: number;    // 初期A連続回数（ゲーム開始時のA連続）
  drawDoboCount: number;    // 引きドボン回数（山札から引いてドボン成立）
  openDoboCount: number;    // オープンドボン回数（K公開状態でドボン）
  returnDoboCount: number;  // 返しドボン回数（返しが発生した回数）
  reshuffleCount: number;   // 山札再生成回数
  totalMultiplier: number;  // 現在の合計倍率（2^n）
}
```

**説明**:
- 各倍率条件の発生回数を個別に管理
- `totalMultiplier = 2^(initialACount + drawDoboCount + openDoboCount + returnDoboCount + reshuffleCount)`
- ゲーム開始時に `initialACount` のみ設定され、他は 0 から始まる
- 各イベント発生時に対応するカウントをインクリメントし、`totalMultiplier` を再計算

---

### 4. DoboPhaseState（ドボン判定フェーズ状態）

```typescript
interface DoboPhaseState {
  isActive: boolean;                          // ドボン判定フェーズ中か
  firstDoboDeclaration: DoboDeclaration | null; // 最初のドボン宣言
  returnDeclarations: ReturnDoboDeclaration[]; // 返しドボン宣言一覧（配列順が宣言順）
  noReturnPlayerIds: string[];                 // 「返さない」を宣言したプレイヤーID
  pendingPlayerIds: string[];                  // まだ返し判断をしていないプレイヤーID
  timeoutAt: number;                           // タイムアウト時刻（Unix timestamp ms）
  timeoutSeconds: number;                      // タイムアウト秒数（デフォルト10秒）
}
```

**説明**:
- ドボン宣言後の返し判定フェーズを管理
- `pendingPlayerIds` が空になるか `timeoutAt` を超えた時点でフェーズ終了
- 勝者は `returnDeclarations` の最後の要素（配列順序で判定、Q3.4の回答B）
- `returnDeclarations` が空の場合は `firstDoboDeclaration` の宣言者が勝者
- タイムアウト時は `pendingPlayerIds` に残っているプレイヤーを「返さない」として処理

---

### 5. GameSession（ゲームセッション）

```typescript
interface GameSession {
  sessionId: string;           // セッションID
  roomId: string;              // 対応するルームID
  gameState: GameState;        // ゲーム状態（フロントエンドと共通）
  deckState: DeckState;        // 山札状態（バックエンド専用）
  turnState: TurnState;        // ターン状態（バックエンド専用）
  multiplierState: MultiplierState; // 倍率状態（バックエンド専用）
  doboPhaseState: DoboPhaseState;   // ドボン判定フェーズ状態（バックエンド専用）
  createdAt: number;           // セッション作成時刻（Unix timestamp ms）
  startedAt: number | null;    // ゲーム開始時刻
  endedAt: number | null;      // ゲーム終了時刻
}
```

**説明**:
- ゲーム1回分の全状態を保持するルートエンティティ
- メモリ上で管理し、ゲーム終了後は削除
- `gameState` はフロントエンドに送信する公開情報
- `deckState`, `turnState`, `multiplierState`, `doboPhaseState` はバックエンド内部管理

---

### 6. CardValidationResult（カード検証結果）

```typescript
interface CardValidationResult {
  isValid: boolean;       // 検証結果
  reason?: string;        // 無効な場合の理由（ログ用）
}
```

**説明**:
- `CardValidator` の検証結果を表現
- `isValid: false` の場合、クライアントには `false` を返す（Q7.1の回答B）
- `reason` はサーバーログ用（クライアントには送信しない）

---

### 7. DoboValidationResult（ドボン検証結果）

```typescript
interface DoboValidationResult {
  isValid: boolean;           // 検証結果
  isRuleViolation: boolean;   // ルール違反ドボン（自分のカードへのドボン）か
  matchedFormula: string | null; // 一致した演算式（システム自動計算）
  penalty: boolean;           // ペナルティ適用か
  reason?: string;            // 無効な場合の理由（ログ用）
}
```

**説明**:
- ドボン宣言の検証結果を表現
- `isRuleViolation: true` の場合、ペナルティ処理（バースト相当）を実行し、クライアントには `false` を返す
- `matchedFormula` はシステムが自動計算した一致式（フロントエンドの仕様に合わせ、ユーザーは演算子を選ばない）
- `penalty: true` の場合、`GameEngine` がペナルティ処理を実行

---

## エンティティ間の関係（バックエンド）

```
GameSession
  ├─ 1対1 ─→ GameState      （フロントエンドと共通、クライアントに送信）
  ├─ 1対1 ─→ DeckState      （バックエンド内部管理）
  ├─ 1対1 ─→ TurnState      （バックエンド内部管理）
  ├─ 1対1 ─→ MultiplierState （バックエンド内部管理）
  └─ 1対1 ─→ DoboPhaseState  （バックエンド内部管理）

GameState（フロントエンドと共通）
  ├─ 1対多 ─→ Player
  ├─ 1対多 ─→ DoboDeclaration
  └─ 1対多 ─→ ReturnDoboDeclaration

CardValidationResult  （GameEngine → CardValidator の戻り値）
DoboValidationResult  （GameEngine → DoboDeclaration の戻り値）
```

---

## ライフサイクル

### GameSession のライフサイクル

1. **作成**: `GameSessionManager.createGameSession()` でルーム情報から生成
2. **初期化**: `GameEngine.startGame()` でデッキ初期化・手札配布・初期場札決定
3. **進行**: ターン毎に `GameState`, `DeckState`, `TurnState` を更新
4. **ドボン判定**: `DoboPhaseState` を有効化し、返し判定フェーズを管理
5. **終了**: `GameResult` を生成し、`GameSession` をメモリから削除

### MultiplierState のライフサイクル

1. **初期化**: ゲーム開始時、`DeckManager` が初期場札を決定する際に `initialACount` を設定
2. **更新**: 各倍率イベント発生時にカウントをインクリメント
3. **計算**: `MultiplierCalculator.calculateTotalMultiplier()` で `totalMultiplier` を再計算
4. **使用**: ゲーム終了時の支払い計算に使用
