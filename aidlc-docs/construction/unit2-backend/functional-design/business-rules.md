# Business Rules - Unit 2 (Backend - Game Logic)

## 概要

Unit 2 バックエンドゲームロジック層のビジネスルールを定義する。
フロントエンドの business-rules.md と整合性を保ちつつ、バックエンド固有のルールを追加定義する。

---

## 1. カード操作ルール

### 1.1 カード出しの検証ルール（CardValidator）

**ルール**: 出すカードは場札の条件を満たす必要がある

```
検証条件（いずれかを満たすこと）:
  - 出すカードの数字 == 場札の数字
  - 出すカードのスート == 場札のスート
  - 出すカードが 8（ワイルド）

検証失敗時の処理:
  - CardValidationResult { isValid: false } を返す
  - クライアントには false を返す
  - 警告メッセージは送信しない（フロントエンドが処理）
  - ゲーム状態は変更しない
```

### 1.2 複数枚出しの検証ルール（CardValidator）

**ルール**: 複数枚出す場合は全て同じ数字である必要がある

```
検証条件:
  - 出す全カードの数字が同一

検証失敗時の処理:
  - CardValidationResult { isValid: false, reason: 'DIFFERENT_VALUES' } を返す
  - クライアントには false を返す
  - ゲーム状態は変更しない
```

### 1.3 山札から引いたカードの出し禁止ルール

**ルール**: 山札から引いたターンに、引いたカードは出せない

```
検証条件:
  - TurnState.drawnCardThisTurn が null でない場合
  - 出そうとしているカードが drawnCardThisTurn と一致する場合は出せない

検証失敗時の処理:
  - false を返す
  - ゲーム状態は変更しない
```

### 1.4 山札から引く制限ルール

**ルール**: 1ターンに1枚のみ山札から引ける。引いたらターン終了。

```
検証条件:
  - TurnState.hasDrawnThisTurn が false であること

検証失敗時の処理:
  - false を返す

引いた後の処理:
  - TurnState.hasDrawnThisTurn = true
  - TurnState.drawnCardThisTurn = 引いたカード
  - ターン終了（endTurn() を呼び出す）
```

### 1.5 ターン外操作の禁止ルール

**ルール**: 自分のターン以外にカードを出したり山札から引いたりできない

```
検証条件:
  - TurnState.turnOrder[TurnState.currentPlayerIndex] == playerId

検証失敗時の処理:
  - 例外をスロー（ゲーム状態の不整合として扱う）
  - ログに記録
```

---

## 2. 特殊カード効果ルール

### 2.1 A（1）: スキップルール

**ルール**: 次プレイヤーのターンを飛ばす

```
効果:
  - TurnState.skippedPlayerIds に次プレイヤーIDを追加
  - 次ターン開始時に skippedPlayerIds を確認し、スキップ処理
  - スキップされたプレイヤーは何もできない（ターンが飛ぶ）
  - スキップ後、skippedPlayerIds から除去

複数枚出し時:
  - A を n 枚出した場合、次の n プレイヤーがスキップされる
```

### 2.2 2: 2枚ドロールール

**ルール**: 次プレイヤーは山札から2枚引く。ただし被害者が同じ2を出した場合、効果を上乗せして次の人に押し付けられる。押し付けたプレイヤーはドローしない。

```
効果:
  - TurnState.forcedDrawCount に 2 を加算（初回）
  - 次ターン開始時に forcedDrawCount を確認し、強制ドロー
  - 強制ドロー後、forcedDrawCount をリセット
  - 強制ドローされたプレイヤーはカードを出せない（ターン終了）

上乗せルール（スタッキング）:
  - 被害者（次プレイヤー）が 2 を出した場合:
    - forcedDrawCount に 2 を加算（例: 2→4→6...）
    - 押し付けたプレイヤーはドローしない（効果を完全に回避）
    - 効果は次の次のプレイヤーへ移る
  - 2 を出せないプレイヤーが forcedDrawCount 枚を全て引く
  - 複数枚出し時: 2 を n 枚出した場合、forcedDrawCount に 2n を加算

TurnState の変更:
  - forcedDrawPlayerIds（単一プレイヤーID）→ forcedDrawCount（累積枚数）に変更
  - 現在の被害者は turnOrder の次プレイヤーで管理
```

### 2.3 8: ワイルドルール

