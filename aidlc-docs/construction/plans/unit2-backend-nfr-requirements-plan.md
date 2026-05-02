# NFR Requirements Plan - Unit 2 (Backend - Game Logic)

## プラン概要

**ユニット**: Unit 2 - Backend Game Logic  
**フェーズ**: CONSTRUCTION - NFR Requirements  
**目的**: バックエンドゲームロジック層の非機能要件とtech stack選定

---

## 参照すべき前工程の成果物

- `aidlc-docs/construction/unit2-backend/functional-design/domain-entities.md`
- `aidlc-docs/construction/unit2-backend/functional-design/business-logic-model.md`
- `aidlc-docs/construction/unit2-backend/functional-design/business-rules.md`
- `aidlc-docs/construction/unit2-backend/functional-design/api-contracts.md`
- `aidlc-docs/construction/unit1-frontend/nfr-requirements/nfr-requirements.md`（Unit 1 との整合性）

---

## 質問セクション

### セクション 1: ランタイム・フレームワーク

#### Q1.1 バックエンドランタイム
バックエンドのランタイムを選択してください。

**選択肢**:
- A: Node.js + TypeScript（Unit 1 と同じ言語、フロントエンドとコード共有可能）
- B: Node.js + JavaScript（TypeScript なし、シンプル）
- C: その他（具体的に記載）

[Answer]: A

#### Q1.2 バックエンドフレームワーク
Node.js のフレームワークを選択してください。

**選択肢**:
- A: Express.js（シンプル、軽量、実績豊富）
- B: Fastify（高速、TypeScript 対応が良好）
- C: NestJS（フルスタック、TypeScript ファースト、学習コスト高め）
- D: フレームワークなし（素の Node.js http モジュール）

[Answer]: A

---

### セクション 2: WebSocket 実装

#### Q2.1 WebSocket ライブラリ
リアルタイム通信の実装方法を選択してください。

**選択肢**:
- A: Socket.io（Unit 1 フロントエンドと同じライブラリ、自動再接続・フォールバック対応）
- B: ws（軽量な WebSocket ライブラリ、低レベル）
- C: Firebase Realtime Database（インフラ設計で検討済み、サーバーレス）

[Answer]: A

#### Q2.2 WebSocket の接続管理
複数ゲームセッションの WebSocket 接続をどのように管理しますか？

**選択肢**:
- A: ルームごとに Socket.io Room を使用（標準的な方法）
- B: セッションIDをキーにした Map で管理
- C: Firebase の接続管理に任せる

[Answer]: C

---

### セクション 3: パフォーマンス要件

#### Q3.1 ゲームロジックの処理時間
ゲームロジック（カード操作検証、ドボン演算式計算）の処理時間の目標はありますか？

**選択肢**:
- A: 100ms 以内（Unit 1 のドボン宣言 500ms 目標に対して余裕を持たせる）
- B: 200ms 以内（十分な余裕）
- C: 特に目標なし（POC レベルなので気にしない）

[Answer]: C

#### Q3.2 返しドボン判定のタイムアウト処理
10秒のタイムアウト処理はサーバー側で管理します。タイムアウト実装方法の希望はありますか？

**選択肢**:
- A: setTimeout で各セッションごとに管理（シンプル）
- B: setInterval で定期的にチェック（一括管理）
- C: どちらでも良い

[Answer]: C

---

### セクション 4: データ管理

#### Q4.1 ゲームセッションのメモリ管理
ゲームセッションはメモリのみで管理します（Functional Design で決定済み）。サーバー再起動時の扱いはどうしますか？

**選択肢**:
- A: セッションは消える（再起動したらゲームリセット、POC レベルで許容）
- B: 簡易的なファイル永続化（JSON ファイルに保存）
- C: Redis などのインメモリDBを使用

[Answer]: A

#### Q4.2 同時ゲームセッション数
同時に進行するゲームセッション数の想定はありますか？

