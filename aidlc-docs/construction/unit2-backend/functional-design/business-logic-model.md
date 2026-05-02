# Business Logic Model - Unit 2 (Backend - Game Logic)

## 概要

Unit 2 のバックエンドゲームロジック層のビジネスロジックモデルを定義する。
対象コンポーネント: `GameEngine`, `DoboDeclaration`, `MultiplierCalculator`, `DeckManager`, `CardValidator`, `PaymentCalculator`

---

## 1. GameEngine

### 責務
ゲーム状態管理、ターン管理、カード操作の実行、特殊カード効果の処理。
ドボン宣言処理・倍率計算は委譲する（Q2.1: 回答A）。

### 1.1 ゲーム初期化フロー

```
startGame(players, baseRate):
  1. GameSession を生成
  2. DeckManager.initializeDeck() でデッキ初期化
  3. DeckManager.dealCards(players, 5) で各プレイヤーに5枚配布
  4. DeckManager.determineInitialCard() で初期場札決定
     └─ A が出た場合: MultiplierCalculator.addInitialA() を呼び出し、再度引く
  5. TurnState を初期化（ランダムに最初のプレイヤーを決定）
  6. GameState を初期化して返す
```

### 1.2 カードを出すフロー

```
playCard(playerId, cards):
  1. TurnState.currentPlayerIndex のプレイヤーが playerId か確認
     └─ 不一致: 例外をスロー（Q7.3: 回答A）
  2. CardValidator.validatePlayableCards(cards, fieldCard) で検証
     └─ 無効: false を返す（Q7.1: 回答B）
  3. Player の手札から cards を除去
  4. DeckState.discardPile に fieldCard を追加
  5. DeckState.fieldCard を cards の最後のカードに更新
  6. GameState.lastPlayedPlayer を playerId に更新
  7. 特殊カード効果を処理（SpecialCardHandler に委譲）
  8. バースト判定: Player の手札が 14 枚以上か確認（Q6.3: 回答B）
     └─ バースト: Player.isBurst = true、ゲーム終了処理
  9. TurnState を更新（次のプレイヤーへ）
  10. 更新された GameState を返す
```

### 1.3 山札から引くフロー

```
drawCard(playerId):
  1. TurnState.currentPlayerIndex のプレイヤーが playerId か確認
  2. TurnState.hasDrawnThisTurn が false か確認
     └─ true: false を返す（既に引いている）
  3. DeckManager.drawCard() でカードを引く
     └─ 山札が空: GameEngine が DeckManager.reshuffleDeck() を指示（Q5.3: 回答B）
        └─ reshuffleCount をインクリメント、MultiplierCalculator に通知
  4. Player の手札に追加
  5. TurnState.hasDrawnThisTurn = true
  6. TurnState.drawnCardThisTurn = 引いたカード
  7. バースト判定（手札 14 枚）
  8. ターン終了（山札から引いたらターン終了）
  9. 引いたカードを返す
```

### 1.4 特殊カード効果処理

各特殊カードに専用ハンドラークラスを作成（Q2.2: 回答B）。

```
SpecialCardHandler（インターフェース）:
  handle(gameSession: GameSession): void

ACardHandler implements SpecialCardHandler:
  handle():
    - TurnState.skippedPlayerIds に次プレイヤーIDを追加
    - 次ターン開始時にスキップ処理

TwoCardHandler implements SpecialCardHandler:
  handle():
    - TurnState.forcedDrawCount に 2 を加算
    - 次プレイヤーが 2 を出した場合（スタッキング）:
      - forcedDrawCount にさらに 2 を加算
      - 押し付けたプレイヤーはドローしない（効果を完全に回避）
      - 効果は次の次のプレイヤーへ移る
    - 2 を出せないプレイヤーのターン開始時に forcedDrawCount 枚を強制ドロー
    - 強制ドロー後、forcedDrawCount = 0 にリセット

EightCardHandler implements SpecialCardHandler:
  handle():
    - GameState.gamePhase を 'suit-selection' に変更
    - 出したプレイヤーがスートを指定するまで待機
    - 指定後、DeckState.fieldCard のスートを更新

JCardHandler implements SpecialCardHandler:
  handle():
    - TurnState.turnDirection を反転（'forward' ↔ 'reverse'）

KCardHandler implements SpecialCardHandler:
  handle():
    - 次プレイヤーの全手札の isPublic を true に設定
    - TurnState.openHandPlayerIds に次プレイヤーIDを追加
    - ターン終了でのクローズなし（カードが場に出されるまで isPublic = true を維持）
    - 次プレイヤーが K を出した場合（スタッキング）:
      - 押し付けたプレイヤーの手札は公開されない（効果を完全に回避）
      - 次の次のプレイヤーの全手札の isPublic を true に設定
      - TurnState.openHandPlayerIds に次の次のプレイヤーIDを追加
    - playCard() 実行時: 出されたカードは捨て札に移るため isPublic 管理から外れる
```

