# Application Design Plan - ドボンゲーム

## 設計スコープ

このドキュメントでは、ドボンゲームのシステム全体のコンポーネント設計、サービス層設計、コンポーネント間の依存関係を定義します。

詳細なビジネスロジックは、後の Functional Design フェーズで定義されます。

---

## 設計計画

### [ ] 1. コンポーネント識別

#### 1.1 バックエンド コンポーネント

**Q1.1.1: ゲームロジック コンポーネントの分割**

ゲームロジックを以下のように分割することを提案します：

A) **GameEngine** - ゲーム進行管理（ターン管理、カード操作、特殊カード効果）
B) **DoboDeclaration** - ドボン宣言ロジック（演算式検証、返し判定）
C) **MultiplierCalculator** - 倍率計算ロジック
D) **DeckManager** - 山札管理（カード配布、山札再生成）

これらを個別のコンポーネントに分割するか、GameEngine に統合するか、どちらが良いですか？

[Answer]: いい分割だと思います。

---

**Q1.1.2: ユーザー管理 コンポーネント**

ユーザー管理に関して、以下のコンポーネントが必要と考えられます：

A) **UserService** - ユーザー認証、プロフィール管理
B) **GuestManager** - ゲストID管理（新規生成、既存ID再利用）
C) **ProfileManager** - プロフィール情報管理（ユーザー名、アバター、自己紹介）

これらを個別のコンポーネントに分割するか、UserService に統合するか、どちらが良いですか？

[Answer]: 分割しましょう。

---

**Q1.1.3: ゲーム履歴・統計 コンポーネント**

ゲーム履歴・統計に関して、以下のコンポーネントが必要と考えられます：

A) **GameHistoryService** - ゲーム履歴の保存・取得
B) **StatisticsService** - 統計情報の計算・取得
C) **RankingService** - ランキング情報の計算・取得

これらを個別のコンポーネントに分割するか、統合するか、どちらが良いですか？

[Answer]: 分割しましょう。ランキングを出すために統計を参照するなど依存があるイメージです。

---

**Q1.1.4: ルーム管理 コンポーネント**

ルーム管理に関して、以下のコンポーネントが必要と考えられます：

A) **RoomManager** - ルーム作成、参加、削除
B) **GameSessionManager** - ゲームセッション管理（ゲーム開始、進行、終了）

これらを個別のコンポーネントに分割するか、統合するか、どちらが良いですか？

[Answer]: 分割。

---

#### 1.2 フロントエンド コンポーネント

**Q1.2.1: ゲーム画面 コンポーネント**

ゲーム画面を以下のように分割することを提案します：

A) **GameBoard** - ゲーム盤面（場札、プレイヤー手札、ターン情報）
B) **CardHand** - プレイヤーの手札表示・操作
C) **DoboDeclarationUI** - ドボン宣言UI（演算式選択）
D) **ReturnDoboUI** - 返しドボン判定UI（返すか返さないかの選択）
E) **PaymentUI** - 支払い画面（山札からのランダムカード引き、支払い金額表示）

これらを個別のコンポーネントに分割するか、GameBoard に統合するか、どちらが良いですか？

[Answer]: 分割

---

**Q1.2.2: ロビー・ルーム管理 画面**

ロビー・ルーム管理画面を以下のように分割することを提案します：

A) **LobbyScreen** - ロビー画面（ルーム一覧、ルーム作成）
B) **RoomScreen** - ルーム画面（プレイヤー一覧、基本レート設定、ゲーム開始）

これらを個別のコンポーネントに分割するか、統合するか、どちらが良いですか？

[Answer]: 分割

---

**Q1.2.3: プロフィール・統計 画面**

プロフィール・統計画面を以下のように分割することを提案します：

A) **ProfileScreen** - プロフィール画面（ユーザー情報表示・編集）
B) **StatisticsScreen** - 統計情報画面（ゲーム履歴、統計情報、ランキング）

これらを個別のコンポーネントに分割するか、統合するか、どちらが良いですか？

[Answer]: 分割

---

### [ ] 2. コンポーネント メソッド設計

**Q2.1: ゲームロジック メソッド**

ゲームロジックのメソッド設計について、以下の方針を提案します：

- **GameEngine**: startGame(), playCard(), drawCard(), skipTurn(), reverseTurn(), openHand()
- **DoboDeclaration**: validateFormula(), declareDobo(), checkReturn(), determineWinner()
- **MultiplierCalculator**: calculateMultiplier(), addMultiplier()
- **DeckManager**: initializeDeck(), drawCard(), reshuffleDeck()