**ルール**: 任意のカードに対して出せる。出したプレイヤーがスートを指定する。

```
効果:
  - 場札の条件に関わらず出せる
  - 出した後、GameState.gamePhase = 'suit-selection' に変更
  - 出したプレイヤーがスートを指定するまで次のターンに進まない
  - スート指定後、DeckState.fieldCard の suit を指定スートに更新
  - GameState.gamePhase = 'playing' に戻す
```

### 2.4 J（11）: リバースルール

**ルール**: ターン順を逆回りにする

```
効果:
  - TurnState.turnDirection を反転
    - 'forward' → 'reverse'
    - 'reverse' → 'forward'
  - 即座に適用（次のターンから逆回り）
```

### 2.5 K（13）: オープンルール

**ルール**: 次プレイヤーの手札を全員に公開する。公開されたカードは場に出されるまでオープン状態が継続する。ただし被害者が同じKを出した場合、効果を上乗せして次の人に押し付けられる。押し付けたプレイヤーの手札は公開されない。

```
効果:
  - 次プレイヤーの全手札の isPublic = true に設定
  - TurnState.openHandPlayerIds に次プレイヤーIDを追加

公開状態の継続ルール:
  - 公開されたカードは「場に出されるまで」isPublic = true を維持
  - ターン終了でクローズされない
  - playCard() 実行時に出されたカードの isPublic を false に戻す（捨て札に移動するため不要だが整合性のため）
  - K効果後に引いたカードは isPublic = false（公開されない）
  - 公開状態は K が出た時点で持っていたカードのみ

上乗せルール（スタッキング）:
  - 被害者（次プレイヤー）が K を出した場合:
    - 押し付けたプレイヤーの手札は公開されない（効果を完全に回避）
    - 次の次のプレイヤーの全手札の isPublic = true に設定
    - TurnState.openHandPlayerIds に次の次のプレイヤーIDを追加
  - K を出せないプレイヤーが最終的な被害者（手札が公開される）

TurnState の変更:
  - openHandExpiresAtTurnEnd を削除（ターン終了でのクローズなし）
  - openHandPlayerIds のみで管理
```

---

## 3. ドボン宣言ルール

### 3.1 ドボン宣言の有効性ルール

**ルール**: 手札の全カードを使用し、四則演算のうち1種類のみで場札の数字を作る

```
検証条件:
  - 手札の全カードを使用（手札が空になる）
  - 演算子は +, -, *, / のいずれか1種類のみ
  - 演算結果が場札の数字と一致

システム自動計算:
  - ユーザーは演算子を選ばない
  - システムが4種類の演算子を全て試行
  - 一致する演算子が見つかった場合: ドボン成立
  - 一致する演算子がない場合: ペナルティ処理

0除算の扱い:
  - 割り算で 0 除算が発生する場合: その演算子は無効（スキップ）
```

### 3.2 ドボン不可ルール（自分のカードへのドボン）

**ルール**: 自分が直前に出したカードに対してはドボン不可。ただし宣言は可能だが自動敗北。

```
検証条件:
  - GameState.lastPlayedPlayer.id == 宣言者のプレイヤーID

ルール違反時の処理（Q6.2: 回答B）:
  1. GameEngine 内で検証
  2. ルール違反を検出
  3. ペナルティ処理を実行（バースト相当の支払い）
     - PaymentCalculator.calculatePenaltyPayment() を呼び出す
     - 敗者が自分以外の全プレイヤーに支払い
  4. クライアントには false を返す
  5. ゲームは継続（ペナルティ支払い後、次のターンへ）
```

### 3.3 ドボン宣言タイミングルール

**ルール**: 自分の出したカードが場の最新でない時はいつでもドボン可能

```
有効なタイミング:
  - GameState.lastPlayedPlayer.id != 宣言者のプレイヤーID
  - ゲームフェーズが 'playing' または 'return-dobo'

無効なタイミング:
  - GameState.lastPlayedPlayer.id == 宣言者のプレイヤーID（ルール違反ドボン）
  - ゲームフェーズが 'payment' または 'ended'
```

### 3.4 引きドボンルール

**ルール**: 山札から引いた結果ドボン成立した場合、倍率 ×2

```
判定条件:
  - TurnState.hasDrawnThisTurn == true
  - 宣言者が今ターンに山札から引いている

倍率処理:
  - MultiplierCalculator.addDrawDobo() を呼び出す
  - totalMultiplier を再計算
```

