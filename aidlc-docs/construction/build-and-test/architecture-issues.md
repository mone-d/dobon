# アーキテクチャ課題と全体見直し観点

## 概要

プレイテスト中に発見されたバグの多くは、個別のロジックミスではなく構造的な問題に起因している。
以下に根本原因と見直し時の観点を記録する。

---

## 根本原因

### 1. ドボンフェーズの状態管理が3箇所に分散

| 責務 | 現在の場所 | 問題 |
|------|-----------|------|
| ドボン宣言・返し・勝者決定 | `DoboDeclaration.ts` | `checkDoboPhaseEnd`→`determineWinner`で`isActive=false`にする |
| タイマー管理・ゲーム終了通知 | `GameSocketHandler.ts` | 別の`checkDoboPhaseEnd`があり、`isActive`チェックで空振りする |
| ターン進行・倍率計算 | `GameEngine.ts` + `GameSocketHandler.ts` | `endTurn`のタイミングが効果判定と噛み合わない |

**具体的に起きたバグ:**
- ドボン返し成功 → `DoboDeclaration`内で`isActive=false` → GameSocketHandler側の`checkDoboPhaseEnd`が空振り → `finalizeDoboGame`未実行 → タイマーが残り30秒後に二重発火

### 2. ターン外アクションの考慮不足

ドボン・返しドボンは「ターン外」で宣言可能だが、判定ロジックが「現在のターン状態」に依存していた。

**具体的に起きたバグ:**
- `handleAcceptEffect`: `currentPlayerIndex`で被害者判定 → ターンがずれると受け入れ不可
- `isDrawDobo`: `drawnCardThisTurn`で判定 → `endTurn`でリセット済みのため常にfalse
- `declareReturn`のルール違反チェック: `lastPlayedPlayer`で判定 → 返し宣言者=最後にカードを出した人なので常にrule_violation

### 3. 同じ概念の重複実装

- `DoboDeclaration.checkDoboPhaseEnd` と `GameSocketHandler.checkDoboPhaseEnd` が別々に存在
- `effectTimeoutMap`（2/K用）と`doboTimeoutMap`（ドボン返し用）が別管理で、クリアタイミングが不統一
- 倍率計算が`finalizeDoboGame`内にべた書きで、条件判定が散在

### 4. 状態の「時点」が保存されていない

- フルオープン判定: ドボン宣言時の手札を保存しているが、引きドボンで引いたカード（`isPublic=false`）が混入して判定失敗
- 引きドボン判定: ドロー時点のフラグが`endTurn`でリセットされ、宣言時には消失

---

## カード管理のリファクタリング計画

### 現状の問題

現在の設計は「配列間でオブジェクトを移動する」方式:
- `deck[]` → `player.hand[]` → `discardPile[]` → `deck[]`（リシャッフル）
- 移動 = 移動元から削除 + 移動先に追加（2ステップ）
- どちらかを忘れるとカード消失 or 重複

実際に発生した消失バグ:
- 複数枚出し時に中間カードがどこにも入らなかった
- `reshuffleDeck`で1枚余計に除外していた
- `determineInitialCard`でAが出た時にどこにも格納されなかった

### 目指す設計

「各カードに所在地(location)を持たせる」方式:

```typescript
type CardLocation =
  | { type: 'deck' }
  | { type: 'hand'; playerId: string }
  | { type: 'field' }
  | { type: 'discard' }
  | { type: 'payment' }; // 支払い計算で引かれたカード

interface ManagedCard {
  id: string;          // 一意識別子 (e.g. "hearts-7")
  suit: Suit;
  value: CardValue;
  isPublic: boolean;
  location: CardLocation;
}

class CardRegistry {
  private cards: ManagedCard[] = []; // 常に52枚

  moveCard(cardId: string, newLocation: CardLocation): void {
    const card = this.cards.find(c => c.id === cardId);
    if (!card) throw new Error(`Card not found: ${cardId}`);
    card.location = newLocation;
  }

  getCardsAt(location: CardLocation['type']): ManagedCard[] {
    return this.cards.filter(c => c.location.type === location);
  }

  // 整合性チェック（デバッグ/テスト用）
  assertIntegrity(): void {
    if (this.cards.length !== 52) {
      throw new Error(`Card count mismatch: ${this.cards.length}`);
    }
  }
}
```