### 1.5 ターン管理（Q2.3: 回答A）

```
GameEngine 内で currentPlayerIndex を直接管理:

getNextPlayerIndex():
  if turnDirection == 'forward':
    return (currentPlayerIndex + 1) % activePlayers.length
  else:
    return (currentPlayerIndex - 1 + activePlayers.length) % activePlayers.length

endTurn():
  1. skippedPlayerIds の処理（A効果スキップ）
  2. forcedDrawCount の処理（2効果ドロー）
  3. currentPlayerIndex を更新
  ※ openHandExpiresAtTurnEnd の処理は削除（カードが場に出されるまでオープン継続）
```

---

## 2. DoboDeclaration

### 責務
ドボン宣言の受付、演算式検証、返し判定フェーズ管理、勝者決定。

### 2.1 ドボン宣言フロー

```
declareDobo(playerId, lastPlayedPlayerId):
  1. DoboPhaseState.isActive が false か確認（既にドボンフェーズでないか）
  2. ルール違反チェック: playerId == lastPlayedPlayerId か確認（Q3.2: 回答B）
     └─ 一致（自分のカードへのドボン）:
        - isRuleViolation = true
        - システムが自動計算（validateDoboFormula）
        - 一致する式があっても: ペナルティ処理（バースト相当）を実行
        - クライアントには false を返す
  3. システムが自動計算: validateDoboFormula(playerHand, fieldCardValue)
     └─ 一致する式なし: ペナルティ処理を実行、false を返す（Q7.2: 回答A+C）
     └─ 一致する式あり: DoboDeclaration を生成
  4. DoboPhaseState を有効化:
     - isActive = true
     - firstDoboDeclaration = 生成した DoboDeclaration
     - pendingPlayerIds = 宣言者以外の全プレイヤーID
     - timeoutAt = 現在時刻 + 10秒
  5. 全プレイヤーに WebSocket で 'game:dobo' イベントを送信
  6. true を返す
```

### 2.2 演算式自動計算（Q3.1: 回答D）

```
validateDoboFormula(hand: Card[], targetValue: number): string | null:
  1. 手札の全カードの数値を取得（A=1, J=11, Q=12, K=13）
  2. 4つの演算子（+, -, *, /）それぞれで試行:
     for operator in ['+', '-', '*', '/']:
       result = applyOperator(hand.map(c => c.value), operator)
       if result == targetValue:
         return buildFormulaString(hand, operator)
  3. どれも一致しない場合: null を返す

applyOperator(values: number[], operator: string): number:
  - '+': values.reduce((a, b) => a + b)
  - '-': values.reduce((a, b) => a - b)
  - '*': values.reduce((a, b) => a * b)
  - '/': values.reduce((a, b) => a / b)  ※ 0除算は null 扱い
```

**注**: 手札の順序は固定（並び替えは行わない）。演算子1種類のみ使用。

### 2.3 返しドボン宣言フロー

```
declareReturn(playerId, lastPlayedPlayerId):
  1. DoboPhaseState.isActive が true か確認
  2. playerId が pendingPlayerIds に含まれるか確認
  3. ルール違反チェック（自分のカードへの返しドボン）
  4. システムが自動計算: validateDoboFormula(playerHand, fieldCardValue)
     └─ 一致なし: ペナルティ処理、false を返す
     └─ 一致あり: ReturnDoboDeclaration を生成
  5. DoboPhaseState.returnDeclarations に追加（配列末尾に追加）
  6. DoboPhaseState.pendingPlayerIds から playerId を除去
  7. MultiplierCalculator.addReturnDobo() で倍率更新
  8. 全プレイヤーに WebSocket で 'game:return' イベントを送信
  9. checkDoboPhaseEnd() を呼び出す
  10. true を返す
```

### 2.4 返さない宣言フロー

```
declareNoReturn(playerId):
  1. DoboPhaseState.isActive が true か確認
  2. DoboPhaseState.noReturnPlayerIds に playerId を追加
  3. DoboPhaseState.pendingPlayerIds から playerId を除去
  4. checkDoboPhaseEnd() を呼び出す
  ※ 他プレイヤーには通知しない（非表示ルール）
```

