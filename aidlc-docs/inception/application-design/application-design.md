# Application Design - ドボンゲーム統合設計ドキュメント

## 1. 設計概要

### 1.1 設計目標

ドボンゲームのオンライン対戦システムを、以下の原則に基づいて設計します：

- **関心の分離**: 各コンポーネントが単一の責務を持つ
- **再利用性**: コンポーネントの再利用を最大化
- **テスト容易性**: 各コンポーネントを独立してテスト可能
- **保守性**: ビジネスロジックの変更が容易
- **スケーラビリティ**: 新しい機能の追加が容易

### 1.2 アーキテクチャスタイル

**層状アーキテクチャ** を採用します：

```
API層 / フロントエンド層
    ↓
サービス層
    ↓
ビジネスロジック層
    ↓
データアクセス層
    ↓
データベース層
```

---

## 2. コンポーネント構成

### 2.1 バックエンド コンポーネント（13個）

#### ゲームロジック層（4個）
1. **GameEngine** - ゲーム進行管理
2. **DoboDeclaration** - ドボン宣言ロジック
3. **MultiplierCalculator** - 倍率計算
4. **DeckManager** - 山札管理

#### ユーザー管理層（3個）
5. **UserService** - ユーザー認証・管理
6. **GuestManager** - ゲストID管理
7. **ProfileManager** - プロフィール管理

#### ゲーム履歴・統計層（3個）
8. **GameHistoryService** - ゲーム履歴管理
9. **StatisticsService** - 統計情報管理
10. **RankingService** - ランキング管理

#### ルーム管理層（2個）
11. **RoomManager** - ルーム管理
12. **GameSessionManager** - ゲームセッション管理

#### リアルタイム通信層（1個）
13. **WebSocketHandler** - WebSocket通信管理

### 2.2 フロントエンド コンポーネント（9個）

#### ゲーム画面（5個）
14. **GameBoard** - ゲーム盤面
15. **CardHand** - 手札表示・操作
16. **DoboDeclarationUI** - ドボン宣言UI
17. **ReturnDoboUI** - 返しドボン判定UI
18. **PaymentUI** - 支払い画面

#### ロビー・ルーム管理画面（2個）
19. **LobbyScreen** - ロビー画面
20. **RoomScreen** - ルーム画面

#### プロフィール・統計画面（2個）
21. **ProfileScreen** - プロフィール画面
22. **StatisticsScreen** - 統計情報画面

---

## 3. サービス層設計

### 3.1 サービス構成（4個）

1. **GameService** - ゲーム進行のオーケストレーション
2. **UserService** - ユーザー管理のオーケストレーション
3. **HistoryService** - ゲーム履歴・統計のオーケストレーション
4. **RoomService** - ルーム管理のオーケストレーション

### 3.2 サービス間の通信パターン

```
GameService
  ├─ GameEngine, DoboDeclaration, MultiplierCalculator, DeckManager
  ├─ GameHistoryService (ゲーム結果保存)
  └─ WebSocketHandler (クライアント通知)

UserService
  ├─ GuestManager, ProfileManager
  └─ UserRepository

HistoryService
  ├─ GameHistoryService, StatisticsService, RankingService
  └─ HistoryRepository

RoomService
  ├─ RoomManager, GameSessionManager
  ├─ GameService (ゲーム開始)
  └─ WebSocketHandler (クライアント通知)
```

---

## 4. 依存関係設計

### 4.1 層状依存関係

```
API層 / フロントエンド層
    ↓ (REST API, WebSocket)
サービス層 (GameService, UserService, HistoryService, RoomService)
    ↓
ビジネスロジック層 (GameEngine, DoboDeclaration, etc.)
    ↓
データアクセス層 (Repository)
    ↓
データベース層 (PostgreSQL / MongoDB)
```

### 4.2 依存関係の原則

1. **上位層から下位層への一方向依存**
   - 下位層が上位層に依存しない

2. **同一層内での依存は最小限**
   - サービス層内のサービス間依存は許可（オーケストレーション）
   - ビジネスロジック層内のコンポーネント間依存は許可（機能分割）