### 3.5 オープンドボンルール

**ルール**: 手札の全カードが isPublic = true の状態でドボン成立した場合のみ、倍率 ×2

```
判定条件（修正）:
  - 宣言者の手札の全カードが isPublic = true であること
  - player.hand.every(card => card.isPublic === true)
  - 一部のカードのみオープンの場合は対象外

倍率処理:
  - MultiplierCalculator.addOpenDobo() を呼び出す
  - totalMultiplier を再計算

非対象ケース:
  - 手札の一部のみ isPublic = true → オープンドボンにならない
  - K効果後に引いたカード（isPublic = false）が手札にある → 対象外
```

---

## 4. 返しドボン判定ルール

### 4.1 返し判定フェーズのタイムアウトルール（Q3.3: 回答C）

**ルール**: タイムアウト付き並行確認。一定時間内に返答がない場合は「返さない」とみなす。

```
タイムアウト設定:
  - デフォルト: 10秒
  - DoboPhaseState.timeoutAt = 宣言時刻 + 10,000ms

タイムアウト処理:
  - pendingPlayerIds に残っているプレイヤーを全員「返さない」として処理
  - checkDoboPhaseEnd() を呼び出す
  - ゲームを進行させる
```

### 4.2 返し宣言の非表示ルール

**ルール**: 「返さない」宣言は他のプレイヤーに通知しない

```
「返さない」宣言時:
  - DoboPhaseState.noReturnPlayerIds に追加
  - 他プレイヤーへの WebSocket 通知なし
  - 宣言したプレイヤー本人にのみ確認応答

「返す」宣言時:
  - DoboPhaseState.returnDeclarations に追加
  - 全プレイヤーに 'game:return' イベントを送信（返しが発生したことを通知）
```

### 4.3 複数人ドボン時の勝者決定ルール（Q3.4: 回答B）

**ルール**: 最後に宣言したプレイヤーが勝者（配列順序で判定）

```
勝者決定ロジック:
  - DoboPhaseState.returnDeclarations の配列順序で判定
  - 配列の最後の要素が最後に宣言したプレイヤー
  - returnDeclarations が空の場合: firstDoboDeclaration の宣言者が勝者

支払い:
  - 勝者に対して、場札を出したプレイヤー（lastPlayedPlayer）が支払い
  - 返しドボン回数分の倍率が適用済み
```

### 4.4 返しドボンの倍率ルール

**ルール**: 返し回数ごとに倍率 ×2

```
返し発生時:
  - MultiplierCalculator.addReturnDobo() を呼び出す
  - 返しが発生するたびに returnDoboCount をインクリメント
  - totalMultiplier を再計算

例:
  - 通常ドボン: 2^0 = 1倍（他の倍率条件がない場合）
  - 返し1回: returnDoboCount = 1 → 2^1 = 2倍
  - 返し2回: returnDoboCount = 2 → 2^2 = 4倍
```

---

## 5. バーストルール

### 5.1 バースト判定ルール（Q6.3: 回答B）

**ルール**: 手札が14枚になった時点で即敗北

```
判定タイミング:
  - カードを引いた後（drawCard 後）
  - 2枚ドロー強制後（2効果）
  - Player クラスが手札枚数を監視して通知

判定条件:
  - player.hand.length >= 14

バースト処理:
  1. Player.isBurst = true
  2. GameState.gamePhase = 'payment'
  3. PaymentCalculator.calculateBurstPayment() を呼び出す
  4. 敗者が自分以外の全プレイヤーに支払い
  5. 全プレイヤーに 'game:burst' イベントを送信
  6. ゲーム終了処理（次のゲームへ）
```

### 5.2 バースト支払いルール

**ルール**: 敗者は山札から1枚引き、その数値 × 基本レート × 倍率を自分以外の全プレイヤーに支払う

```
支払い計算:
  drawnCard = DeckManager.drawCard()
  amount = drawnCard.value × baseRate × totalMultiplier
  各プレイヤーに同額支払い（自分以外の全員）

Payment エンティティ:
  - payer: バーストしたプレイヤー
  - payee: 各プレイヤー（自分以外）
  - amount: 計算された金額
  - reason: 'burst'
```

---

## 6. 倍率ルール

