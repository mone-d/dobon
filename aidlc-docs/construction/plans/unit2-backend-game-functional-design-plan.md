# Functional Design Plan - Unit 2 (Backend - Game Logic)

## プラン概要

**ユニット**: Unit 2 - Backend Game Logic  
**フェーズ**: CONSTRUCTION - Functional Design  
**目的**: ゲームロジック層の詳細設計（GameEngine, DoboDeclaration, MultiplierCalculator, DeckManager）

---

## 参照すべき前工程の成果物

このプランを実行する際は、以下の前工程の成果物を厳密に参照してください：

### Inception Phase
- `aidlc-docs/inception/requirements/requirements.md` - 要件定義
- `aidlc-docs/inception/application-design/components.md` - コンポーネント定義
- `aidlc-docs/inception/application-design/component-methods.md` - メソッド定義
- `aidlc-docs/inception/application-design/unit-of-work.md` - ユニット定義

### Unit 1 (Frontend) Functional Design
- `aidlc-docs/construction/unit1-frontend/functional-design/domain-entities.md` - ドメインエンティティ（フロントエンドと共通）
- `aidlc-docs/construction/unit1-frontend/functional-design/business-rules.md` - ビジネスルール（フロントエンドと整合性を保つ）

---

## 質問セクション

### セクション 1: ドメインモデル設計

#### Q1.1 バックエンドのドメインエンティティ
Unit 1 で定義したドメインエンティティ（User, Card, Player, GameState, DoboDeclaration, ReturnDoboDeclaration, Room, GameResult, Statistics, Ranking）をバックエンドでも使用しますか？それとも、バックエンド専用のエンティティを追加しますか？

**選択肢**:
- A: Unit 1 のエンティティをそのまま使用（フロントエンドとバックエンドで共通）
- B: バックエンド専用のエンティティを追加（例: DeckState, TurnState, MultiplierState）
- C: 一部のエンティティを拡張（例: GameState に追加属性を追加）

[Answer]: B

#### Q1.2 エンティティの永続化
バックエンドでエンティティをどのように永続化しますか？

**選択肢**:
- A: メモリのみ（ゲーム進行中のみ保持、ゲーム終了後は削除）
- B: データベースに保存（PostgreSQL または MongoDB）
- C: メモリ + データベース（ゲーム進行中はメモリ、終了後はデータベース）

[Answer]: A

---

### セクション 2: GameEngine 設計

#### Q2.1 GameEngine の責務
GameEngine の主要な責務は何ですか？

**選択肢**:
- A: ゲーム状態管理のみ（カード操作、ターン管理、特殊カード効果）
- B: ゲーム状態管理 + ドボン宣言処理
- C: ゲーム状態管理 + ドボン宣言処理 + 倍率計算

[Answer]: A

#### Q2.2 特殊カード効果の処理
特殊カード効果（A, 2, 8, J, K）の処理はどのように実装しますか？

**選択肢**:
- A: GameEngine 内で直接処理（switch 文で分岐）
- B: 各特殊カードごとに専用のハンドラークラスを作成
- C: Strategy パターンで実装（カードごとに異なる戦略）

[Answer]: B

#### Q2.3 ターン管理
ターン管理はどのように実装しますか？

**選択肢**:
- A: GameEngine 内で直接管理（currentPlayerIndex を使用）
- B: 専用の TurnManager クラスを作成
- C: GameState に turnOrder と turnDirection を持たせて管理

[Answer]: A

---

### セクション 3: DoboDeclaration 設計

#### Q3.1 演算式検証ロジック
演算式検証ロジックはどのように実装しますか？

**選択肢**:
- A: 正規表現で検証
- B: パーサーを実装して構文解析
- C: eval() を使用して計算結果を検証（セキュリティリスクあり）
- D: 手札の全組み合わせを生成して検証

[Answer]: D

#### Q3.2 ドボン宣言の有効性確認
ドボン宣言の有効性確認（自分が直前に出したカードでないか）はどのように実装しますか？

**選択肢**:
- A: GameState の lastPlayedPlayer を確認
- B: ドボン宣言時に lastPlayedPlayer を引数として渡す
- C: DoboDeclaration クラス内で GameState を参照

[Answer]: B

#### Q3.3 返しドボン判定フェーズ
返しドボン判定フェーズはどのように実装しますか？

**選択肢**:
- A: 全プレイヤーに対して順次確認（同期処理）
- B: 全プレイヤーに対して並行確認（非同期処理、WebSocket で通知）
- C: タイムアウト付き並行確認（一定時間内に返答がない場合は「返さない」とみなす）

[Answer]: C

#### Q3.4 複数人ドボン時の勝者決定
複数人がドボン可能な場合、最後に宣言したプレイヤーが勝者となりますが、どのように実装しますか？

**選択肢**:
- A: DoboDeclaration の timestamp を比較
- B: DoboDeclaration の配列順序で判定
- C: 最後に宣言したプレイヤーのみを記録

[Answer]: B

---

### セクション 4: MultiplierCalculator 設計

#### Q4.1 倍率計算ロジック
倍率計算ロジックはどのように実装しますか？

**選択肢**:
- A: 各条件ごとに倍率を加算（2^n で計算）
- B: 倍率を配列で管理（条件ごとに追加）
- C: 倍率を累積計算（条件ごとに ×2）

[Answer]: C

#### Q4.2 初期A処理
初期Aの処理（開始時にAが連続した回数分 ×2）はどのように実装しますか？

**選択肢**:
- A: DeckManager が初期場札を決定する際に MultiplierCalculator を呼び出す
- B: GameEngine が初期化時に MultiplierCalculator を呼び出す
- C: MultiplierCalculator が初期化時に自動的に処理

