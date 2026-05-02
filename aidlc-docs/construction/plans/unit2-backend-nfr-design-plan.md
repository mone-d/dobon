# NFR Design Plan - Unit 2 (Backend - Game Logic)

## プラン概要

**ユニット**: Unit 2 - Backend Game Logic  
**フェーズ**: CONSTRUCTION - NFR Design  
**目的**: NFR要件をバックエンド設計に組み込む（レジリエンスパターン、論理コンポーネント）

---

## 参照すべき前工程の成果物

- `aidlc-docs/construction/unit2-backend/nfr-requirements/nfr-requirements.md`
- `aidlc-docs/construction/unit2-backend/nfr-requirements/tech-stack-decisions.md`
- `aidlc-docs/construction/unit2-backend/functional-design/business-logic-model.md`
- `aidlc-docs/construction/unit1-frontend/nfr-design/nfr-design-patterns.md`（Unit 1 との整合性）

---

## 質問セクション

### セクション 1: レジリエンスパターン

#### Q1.1 クライアント再接続時のゲーム状態復元
クライアントが再接続した時、ゲーム状態をどのように復元しますか？

**選択肢**:
- A: 再接続時に現在の GameState を自動送信（セッションIDで識別）
- B: クライアントが明示的に状態取得リクエストを送信
- C: どちらでも良い

[Answer]: C

#### Q1.2 サーバーエラー発生時の処理
ゲームロジック内で予期しないエラーが発生した場合の処理を選択してください。

**選択肢**:
- A: エラーログを出力し、全プレイヤーに `game:error` を送信してセッション終了
- B: エラーログを出力し、ゲームを継続（エラーを無視）
- C: エラーログを出力し、ゲーム状態をリセットして再開

[Answer]: A

---

### セクション 2: スケーラビリティパターン

#### Q2.1 ゲームセッションの管理方法
メモリ上のゲームセッション管理方法を選択してください。

**選択肢**:
- A: `Map<sessionId, GameSession>` でシンプルに管理
- B: クラスベースのセッションマネージャーを作成
- C: どちらでも良い

[Answer]: C

#### Q2.2 Socket.io の接続管理
Socket.io の接続とゲームセッションの紐付け方法を選択してください。

**選択肢**:
- A: Socket.io Room 機能（`socket.join(roomId)`）でルームごとに管理
- B: `Map<socketId, playerId>` で個別に管理
- C: 両方を組み合わせる（Room + Map）

[Answer]: どっちでもよい

---

### セクション 3: パフォーマンスパターン

#### Q3.1 ゲームイベントの送信方式
ゲーム状態更新時のクライアントへの送信方式を選択してください。

**選択肢**:
- A: 差分のみ送信（変更されたフィールドのみ）
- B: 全状態を毎回送信（シンプル、POCレベルに適切）
- C: イベント種別に応じて使い分け

[Answer]: B

---

### セクション 4: セキュリティパターン

#### Q4.1 CORS 設定
本番環境での CORS 設定を選択してください。

**選択肢**:
- A: Vercel のフロントエンドドメインのみ許可
- B: 全オリジン許可（`*`）、POCレベルで許容
- C: 開発・本番ともに全オリジン許可

[Answer]: C

---

### セクション 5: 論理コンポーネント

#### Q5.1 ロガーの実装方式
サーバーサイドのロガー実装を選択してください。

**選択肢**:
- A: シンプルなラッパー関数（`console.log` をラップ）
- B: クラスベースのロガー（ログレベル管理）
- C: どちらでも良い

[Answer]: B

#### Q5.2 WebSocket イベントハンドラーの構造
Socket.io のイベントハンドラーをどのように構造化しますか？

**選択肢**:
- A: 単一ファイルに全イベントハンドラーをまとめる
- B: イベントカテゴリごとにファイルを分割（game/, room/ 等）
- C: どちらでも良い

[Answer]: C

---

## 次のステップ

このプランの全ての質問に回答した後、以下の成果物を生成します：

1. **nfr-design-patterns.md**: バックエンドの NFR デザインパターン
2. **logical-components.md**: 論理コンポーネント定義

---

## チェックリスト

- [x] セクション 1: レジリエンスパターン（2問）
- [x] セクション 2: スケーラビリティパターン（2問）
- [x] セクション 3: パフォーマンスパターン（1問）
- [x] セクション 4: セキュリティパターン（1問）
- [x] セクション 5: 論理コンポーネント（2問）

**合計**: 8問
