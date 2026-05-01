# Unit of Work Story Map - ドボンゲーム

## ストーリーのユニットマッピング

このドキュメントでは、ゲーム要件をユニット別にマッピングします。

---

## Unit 1: フロントエンド

### 責務
- ゲーム画面の実装
- ロビー・ルーム管理画面の実装
- プロフィール・統計画面の実装
- ユーザーインタラクション処理
- 状態管理

### 関連する要件

#### ゲームプレイ機能
- [ ] ゲーム盤面の表示（場札、プレイヤー手札、ターン情報）
- [ ] カード操作UI（カード選択、カード出す、山札から引く）
- [ ] ドボン宣言UI（演算式選択）
- [ ] 返しドボン判定UI（返すか返さないかの選択）
- [ ] 支払い画面（山札からのランダムカード引き、支払い金額表示）

#### ゲームロビー・マッチング
- [ ] ロビー画面（ルーム一覧、ルーム作成）
- [ ] ルーム画面（プレイヤー一覧、基本レート設定、ゲーム開始）

#### ユーザー管理
- [ ] ゲストログイン画面
- [ ] プロフィール画面（ユーザー情報表示・編集）

#### ゲーム履歴・統計
- [ ] 統計情報画面（ゲーム履歴、統計情報、ランキング）

### 主要なコンポーネント
- GameBoard
- CardHand
- DoboDeclarationUI
- ReturnDoboUI
- PaymentUI
- LobbyScreen
- RoomScreen
- ProfileScreen
- StatisticsScreen

### 技術スタック
- Vue.js 3 / React
- TypeScript
- Tailwind CSS / Material-UI
- Pinia / Redux
- Socket.io クライアント

---

## Unit 2: ゲームロジック

### 責務
- ゲーム進行管理
- ドボン宣言ロジック
- 倍率計算ロジック
- 山札管理

### 関連する要件

#### ゲームプレイ機能
- [ ] ゲーム開始時の初期化（手札配布、初期場札決定）
- [ ] ターン進行管理
- [ ] カード操作（カードを出す、山札から引く）
- [ ] 特殊カード効果（A、2、8、J、K）
- [ ] ドボン宣言の検証（演算式検証、返し判定）
- [ ] 倍率計算（初期A、引きドボン、オープンドボン、返しドボン、山札再生成）
- [ ] 支払い金額計算
- [ ] バースト判定
- [ ] 山札再生成

### 主要なコンポーネント
- GameEngine
- DoboDeclaration
- MultiplierCalculator
- DeckManager

### 技術スタック
- Node.js + TypeScript
- Express.js / Nest.js
- Jest（テスト）

---

## Unit 3: ユーザー管理

### 責務
- ユーザー認証
- ゲストID管理
- プロフィール管理

### 関連する要件

#### ユーザー管理
- [ ] ゲストユーザー作成（新規ID生成）
- [ ] ゲストユーザー再利用（既存ID入力）
- [ ] ユーザー情報取得
- [ ] ユーザー情報更新（ユーザー名、アバター、自己紹介）

### 主要なコンポーネント
- UserService
- GuestManager
- ProfileManager

### 技術スタック
- Node.js + TypeScript
- Express.js / Nest.js
- Jest（テスト）

---

## Unit 4: ゲーム履歴・統計

### 責務
- ゲーム履歴管理
- 統計情報管理
- ランキング管理

### 関連する要件

#### ゲーム履歴・統計
- [ ] ゲーム結果の保存（ゲーム日時、参加プレイヤー、結果、獲得/支払い金額）
- [ ] ゲーム履歴の取得・表示
- [ ] 統計情報の計算・取得（総ゲーム数、勝利数、敗北数、勝率、総獲得金額、総支払金額、平均獲得金額、最高倍率）
- [ ] ランキング情報の計算・取得（総獲得金額ランキング）

### 主要なコンポーネント
- GameHistoryService
- StatisticsService
- RankingService

### 技術スタック
- Node.js + TypeScript
- Express.js / Nest.js
- Jest（テスト）

---

## Unit 5: ルーム管理

### 責務
- ルーム管理
- ゲームセッション管理

### 関連する要件

#### ゲームロビー・マッチング
- [ ] ルーム作成（ルームコード生成）
- [ ] ルーム参加
- [ ] ルーム退出
- [ ] ルーム削除
- [ ] ルーム一覧取得
- [ ] 基本レート設定
- [ ] ゲーム開始

### 主要なコンポーネント
- RoomManager
- GameSessionManager

### 技術スタック
- Node.js + TypeScript
- Express.js / Nest.js
- Jest（テスト）

---

## Unit 6: バックエンド統合