### 2.5 ドボンフェーズ終了判定

```
checkDoboPhaseEnd():
  if pendingPlayerIds.length == 0 OR 現在時刻 >= timeoutAt:
    determineWinner()

determineWinner():
  if returnDeclarations.length > 0:
    winner = returnDeclarations[returnDeclarations.length - 1].playerId
    （配列の最後 = 最後に宣言したプレイヤー、Q3.4: 回答B）
  else:
    winner = firstDoboDeclaration.playerId
  
  GameEngine.finalizeGame(winner)
```

### 2.6 タイムアウト処理（Q3.3: 回答C）

```
タイムアウト監視（setInterval または setTimeout）:
  if 現在時刻 >= timeoutAt AND DoboPhaseState.isActive:
    pendingPlayerIds の全プレイヤーを「返さない」として処理
    checkDoboPhaseEnd()
```

---

## 3. MultiplierCalculator

### 責務
倍率の管理と計算。累積計算方式（Q4.1: 回答C）。

### 3.1 倍率計算ロジック

```
calculateTotalMultiplier(state: MultiplierState): number:
  n = state.initialACount
    + state.drawDoboCount
    + state.openDoboCount
    + state.returnDoboCount
    + state.reshuffleCount
  return Math.pow(2, n)  // 2^n
```

### 3.2 各倍率イベントのメソッド

```
addInitialA(state: MultiplierState): MultiplierState:
  state.initialACount++
  state.totalMultiplier = calculateTotalMultiplier(state)
  return state

addDrawDobo(state: MultiplierState): MultiplierState:
  state.drawDoboCount++
  state.totalMultiplier = calculateTotalMultiplier(state)
  return state

addOpenDobo(state: MultiplierState): MultiplierState:
  state.openDoboCount++
  state.totalMultiplier = calculateTotalMultiplier(state)
  return state

addReturnDobo(state: MultiplierState): MultiplierState:
  state.returnDoboCount++
  state.totalMultiplier = calculateTotalMultiplier(state)
  return state

addReshuffle(state: MultiplierState): MultiplierState:
  state.reshuffleCount++
  state.totalMultiplier = calculateTotalMultiplier(state)
  return state
```

### 3.3 引きドボン判定

```
isDrawDobo(playerId: string, turnState: TurnState): boolean:
  return turnState.drawnCardThisTurn != null
    AND turnState.hasDrawnThisTurn == true
  // 今ターンに山札から引いたプレイヤーがドボン宣言した場合
```

### 3.4 オープンドボン判定（修正）

```
isOpenDobo(playerId: string, players: Player[]): boolean:
  player = players.find(p => p.id == playerId)
  // 手札の全カードが isPublic = true の場合のみオープンドボン
  return player.hand.length > 0
    AND player.hand.every(card => card.isPublic === true)
  // 一部のみオープンの場合は false
```

---

## 4. DeckManager

### 責務
山札の初期化、カード配布、初期場札決定、山札再生成。

### 4.1 デッキ初期化（Q5.1: 回答C）

```typescript
// 定数配列から生成
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;

initializeDeck(): Card[]:
  deck = []
  for suit of SUITS:
    for value of VALUES:
      deck.push({ suit, value, isPublic: false })
  return shuffle(deck)
```

### 4.2 カード配布（Q5.2: 回答B）

```
dealCards(players: Player[], cardsPerPlayer: number): void:
  // GameEngine が DeckManager からカードを取得して配布
  for player of players:
    for i in range(cardsPerPlayer):
      card = drawCard()
      player.hand.push(card)
```

### 4.3 初期場札決定

```
determineInitialCard(multiplierState: MultiplierState): Card:
  loop:
    card = drawCard()
    if card.value == 1 (A):
      MultiplierCalculator.addInitialA(multiplierState)
      // DeckManager が MultiplierCalculator を呼び出す（Q4.2: 回答A）
      continue  // 再度引く
    else:
      fieldCard = card
      return card
```

### 4.4 山札再生成（Q5.3: 回答B、補足: 場の最後の1枚を除く）

```
reshuffleDeck(deckState: DeckState): void:
  // GameEngine が DeckManager に再生成を指示
  lastFieldCard = deckState.fieldCard  // 場の最後の1枚（現在の場札）を保持
  newDrawPile = [...deckState.discardPile]  // 捨て札を全て使用
  deckState.discardPile = []
  deckState.drawPile = shuffle(newDrawPile)
  // fieldCard はそのまま維持（場の最後の1枚は除く）
```

**注**: Q5.3 の補足通り、「場の最初の1枚」ではなく「場の最後の1枚（現在の場札）」を除いて再生成する。