### 6.1 倍率計算ルール

**ルール**: 全条件の発生回数の合計を n として 2^n で計算

```
total_multiplier = 2^(initialACount + drawDoboCount + openDoboCount + returnDoboCount + reshuffleCount)

各条件:
  - initialACount: ゲーム開始時のA連続回数
  - drawDoboCount: 引きドボン発生回数（通常1回）
  - openDoboCount: オープンドボン発生回数（通常1回）
  - returnDoboCount: 返しドボン発生回数（複数回あり得る）
  - reshuffleCount: 山札再生成発生回数（複数回あり得る）
```

### 6.2 山札再生成の倍率ルール

**ルール**: 山札切れ時の再生成ごとに倍率 ×2

```
再生成処理:
  1. DeckState.drawPile が空になった時
  2. GameEngine が DeckManager.reshuffleDeck() を指示
  3. MultiplierCalculator.addReshuffle() を呼び出す
  4. reshuffleCount をインクリメント
  5. totalMultiplier を再計算

再生成ルール:
  - 場の最後の1枚（現在の場札）を除いた捨て札をシャッフル
  - 再生成後も場札は変わらない
```

---

## 7. ゲーム継続ルール

### 7.1 無限ゲーム継続ルール

**ルール**: ゲーム終了後、自動的に次のゲームが開始する

```
ゲーム終了後の処理:
  1. GameResult を生成
  2. 全プレイヤーに 'game:ended' イベントを送信
  3. 「次で抜ける」を宣言したプレイヤーを退出処理
  4. 残りプレイヤーが 2 人以上の場合: 新しい GameSession を作成して次のゲーム開始
  5. 残りプレイヤーが 1 人以下の場合: ルームに戻る
```

### 7.2 プレイヤー脱出ルール

**ルール**: 「次で抜ける」を宣言したプレイヤーは次のゲーム終了時に退出

```
脱出処理:
  - ゲーム中に 'game:leave-next' イベントを受信
  - GameSession に leaveNextPlayerIds を記録
  - ゲーム終了時に leaveNextPlayerIds のプレイヤーを退出処理
  - 退出後、全プレイヤーに 'room:player-left' イベントを送信
  - 残りプレイヤーが 2 人以上: 次のゲームを開始
  - 残りプレイヤーが 1 人以下: ルームに戻る（'room:game-ended' イベント）
```

---

## 8. エラーハンドリングルール

### 8.1 無効なカード操作（Q7.1: 回答B）

```
処理:
  - false を返す
  - ゲーム状態は変更しない
  - サーバーログに記録（reason を含む）
  - クライアントへのエラーメッセージは送信しない
```

### 8.2 無効なドボン宣言（Q7.2: 回答A + C の組み合わせ）

```
処理:
  - 内部でペナルティ処理を実行（バースト相当の支払い）
  - クライアントには false を返す
  - 全プレイヤーに 'game:penalty' イベントを送信（ペナルティ発生を通知）
  - ゲームは継続
```

### 8.3 ゲーム状態の不整合（Q7.3: 回答A）

```
処理:
  - 例外をスロー
  - サーバーログに詳細を記録
  - クライアントに 'game:error' イベントを送信
  - ゲームセッションを終了
  - 全プレイヤーをルームに戻す
```

---

## 9. テストルール

### 9.1 ユニットテスト（Q8.1: 回答A）

```
テストフレームワーク: Jest
テスト対象:
  - CardValidator: 全検証ケース
  - MultiplierCalculator: 倍率計算の全パターン
  - DoboDeclaration: 演算式自動計算、勝者決定ロジック
  - DeckManager: デッキ初期化、シャッフル、再生成
  - PaymentCalculator: 支払い計算の全パターン
```

### 9.2 テストカバレッジ（Q8.2: 回答C）

```
目標: 特になし（適当にテスト）
重点テスト対象:
  - ビジネスルールの境界値（手札14枚、倍率計算）
  - ドボン演算式の自動計算
  - 返しドボンの勝者決定
```

### 9.3 テストデータ（Q8.3: 回答B）

```
ファクトリーパターンでテストデータを生成:
  - CardFactory: テスト用カードを生成
  - PlayerFactory: テスト用プレイヤーを生成
  - GameStateFactory: テスト用ゲーム状態を生成
  - DeckStateFactory: テスト用山札状態を生成
```