### 責務
- サービス層のオーケストレーション
- REST API エンドポイント定義
- WebSocket通信管理
- データベース接続管理
- エラーハンドリング

### 関連する要件

#### すべての機能
- [ ] REST API エンドポイント実装
- [ ] WebSocket メッセージハンドリング
- [ ] ゲーム状態のリアルタイム同期
- [ ] エラーハンドリング
- [ ] ロギング
- [ ] 認証・認可

### 主要なコンポーネント
- GameService
- UserService
- HistoryService
- RoomService
- WebSocketHandler
- Repository（GameRepository, UserRepository, HistoryRepository）

### 技術スタック
- Node.js + TypeScript
- Express.js / Nest.js
- Socket.io
- PostgreSQL / MongoDB
- Jest（テスト）

---

## ユニット別の実装順序

### 推奨実装順序

1. **Unit 1: フロントエンド** (1-2日)
   - UI/UXコンポーネント実装
   - 状態管理ストア実装
   - モックAPI通信実装

2. **Unit 2: ゲームロジック** (2-3日)
   - GameEngine実装
   - DoboDeclaration実装
   - MultiplierCalculator実装
   - DeckManager実装
   - ユニットテスト

3. **Unit 3: ユーザー管理** (1日)
   - UserService実装
   - GuestManager実装
   - ProfileManager実装
   - ユニットテスト

4. **Unit 4: ゲーム履歴・統計** (1-2日)
   - GameHistoryService実装
   - StatisticsService実装
   - RankingService実装
   - ユニットテスト

5. **Unit 5: ルーム管理** (1日)
   - RoomManager実装
   - GameSessionManager実装
   - ユニットテスト

6. **Unit 6: バックエンド統合** (2-3日)
   - サービス層実装
   - WebSocketHandler実装
   - REST API実装
   - 統合テスト
   - フロントエンド統合テスト

**総開発期間**: 8-12日（1-2週間）

---

## ユニット間の統合ポイント

### Unit 1 ↔ Unit 6 統合

#### REST API 統合
- ユーザー管理API
- ゲーム履歴・統計API
- ルーム管理API

#### WebSocket 統合
- ゲーム状態更新
- ドボン宣言
- 返しドボン判定
- 支払い情報
- ルーム情報更新

### Unit 2 ↔ Unit 6 統合

#### メソッド呼び出し
- GameService が GameEngine を呼び出し
- GameService が DoboDeclaration を呼び出し
- GameService が MultiplierCalculator を呼び出し
- GameService が DeckManager を呼び出し

#### WebSocket 通知
- ゲーム状態更新をクライアントに通知
- ドボン宣言結果をクライアントに通知
- 支払い情報をクライアントに通知

### Unit 3 ↔ Unit 6 統合

#### REST API 統合
- ゲストユーザー作成API
- ユーザー情報取得API
- ユーザー情報更新API

### Unit 4 ↔ Unit 6 統合

#### REST API 統合
- ゲーム履歴取得API
- 統計情報取得API
- ランキング取得API

### Unit 5 ↔ Unit 6 統合

#### REST API 統合
- ルーム作成API
- ルーム一覧取得API
- ルーム参加API
- ゲーム開始API

#### WebSocket 通知
- ルーム参加通知
- ルーム退出通知
- ゲーム開始通知

---

## テスト戦略

### Unit 1: フロントエンド テスト
- [ ] コンポーネントユニットテスト
- [ ] 状態管理ストアテスト
- [ ] E2Eテスト

### Unit 2: ゲームロジック テスト
- [ ] GameEngine ユニットテスト
- [ ] DoboDeclaration ユニットテスト
- [ ] MultiplierCalculator ユニットテスト
- [ ] DeckManager ユニットテスト

### Unit 3: ユーザー管理 テスト
- [ ] UserService ユニットテスト
- [ ] GuestManager ユニットテスト
- [ ] ProfileManager ユニットテスト

### Unit 4: ゲーム履歴・統計 テスト
- [ ] GameHistoryService ユニットテスト
- [ ] StatisticsService ユニットテスト
- [ ] RankingService ユニットテスト

### Unit 5: ルーム管理 テスト
- [ ] RoomManager ユニットテスト
- [ ] GameSessionManager ユニットテスト

### Unit 6: バックエンド統合 テスト
- [ ] REST API 統合テスト
- [ ] WebSocket 統合テスト
- [ ] エンドツーエンドテスト

---

## 次のステップ

1. **Unit 1 (フロントエンド)** の Functional Design
2. **Unit 2-5 (バックエンドユニット)** の Functional Design
3. **Unit 6 (バックエンド統合)** の Functional Design
4. 各ユニットの NFR Requirements / NFR Design / Infrastructure Design
5. 各ユニットの Code Generation
6. Build and Test