### 4.5 シャッフルアルゴリズム（Q5.4: 回答B）

```
shuffle(cards: Card[]): Card[]:
  return cards.sort(() => Math.random() - 0.5)
  // ランダムソート（Array.sort with Math.random）
```

---

## 5. CardValidator

### 責務
カード操作ルールの検証（Q6.1: 回答B）。

### 5.1 カード出し検証

```
validatePlayableCards(cards: Card[], fieldCard: Card): CardValidationResult:
  1. cards が空でないか確認
  2. 複数枚の場合: 全て同じ数字か確認（Q1.2 business-rules）
     └─ 異なる数字: { isValid: false, reason: 'DIFFERENT_VALUES' }
  3. 先頭カードが場札の条件を満たすか確認:
     - 同じ数字: cards[0].value == fieldCard.value
     - 同じスート: cards[0].suit == fieldCard.suit
     - ワイルド（8）: cards[0].value == 8
     └─ 条件不満: { isValid: false, reason: 'INVALID_CARD' }
  4. 全て通過: { isValid: true }
```

### 5.2 山札から引いたカードの出し禁止チェック

```
canPlayDrawnCard(card: Card, turnState: TurnState): boolean:
  if turnState.drawnCardThisTurn == null: return true
  return card.suit != turnState.drawnCardThisTurn.suit
    OR card.value != turnState.drawnCardThisTurn.value
  // 引いたターンに引いたカードは出せない
```

---

## 6. PaymentCalculator

### 責務
支払い金額の計算（Q4.3: 回答C）。

### 6.1 通常支払い計算（ドボン時）

```
calculateDoboPayment(baseRate: number, multiplierState: MultiplierState, deckState: DeckState): Payment:
  drawnCard = DeckManager.drawCard(deckState)  // 山札からランダムに1枚引く
  amount = drawnCard.value * baseRate * multiplierState.totalMultiplier
  return {
    payer: lastPlayedPlayer,  // 場札を出したプレイヤーが支払い
    amount: amount,
    reason: 'dobo',
    drawnCard: drawnCard
  }
```

### 6.2 バースト支払い計算

```
calculateBurstPayment(baseRate: number, multiplierState: MultiplierState, deckState: DeckState, allPlayers: Player[]): Payment[]:
  drawnCard = DeckManager.drawCard(deckState)
  amount = drawnCard.value * baseRate * multiplierState.totalMultiplier
  // 敗者が自分以外の全プレイヤーに支払い
  return allPlayers
    .filter(p => p.id != burstPlayerId)
    .map(p => ({
      payer: burstPlayer,
      payee: p,
      amount: amount,
      reason: 'burst',
      drawnCard: drawnCard
    }))
```

### 6.3 ペナルティ支払い計算（無効ドボン・ルール違反ドボン）

```
calculatePenaltyPayment(baseRate: number, multiplierState: MultiplierState, deckState: DeckState, allPlayers: Player[]): Payment[]:
  // バースト時と同じ支払いロジック（敗者が全員に支払い）
  return calculateBurstPayment(baseRate, multiplierState, deckState, allPlayers)
  // reason: 'invalid-formula' または 'rule-violation'
```

---

## コンポーネント間の連携フロー

### ゲーム開始フロー

```
GameSessionManager
  → GameEngine.startGame()
    → DeckManager.initializeDeck()
    → DeckManager.dealCards()
    → DeckManager.determineInitialCard()
      → MultiplierCalculator.addInitialA() （Aが出た場合）
    → TurnState 初期化
  → WebSocket で 'game:started' イベントを全プレイヤーに送信
```

### ドボン宣言フロー

```
WebSocketHandler
  → GameEngine.handleDoboDeclaration(playerId)
    → DoboDeclaration.declareDobo(playerId, lastPlayedPlayerId)
      → MultiplierCalculator.isDrawDobo() で引きドボン判定
      → MultiplierCalculator.isOpenDobo() でオープンドボン判定
      → 該当する場合: MultiplierCalculator.addDrawDobo() / addOpenDobo()
      → DoboPhaseState を有効化
    → WebSocket で 'game:dobo' イベントを全プレイヤーに送信
    → タイムアウト監視を開始

DoboPhaseState.pendingPlayerIds が空 OR タイムアウト
  → DoboDeclaration.determineWinner()
    → GameEngine.finalizeGame(winner)
      → PaymentCalculator.calculateDoboPayment()
      → GameResult を生成
      → WebSocket で 'game:ended' イベントを全プレイヤーに送信
```