3. **循環依存の禁止**
   - すべての循環依存を排除

### 4.3 依存関係の複雑度

- **平均依存数**: 0.77（低い）
- **最大依存数**: 2（GameEngine）
- **循環依存**: なし ✓

---

## 5. リアルタイム通信設計

### 5.1 WebSocket通信アーキテクチャ

```
クライアント (Socket.io)
    ↔ WebSocketHandler
      ├─ GameService (ゲーム状態更新)
      ├─ RoomService (ルーム情報更新)
      └─ UserService (ユーザー情報更新)
```

### 5.2 メッセージタイプ

| メッセージタイプ | 説明 | 送信元 |
|---|---|---|
| game:state | ゲーム状態更新 | GameService |
| game:dobo | ドボン宣言 | GameService |
| game:return | 返しドボン判定 | GameService |
| game:payment | 支払い情報 | GameService |
| room:join | ルーム参加 | RoomService |
| room:leave | ルーム退出 | RoomService |
| room:start | ゲーム開始 | RoomService |
| user:update | ユーザー情報更新 | UserService |

### 5.3 通信フロー例

#### ゲーム開始時

```
1. クライアント (RoomScreen) → RoomService.startGame()
2. RoomService → GameSessionManager.createGameSession()
3. GameSessionManager → GameService.startGame()
4. GameService → GameEngine.startGame()
5. GameService → DeckManager.initializeDeck()
6. GameService → DeckManager.dealCards()
7. GameService → WebSocketHandler.broadcastMessage('game:state')
8. WebSocketHandler → クライアント (GameBoard) - ゲーム状態受信
```

#### ドボン宣言時

```
1. クライアント (DoboDeclarationUI) → GameService.declareDobo()
2. GameService → DoboDeclaration.declareDobo()
3. GameService → DoboDeclaration.checkReturn()
4. GameService → MultiplierCalculator.calculatePayment()
5. GameService → GameHistoryService.saveGameResult()
6. GameService → StatisticsService.updateStatistics()
7. GameService → RankingService.updateRanking()
8. GameService → WebSocketHandler.broadcastMessage('game:payment')
9. WebSocketHandler → クライアント (PaymentUI) - 支払い情報受信
```

---

## 6. データフロー設計

### 6.1 ゲーム開始時のデータフロー

```
クライアント (RoomScreen)
  ↓ startGame()
RoomService
  ↓ createGameSession()
GameSessionManager
  ↓ startGame()
GameService
  ├─ GameEngine.startGame()
  │   ├─ DeckManager.initializeDeck()
  │   └─ DeckManager.dealCards()
  └─ WebSocketHandler.broadcastMessage()
  ↓
クライアント (GameBoard) - ゲーム状態受信
```

### 6.2 ドボン宣言時のデータフロー

```
クライアント (DoboDeclarationUI)
  ↓ declareDobo()
GameService
  ├─ DoboDeclaration.declareDobo()
  ├─ DoboDeclaration.checkReturn()
  ├─ MultiplierCalculator.calculatePayment()
  ├─ GameHistoryService.saveGameResult()
  ├─ StatisticsService.updateStatistics()
  ├─ RankingService.updateRanking()
  └─ WebSocketHandler.broadcastMessage()
  ↓
クライアント (PaymentUI) - 支払い情報受信
```

### 6.3 ゲーム履歴・統計取得時のデータフロー

```
クライアント (StatisticsScreen)
  ↓ getStatistics()
HistoryService
  ├─ GameHistoryService.getGameHistory()
  ├─ StatisticsService.getStatistics()
  ├─ RankingService.getRanking()
  └─ HistoryRepository.query()
  ↓
クライアント (StatisticsScreen) - 統計情報表示
```

---

## 7. インターフェース設計

### 7.1 コンポーネント インターフェース

各コンポーネントは明確なインターフェースを定義し、実装詳細を隠蔽します。