[Answer]: A

#### Q4.3 支払い金額計算
支払い金額計算（山札からのランダムカード × 基本レート × 倍率）はどのように実装しますか？

**選択肢**:
- A: MultiplierCalculator 内で計算
- B: GameEngine 内で計算
- C: 専用の PaymentCalculator クラスを作成

[Answer]: C

---

### セクション 5: DeckManager 設計

#### Q5.1 デッキ初期化
デッキ初期化（トランプ52枚）はどのように実装しますか？

**選択肢**:
- A: ハードコードで52枚のカードを生成
- B: ループで4スート × 13数字を生成
- C: 定数配列から生成

[Answer]: C

#### Q5.2 カード配布
カード配布（各プレイヤーに5枚）はどのように実装しますか？

**選択肢**:
- A: DeckManager が各プレイヤーに直接配布
- B: GameEngine が DeckManager からカードを取得して配布
- C: Player クラスが DeckManager からカードを取得

[Answer]: B

#### Q5.3 山札再生成
山札再生成（山札切れ時、場の最初の1枚を除き捨て札をシャッフル）はどのように実装しますか？

**選択肢**:
- A: DeckManager 内で自動的に再生成
- B: GameEngine が DeckManager に再生成を指示
- C: 山札が空になった時点で例外をスロー

[Answer]: B
また、場の最初の1枚と言ってますが、場の最後の1枚です。

#### Q5.4 シャッフルアルゴリズム
シャッフルアルゴリズムはどのように実装しますか？

**選択肢**:
- A: Fisher-Yates シャッフル
- B: ランダムソート（Array.sort with Math.random）
- C: 複数回のランダムスワップ

[Answer]: B

---

### セクション 6: ビジネスルール実装

#### Q6.1 カード操作ルール
カード操作ルール（同じ数字またはスート、複数枚出しは同じ数字）はどこで検証しますか？

**選択肢**:
- A: GameEngine 内で検証
- B: 専用の CardValidator クラスを作成
- C: フロントエンドで検証（バックエンドでは検証しない）

[Answer]: B

#### Q6.2 ドボン不可ルール
ドボン不可ルール（自分が直前に出したカードに対してはドボン不可、ただしドボン可能にすることもできるが、ルール違反で自動敗北）はどのように実装しますか？

**選択肢**:
- A: DoboDeclaration 内で検証し、ルール違反の場合は自動敗北処理
- B: GameEngine 内で検証し、ルール違反の場合は例外をスロー
- C: フロントエンドで検証（バックエンドでは検証しない）

[Answer]: B

#### Q6.3 バースト処理
バースト処理（手札が14枚になった時点で即敗北）はどのように実装しますか？

**選択肢**:
- A: GameEngine 内で自動的に検出して処理
- B: Player クラスが手札枚数を監視して通知
- C: ターン終了時に GameEngine が検証

[Answer]: B

---

### セクション 7: エラーハンドリング

#### Q7.1 無効なカード操作
無効なカード操作（場札の条件を満たさない、複数枚出しで異なる数字）はどのように処理しますか？

**選択肢**:
- A: 例外をスローしてクライアントに通知
- B: false を返してクライアントに通知
- C: エラーメッセージを返してクライアントに通知

[Answer]: B

#### Q7.2 無効なドボン宣言
無効なドボン宣言（演算式が場のカードと一致しない）はどのように処理しますか？

**選択肢**:
- A: ペナルティを適用（バースト時と同じ負け金を支払う）
- B: 例外をスローしてクライアントに通知
- C: false を返してクライアントに通知

[Answer]: C

#### Q7.3 ゲーム状態の不整合
ゲーム状態の不整合（例: 存在しないプレイヤーがターンを実行）はどのように処理しますか？

**選択肢**:
- A: 例外をスローしてゲームを終了
- B: ログに記録して無視
- C: ゲーム状態をリセット

[Answer]: A

---

### セクション 8: テスト戦略

#### Q8.1 ユニットテスト
ユニットテストはどのように実装しますか？

**選択肢**:
- A: Jest を使用して各クラスのメソッドをテスト
- B: Mocha + Chai を使用してテスト
- C: テストは実装しない（手動テストのみ）

[Answer]: A

#### Q8.2 テストカバレッジ
テストカバレッジの目標は何ですか？

**選択肢**:
- A: 80%以上
- B: 60%以上
- C: 特に目標なし（適当にテスト）

[Answer]: C

#### Q8.3 テストデータ
テストデータはどのように準備しますか？

**選択肢**:
- A: モックデータを手動で作成
- B: ファクトリーパターンでテストデータを生成
- C: 実際のゲームデータを使用

[Answer]: B

---

## 次のステップ

このプランの全ての質問に回答した後、以下の成果物を生成します：

1. **domain-entities.md**: バックエンドのドメインエンティティ定義
2. **business-logic-model.md**: ビジネスロジックモデル（GameEngine, DoboDeclaration, MultiplierCalculator, DeckManager）
3. **business-rules.md**: ビジネスルール詳細
4. **api-contracts.md**: API契約（REST API + WebSocket イベント）

---

## チェックリスト

- [x] セクション 1: ドメインモデル設計（2問）
- [x] セクション 2: GameEngine 設計（3問）
- [x] セクション 3: DoboDeclaration 設計（4問）
- [x] セクション 4: MultiplierCalculator 設計（3問）
- [x] セクション 5: DeckManager 設計（4問）
- [x] セクション 6: ビジネスルール実装（3問）
- [x] セクション 7: エラーハンドリング（3問）
- [x] セクション 8: テスト戦略（3問）

**合計**: 25問 / 全完了