**選択肢**:
- A: 1セッションのみ（チームメイト全員で1ゲーム）
- B: 2〜3セッション（複数グループが同時プレイ）
- C: 特に制限なし

[Answer]: A

---

### セクション 5: セキュリティ・認証

#### Q5.1 API 認証
バックエンド API の認証方法を選択してください。

**選択肢**:
- A: JWT トークン（Unit 1 インフラ設計で決定済み、ゲストIDベース）
- B: セッションID のみ（シンプル、JWT なし）
- C: 認証なし（POC レベル、チームメイトのみ）

[Answer]: C

#### Q5.2 入力バリデーション
クライアントからの入力バリデーションの厳密さはどの程度にしますか？

**選択肢**:
- A: 厳密に検証（全パラメータを型・範囲チェック）
- B: 最低限の検証（必須パラメータの存在確認のみ）
- C: 検証なし（POC レベル、信頼ベース）

[Answer]: B

---

### セクション 6: エラーハンドリング・ログ

#### Q6.1 サーバーサイドログ
サーバーサイドのログ出力レベルを選択してください。

**選択肢**:
- A: 詳細ログ（全ゲームイベント、デバッグ情報、エラー）
- B: 標準ログ（エラーと主要イベントのみ）
- C: エラーログのみ

[Answer]: A

#### Q6.2 ログの保存先
ログの保存先を選択してください。

**選択肢**:
- A: コンソール出力のみ（POC レベル）
- B: ファイル出力（ローカルファイル）
- C: コンソール + ファイル

[Answer]: D
インフラの仕組みがよくわからないのですが、ログを取得できれば何でもよいです。

---

### セクション 7: デプロイ・インフラ

#### Q7.1 バックエンドのホスティング
バックエンドのホスティング先を選択してください。

**選択肢**:
- A: Heroku（簡単、無料枠あり、WebSocket 対応）
- B: Railway（Heroku の代替、簡単、無料枠あり）
- C: Render（無料枠あり、WebSocket 対応）
- D: AWS EC2（Unit 1 インフラ設計で言及済み、柔軟だが設定が複雑）
- E: ローカル実行のみ（デプロイしない、開発・テスト用）

[Answer]: A

#### Q7.2 ポート・環境設定
開発環境のポート番号の希望はありますか？

**選択肢**:
- A: 3000（Node.js の標準）
- B: 8080（一般的なバックエンドポート）
- C: どちらでも良い

[Answer]: C

---

### セクション 8: テスト戦略

#### Q8.1 テストフレームワーク
バックエンドのテストフレームワークを選択してください（Functional Design で Jest と決定済み）。

**選択肢**:
- A: Jest（決定済み、確認）
- B: Vitest（Unit 1 と統一、Vite 環境で動作）
- C: どちらでも良い

[Answer]: A

#### Q8.2 テスト対象の優先度
テストを書く優先度が高いコンポーネントはどれですか？

**選択肢**:
- A: ゲームロジック全体（GameEngine, DoboDeclaration, MultiplierCalculator, DeckManager）
- B: ビジネスルールのみ（CardValidator, PaymentCalculator）
- C: ドボン演算式計算のみ（最も複雑なロジック）
- D: 特になし（手動テストのみ）

[Answer]: A

---

## 次のステップ

このプランの全ての質問に回答した後、以下の成果物を生成します：

1. **nfr-requirements.md**: バックエンドの非機能要件定義
2. **tech-stack-decisions.md**: 技術スタック選定理由

---

## チェックリスト

- [x] セクション 1: ランタイム・フレームワーク（2問）
- [x] セクション 2: WebSocket 実装（2問）
- [x] セクション 3: パフォーマンス要件（2問）
- [x] セクション 4: データ管理（2問）
- [x] セクション 5: セキュリティ・認証（2問）
- [x] セクション 6: エラーハンドリング・ログ（2問）
- [x] セクション 7: デプロイ・インフラ（2問）
- [x] セクション 8: テスト戦略（2問）

**合計**: 16問