```typescript
// GameEngine インターフェース
interface IGameEngine {
  startGame(players: Player[], baseRate: number): GameState;
  playCard(playerId: string, cards: Card[]): boolean;
  drawCard(playerId: string): Card;
  skipTurn(playerId: string): void;
  reverseTurn(): void;
  openHand(playerId: string): void;
  getCurrentPlayer(): Player;
  getNextPlayer(): Player;
  endTurn(): void;
  checkGameEnd(): boolean;
  getWinner(): Player | null;
}

// DoboDeclaration インターフェース
interface IDoboDeclaration {
  declareDobo(playerId: string, formula: string, cards: Card[]): DoboResult;
  validateFormula(formula: string, cards: Card[], targetValue: number): boolean;
  checkReturn(playerId: string): boolean;
  declareReturn(playerId: string, formula: string, cards: Card[]): DoboResult;
  determineWinner(doboDeclarations: DoboDeclaration[]): Player;
}

// ... その他のコンポーネント
```

### 7.2 サービス インターフェース

```typescript
// GameService インターフェース
interface IGameService {
  startGame(players: Player[], baseRate: number): GameSession;
  playCard(sessionId: string, playerId: string, cards: Card[]): void;
  drawCard(sessionId: string, playerId: string): void;
  declareDobo(sessionId: string, playerId: string, formula: string, cards: Card[]): void;
  declareReturn(sessionId: string, playerId: string, formula: string, cards: Card[]): void;
  endGame(sessionId: string, winner: Player): void;
  getGameState(sessionId: string): GameState;
}

// ... その他のサービス
```

---

## 8. 依存性注入設計

### 8.1 依存性注入パターン

サービス層がビジネスロジック層のコンポーネントを注入します。

```typescript
class GameService implements IGameService {
  constructor(
    private gameEngine: IGameEngine,
    private doboDeclaration: IDoboDeclaration,
    private multiplierCalculator: IMultiplierCalculator,
    private deckManager: IDeckManager,
    private gameHistoryService: IGameHistoryService,
    private webSocketHandler: IWebSocketHandler
  ) {}

  startGame(players: Player[], baseRate: number): GameSession {
    // GameEngine を使用
    const gameState = this.gameEngine.startGame(players, baseRate);
    // ...
  }
}
```

### 8.2 コンテナ設定

```typescript
// IoC コンテナ設定
const container = new Container();

// ビジネスロジック層
container.bind<IGameEngine>('GameEngine').to(GameEngine);
container.bind<IDoboDeclaration>('DoboDeclaration').to(DoboDeclaration);
container.bind<IMultiplierCalculator>('MultiplierCalculator').to(MultiplierCalculator);
container.bind<IDeckManager>('DeckManager').to(DeckManager);

// ユーザー管理層
container.bind<IUserService>('UserService').to(UserService);
container.bind<IGuestManager>('GuestManager').to(GuestManager);
container.bind<IProfileManager>('ProfileManager').to(ProfileManager);

// ゲーム履歴・統計層
container.bind<IGameHistoryService>('GameHistoryService').to(GameHistoryService);
container.bind<IStatisticsService>('StatisticsService').to(StatisticsService);
container.bind<IRankingService>('RankingService').to(RankingService);

// ルーム管理層
container.bind<IRoomManager>('RoomManager').to(RoomManager);
container.bind<IGameSessionManager>('GameSessionManager').to(GameSessionManager);

// リアルタイム通信層
container.bind<IWebSocketHandler>('WebSocketHandler').to(WebSocketHandler);

// サービス層
container.bind<IGameService>('GameService').to(GameService);
container.bind<IUserService>('UserService').to(UserService);
container.bind<IHistoryService>('HistoryService').to(HistoryService);
container.bind<IRoomService>('RoomService').to(RoomService);
```

---

## 9. エラーハンドリング設計

### 9.1 エラーハンドリング戦略

1. **バリデーション層**: 入力値の検証
2. **ビジネスロジック層**: ビジネスルールの検証
3. **データアクセス層**: データベースエラーの処理
4. **API層**: エラーレスポンスの返却

### 9.2 エラータイプ