これらのメソッド設計で問題ありませんか？追加・削除・変更が必要な部分はありますか？

[Answer]: 大丈夫そう。

---

**Q2.2: ユーザー管理 メソッド**

ユーザー管理のメソッド設計について、以下の方針を提案します：

- **UserService**: createGuest(), getUser(), updateProfile()
- **GuestManager**: generateGuestId(), reuseGuestId()
- **ProfileManager**: getProfile(), updateProfile()

これらのメソッド設計で問題ありませんか？追加・削除・変更が必要な部分はありますか？

[Answer]: 大丈夫そう。

---

**Q2.3: ゲーム履歴・統計 メソッド**

ゲーム履歴・統計のメソッド設計について、以下の方針を提案します：

- **GameHistoryService**: saveGameResult(), getGameHistory()
- **StatisticsService**: calculateStatistics(), getStatistics()
- **RankingService**: calculateRanking(), getRanking()

これらのメソッド設計で問題ありませんか？追加・削除・変更が必要な部分はありますか？

[Answer]: 大丈夫そう。

---

### [ ] 3. サービス層設計

**Q3.1: サービス層の構成**

サービス層を以下のように構成することを提案します：

- **GameService** - ゲーム進行の全体的なオーケストレーション
- **UserService** - ユーザー管理のオーケストレーション
- **HistoryService** - ゲーム履歴・統計のオーケストレーション
- **RoomService** - ルーム管理のオーケストレーション

これらのサービスで十分ですか？追加・削除・変更が必要なサービスはありますか？

[Answer]: 十分。

---

**Q3.2: サービス間の通信パターン**

サービス間の通信パターンについて、以下の方針を提案します：

- **GameService** → **GameEngine**, **DoboDeclaration**, **MultiplierCalculator**, **DeckManager**
- **GameService** → **HistoryService** (ゲーム結果保存)
- **RoomService** → **GameService** (ゲーム開始)
- **UserService** → **ProfileManager** (プロフィール管理)

これらの通信パターンで問題ありませんか？変更が必要な部分はありますか？

[Answer]: 良い。

---

### [ ] 4. コンポーネント依存関係

**Q4.1: 依存関係の方向性**

コンポーネント依存関係の方向性について、以下の方針を提案します：

- **上位層**: Service層（GameService, UserService, HistoryService, RoomService）
- **中位層**: ビジネスロジック層（GameEngine, DoboDeclaration, MultiplierCalculator, DeckManager, UserService, ProfileManager）
- **下位層**: データアクセス層（Repository層 - GameRepository, UserRepository, HistoryRepository）

依存関係は上位層から下位層への一方向とします。

この方針で問題ありませんか？変更が必要な部分はありますか？

[Answer]: 良い。

---

**Q4.2: リアルタイム通信の統合**

リアルタイム通信（WebSocket）について、以下の方針を提案します：

- **WebSocketHandler** - WebSocket接続管理、メッセージ送受信
- **GameService** が **WebSocketHandler** を使用してクライアントに状態更新を送信
- クライアント側の **Socket.io** が **WebSocketHandler** からのメッセージを受信

この方針で問題ありませんか？変更が必要な部分はありますか？

[Answer]: 良い。

---

### [ ] 5. 設計の完全性と一貫性の検証

**Q5.1: 設計の完全性**

以下の項目について、設計が完全であることを確認してください：

- [ ] すべてのコンポーネントが識別されている
- [ ] すべてのコンポーネントのメソッドが定義されている
- [ ] すべてのサービスが定義されている
- [ ] すべてのコンポーネント依存関係が定義されている
- [ ] リアルタイム通信の統合が定義されている

設計に不足している部分はありますか？

[Answer]: OK

---

**Q5.2: 設計の一貫性**

以下の項目について、設計の一貫性を確認してください：

- [ ] コンポーネント間の依存関係に循環参照がない
- [ ] サービス層がビジネスロジック層を正しくオーケストレーションしている
- [ ] データアクセス層が正しく分離されている
- [ ] リアルタイム通信が適切に統合されている

設計に矛盾している部分はありますか？

[Answer]: OK

---

## 設計計画の実行

上記のすべての質問に回答いただければ、以下の設計成果物を生成します：

1. **components.md** - コンポーネント定義と責務
2. **component-methods.md** - メソッドシグネチャ
3. **services.md** - サービス定義とオーケストレーション
4. **component-dependency.md** - 依存関係とデータフロー
5. **application-design.md** - 統合設計ドキュメント