### メリット
- カードの移動が1ステップ（locationの変更のみ）
- 消失が構造的に不可能（配列から削除しないので）
- `assertIntegrity()`で任意のタイミングで52枚を検証可能
- デバッグ時に「このカードは今どこにある？」が即座にわかる

### 実施手順

1. **単体テストを先に作成**（現在の動作を保証）
   - カード配布後の合計枚数 = 52
   - カードプレイ後の合計枚数 = 52（1枚出し、複数枚出し）
   - ドロー後の合計枚数 = 52
   - リシャッフル後の合計枚数 = 52
   - 初期場札決定（A連続）後の合計枚数 = 52
   - 強制ドロー後の合計枚数 = 52
   - 支払いカード引き後の合計枚数 = 52
   - ゲーム全体シミュレーション（100ターン）後の合計枚数 = 52

2. **CardRegistryクラスを実装**
   - 既存のDeckState/Player.handと並行して動作させる（移行期間）
   - 各操作後に`assertIntegrity()`を呼んで検証

3. **既存コードをCardRegistry経由に段階的に移行**
   - DeckManager → CardRegistry
   - GameEngine.playCard → CardRegistry.moveCard
   - GameEngine.drawCard → CardRegistry.moveCard

4. **同じ単体テストがパスすることを確認**

5. **旧データ構造（deck[], discardPile[], hand[]）を廃止**
   - CardRegistryから動的に生成するgetterに置き換え

---

## 見直し時の方針案

### A. ドボンフェーズの状態遷移を1箇所に集約

```
DoboPhaseManager (新設)
├── declareDobo()
├── declareReturn()
├── declareNoReturn()
├── acceptTimeout()
├── getWinner()
└── getMultiplierFactors()
```

- 状態遷移は全てこのクラス内で完結
- GameSocketHandlerはイベント受信→Manager呼び出し→結果に応じてbroadcastのみ
- タイマー管理もManager内に統合

### B. 「宣言時スナップショット」パターン

ドボン宣言時に以下を保存:
```typescript
interface DoboSnapshot {
  playerId: string;
  cards: Card[];           // 手札コピー
  isDrawDobo: boolean;     // 引きドボンか
  isOpenDobo: boolean;     // フルオープンか（引いたカード除外で判定済み）
  timestamp: number;
}
```

倍率計算時は保存済みのスナップショットを参照し、現在のゲーム状態に依存しない。

### C. ターン外アクションの明示的な分離

- ターン内アクション: `playCard`, `drawCard`, `selectSuit`
- ターン外アクション: `declareDobo`, `declareReturn`, `declareNoReturn`, `acceptEffect`

ターン外アクションは`currentPlayerIndex`を参照せず、専用の状態（`effectVictimMap`, `doboPhaseState`）のみを使う。

### D. E2Eテストシナリオの追加

以下のシナリオを自動テスト化:
- 2人: ドボン → 返し → ゲーム終了
- 3人: ドボン → 返し → さらに返し
- 引きドボン（倍率確認）
- フルオープンドボン（倍率確認）
- フルオープン引きドボン（倍率確認）
- 2/K効果 → 受け入れボタン → 効果発動
- 2/K効果 → タイムアウト → 効果発動
- 2/K効果 → 押し付け → 新しい被害者

---

## 今回の個別修正履歴

| バグ | 原因 | 修正 |
|------|------|------|
| K受け入れボタンが効かない | `currentPlayerIndex`で被害者判定 | `effectVictimMap`で被害者ID保存 |
| ドボン返しがrule_violation | `lastPlayedPlayer`==返し宣言者 | 返しドボンではルール違反チェック削除 |
| ドボン返し成功してもゲーム終了しない | `DoboDeclaration`内で`isActive=false`→Handler側空振り | `isActive`チェック後に直接`finalizeDoboGame`呼び出し |
| 引きドボンの倍率が適用されない | `endTurn`で`drawnCardThisTurn`リセット済み | `lastDrawPlayerId`をセッションに保存 |
| フルオープン引きドボンが成立しない | 引いたカード(`isPublic=false`)が混入 | 引きドボン時は最後の1枚を除外して判定 |
| フルオープン倍率が返しドボン時に適用されない | 勝者の手札で判定していた | 宣言者ごとの保存済みカードで判定 |