| エラータイプ | 説明 | HTTP ステータス |
|---|---|---|
| ValidationError | 入力値の検証エラー | 400 |
| BusinessLogicError | ビジネスルール違反 | 422 |
| NotFoundError | リソースが見つからない | 404 |
| UnauthorizedError | 認証エラー | 401 |
| ForbiddenError | 認可エラー | 403 |
| InternalServerError | サーバーエラー | 500 |

---

## 10. テスト戦略

### 10.1 テストレベル

1. **ユニットテスト**: 各コンポーネントを独立してテスト
2. **統合テスト**: コンポーネント間の相互作用をテスト
3. **エンドツーエンドテスト**: ユーザーシナリオをテスト

### 10.2 テスト対象

| テスト対象 | テストレベル | 優先度 |
|---|---|---|
| GameEngine | ユニット | 高 |
| DoboDeclaration | ユニット | 高 |
| MultiplierCalculator | ユニット | 高 |
| DeckManager | ユニット | 高 |
| GameService | 統合 | 高 |
| UserService | 統合 | 中 |
| HistoryService | 統合 | 中 |
| RoomService | 統合 | 中 |
| GameBoard | ユニット | 中 |
| WebSocketHandler | 統合 | 高 |

---

## 11. パフォーマンス設計

### 11.1 パフォーマンス目標

| 項目 | 目標 |
|---|---|
| ゲーム状態更新の遅延 | < 100ms |
| ドボン宣言の応答時間 | < 200ms |
| ゲーム履歴取得の応答時間 | < 500ms |
| WebSocket接続確立時間 | < 1s |

### 11.2 パフォーマンス最適化戦略

1. **キャッシング**: 頻繁にアクセスされるデータをキャッシュ
2. **非同期処理**: 長時間かかる処理を非同期で実行
3. **データベース最適化**: インデックス、クエリ最適化
4. **WebSocket最適化**: メッセージ圧縮、バッチ処理

---

## 12. セキュリティ設計

### 12.1 セキュリティ対策

1. **認証**: ゲストID認証（簡易的）
2. **認可**: ユーザーが自分のデータのみアクセス可能
3. **通信暗号化**: HTTPS、WSS（WebSocket Secure）
4. **入力検証**: すべての入力値を検証
5. **エラーハンドリング**: 詳細なエラー情報を隠蔽

### 12.2 セキュリティレベル

- **要件**: POCレベル、高いセキュリティ要件なし
- **実装**: 基本的なセキュリティ対策のみ

---

## 13. スケーラビリティ設計

### 13.1 スケーラビリティ戦略

1. **水平スケーリング**: 複数のサーバーインスタンス
2. **ロードバランシング**: リクエストの分散
3. **キャッシング**: データベースの負荷軽減
4. **非同期処理**: 長時間かかる処理の非同期化

### 13.2 スケーラビリティレベル

- **対象ユーザー**: 5-10人程度（チームメイトのみ）
- **大規模化**: 想定していない
- **スケーラビリティ**: 低い

---

## 14. 設計の完全性と一貫性

### 14.1 設計の完全性

- [x] すべてのコンポーネントが識別されている
- [x] すべてのコンポーネントのメソッドが定義されている
- [x] すべてのサービスが定義されている
- [x] すべてのコンポーネント依存関係が定義されている
- [x] リアルタイム通信の統合が定義されている

### 14.2 設計の一貫性

- [x] コンポーネント間の依存関係に循環参照がない
- [x] サービス層がビジネスロジック層を正しくオーケストレーションしている
- [x] データアクセス層が正しく分離されている
- [x] リアルタイム通信が適切に統合されている

---

## 15. 次のステップ

1. **Units Generation** - ユニット分割（バックエンド、フロントエンド）
2. **Functional Design** - ゲームロジック詳細設計
3. **NFR Requirements** - 非機能要件分析
4. **NFR Design** - 非機能要件設計
5. **Infrastructure Design** - インフラ設計
6. **Code Generation** - コード生成
7. **Build and Test** - ビルド・テスト

