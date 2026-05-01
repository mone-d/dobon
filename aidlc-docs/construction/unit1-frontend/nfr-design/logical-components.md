# Logical Components - Unit 1 (Frontend)

## 概要

Unit 1（フロントエンド）の非機能要件を実現するための論理コンポーネント（インフラストラクチャコンポーネント）を定義します。

---

## 1. 通信層コンポーネント

### 1.1 Axios インスタンス（REST API 通信）

**責務**: REST API 通信の一元化、リトライ、エラーハンドリング

**実装位置**: `src/services/api.ts`

**機能**:
- ベース URL の設定
- タイムアウト設定（10 秒）
- リクエスト・レスポンスインターセプター
- 自動リトライ（最大 3 回、固定間隔 1 秒）
- エラーハンドリング

**インターフェース**:
```typescript
interface ApiClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}
```

**使用例**:
```typescript
const response = await apiClient.get('/api/rooms');
const result = await apiClient.post('/api/games/:id/play-card', { cards });
```

---

### 1.2 Socket.io インスタンス（WebSocket 通信）

**責務**: WebSocket 通信の一元化、自動再接続、イベント管理

**実装位置**: `src/services/socket.ts`

**機能**:
- WebSocket 接続管理
- 自動再接続（最大 5 回、リトライ間隔 1-5 秒）
- イベントリスナー登録
- 接続状態の監視

**インターフェース**:
```typescript
interface SocketClient {
  connect(): void;
  disconnect(): void;
  on(event: string, callback: (data: any) => void): void;
  emit(event: string, data: any): void;
  isConnected(): boolean;
}
```

**使用例**:
```typescript
socketClient.on('game:state', (gameState) => {
  gameStore.updateGameState(gameState);
});

socketClient.emit('game:play-card', { cards });
```

---

## 2. 状態管理層コンポーネント

### 2.1 Pinia ストア（グローバル状態管理）

**責務**: アプリケーション全体の状態管理

**実装位置**: `src/stores/`

**ストア一覧**:

#### 2.1.1 ユーザーストア

**ファイル**: `src/stores/user.ts`

**状態**:
```typescript
{
  currentUser: User | null;
  isLoggedIn: boolean;
}
```

**アクション**:
- `createGuest()` - ゲストユーザー作成
- `updateProfile(profile)` - プロフィール更新
- `logout()` - ログアウト

#### 2.1.2 ゲームストア

**ファイル**: `src/stores/game.ts`

**状態**:
```typescript
{
  gameState: GameState | null;
  gameHistory: GameResult[];
  isLoading: boolean;
}
```

**アクション**:
- `startGame()` - ゲーム開始
- `playCard(cards)` - カード出し
- `drawCard()` - 山札から引く
- `declareDobo(formula)` - ドボン宣言
- `declareReturn(formula)` - 返しドボン宣言
- `loadGameHistory()` - ゲーム履歴読み込み

#### 2.1.3 ルームストア

**ファイル**: `src/stores/room.ts`

**状態**:
```typescript
{
  rooms: Room[];
  currentRoom: Room | null;
  isLoading: boolean;
}
```

**アクション**:
- `createRoom(baseRate)` - ルーム作成
- `joinRoom(roomId)` - ルーム参加
- `leaveRoom()` - ルーム退出
- `listRooms()` - ルーム一覧取得

#### 2.1.4 統計ストア

**ファイル**: `src/stores/statistics.ts`

**状態**:
```typescript
{
  statistics: Statistics | null;
  ranking: Ranking[];
  isLoading: boolean;
}
```

**アクション**:
- `getStatistics()` - 統計情報取得
- `getRanking()` - ランキング取得

#### 2.1.5 接続状態ストア

**ファイル**: `src/stores/connection.ts`

**状態**:
```typescript
{
  isConnected: boolean;
  isReconnecting: boolean;
}
```

**アクション**:
- `setConnected(connected)` - 接続状態更新
- `setReconnecting(reconnecting)` - 再接続状態更新

---

## 3. エラーハンドリング層コンポーネント

### 3.1 グローバルエラーハンドラー

**責務**: API エラーの一元化、ユーザー通知

**実装位置**: `src/services/errorHandler.ts`

**機能**:
- API エラーの捕捉
- エラーメッセージの生成
- ユーザーへの通知
- エラーログの記録

**インターフェース**:
```typescript
interface ErrorHandler {
  handleApiError(error: AxiosError): void;
  handleNetworkError(error: Error): void;
  handleValidationError(errors: ValidationError[]): void;
}
```

**使用例**:
```typescript
try {
  await apiClient.post('/api/games/:id/play-card', { cards });
} catch (error) {
  errorHandler.handleApiError(error);
}
```

---

## 4. ロギング層コンポーネント

### 4.1 ロギングサービス

**責務**: すべてのゲームイベントのログ記録

**実装位置**: `src/services/logger.ts`

**機能**:
- ゲームイベントのログ
- エラーログ
- パフォーマンスログ
- デバッグ情報

**インターフェース**:
```typescript
interface Logger {
  log(message: string, data?: any): void;
  error(message: string, error?: any): void;
  warn(message: string, data?: any): void;
  info(message: string, data?: any): void;
  debug(message: string, data?: any): void;
}
```

**使用例**:
```typescript
logger.info('Game started', { gameId, players });
logger.info('Card played', { playerId, cards });
logger.error('Invalid card operation', { error });
```

**ログレベル**:
- `debug`: 詳細なデバッグ情報
- `info`: 一般的な情報
- `warn`: 警告
- `error`: エラー

---

## 5. 接続管理層コンポーネント

### 5.1 接続状態マネージャー

**責務**: WebSocket 接続状態の監視、再接続管理

**実装位置**: `src/services/connectionManager.ts`

**機能**:
- 接続状態の監視
- 自動再接続
- 再接続失敗時の処理
- ユーザー通知

**インターフェース**:
```typescript
interface ConnectionManager {
  connect(): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;
  onConnected(callback: () => void): void;
  onDisconnected(callback: () => void): void;
  onReconnecting(callback: () => void): void;
  onReconnectFailed(callback: () => void): void;
}
```

**使用例**:
```typescript
connectionManager.onConnected(() => {
  console.log('Connected to server');
  gameStore.syncGameState();
});

connectionManager.onReconnectFailed(() => {
  showNotification({
    type: 'error',
    message: 'サーバーに接続できません。ページをリロードしてください。',
  });
});
```

---

## 6. キャッシング層コンポーネント

### 6.1 キャッシュマネージャー

**責務**: API レスポンスのキャッシング（非実装）

**実装位置**: 不実装（POC レベル）

**理由**:
- POC レベルのため、キャッシングは不要
- 毎回 API から取得
- 必要に応じて後で追加可能

---

## 7. パフォーマンス監視層コンポーネント

### 7.1 パフォーマンスモニター

**責務**: パフォーマンス計測（非実装）

**実装位置**: 不実装（POC レベル）

**理由**:
- POC レベルのため、計測は不要
- 必要に応じて後で追加可能

---

## 8. 通知層コンポーネント

### 8.1 通知サービス

**責務**: ユーザーへの通知表示

**実装位置**: `src/services/notification.ts`

**機能**:
- トースト通知
- バナー通知
- モーダル通知

**インターフェース**:
```typescript
interface NotificationService {
  success(message: string, duration?: number): void;
  error(message: string, duration?: number): void;
  warning(message: string, duration?: number): void;
  info(message: string, duration?: number): void;
  show(options: NotificationOptions): void;
}

interface NotificationOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}
```

**使用例**:
```typescript
notificationService.success('ゲームが開始しました');
notificationService.error('カード操作に失敗しました');
notificationService.show({
  type: 'error',
  message: 'サーバーに接続できません。ページをリロードしてください。',
  action: {
    label: 'リロード',
    callback: () => window.location.reload(),
  },
});
```

---

## 9. ルーティング層コンポーネント

### 9.1 Vue Router インスタンス

**責務**: ページ遷移管理、ルートベースのコード分割

**実装位置**: `src/router/index.ts`

**ルート一覧**:
- `/` - ロビー画面
- `/room/:roomId` - ルーム画面
- `/game/:gameId` - ゲーム画面
- `/profile` - プロフィール画面
- `/statistics` - 統計画面

**機能**:
- ルートベースのコード分割
- ナビゲーション
- ルートガード

---

## 10. 論理コンポーネント依存関係図

```
┌─────────────────────────────────────────────────────────────┐
│                    Vue.js Components                         │
│  (GameBoard, LobbyScreen, RoomScreen, etc.)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼──────────┐ │
│ Pinia Stores │ │ Vue Router  │ │
│ (State Mgmt) │ │ (Routing)   │ │
└───────┬──────┘ └─────────────┘ │
        │                        │
        ├────────────┬───────────┤
        │            │           │
┌───────▼──────┐ ┌──▼────────┐ │
│ API Client   │ │ Socket.io │ │
│ (REST)       │ │ (WebSocket)
└───────┬──────┘ └──┬────────┘ │
        │           │          │
        ├───────────┼──────────┤
        │           │          │
┌───────▼───────────▼──────────▼──────────┐
│  Error Handler, Logger, Notification   │
│  Connection Manager, etc.               │
└─────────────────────────────────────────┘
```

---

## 11. 論理コンポーネント実装チェックリスト

### 通信層
- [ ] Axios インスタンス（リトライ機能付き）
- [ ] Socket.io インスタンス（自動再接続付き）

### 状態管理層
- [ ] ユーザーストア
- [ ] ゲームストア
- [ ] ルームストア
- [ ] 統計ストア
- [ ] 接続状態ストア

### エラーハンドリング層
- [ ] グローバルエラーハンドラー
- [ ] API エラーハンドリング

### ロギング層
- [ ] ロギングサービス

### 接続管理層
- [ ] 接続状態マネージャー

### 通知層
- [ ] 通知サービス

### ルーティング層
- [ ] Vue Router インスタンス

---

## 12. 論理コンポーネント実装ガイドライン

### 12.1 依存性注入

すべての論理コンポーネントは、Vue.js のプロバイダーパターンで注入します：

```typescript
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { apiClient } from './services/api';
import { socketClient } from './services/socket';
import { logger } from './services/logger';

const app = createApp(App);

app.provide('apiClient', apiClient);
app.provide('socketClient', socketClient);
app.provide('logger', logger);

app.mount('#app');
```

### 12.2 エラーハンドリング

すべての API 呼び出しは、エラーハンドリングを含めます：

```typescript
try {
  const result = await apiClient.post('/api/games/:id/play-card', { cards });
  gameStore.updateGameState(result);
} catch (error) {
  errorHandler.handleApiError(error);
  logger.error('Failed to play card', error);
}
```

### 12.3 ロギング

すべての主要なゲームイベントをログします：

```typescript
logger.info('Game started', { gameId, players });
logger.info('Card played', { playerId, cards });
logger.info('Dobo declared', { playerId, formula });
```

---

## 13. 論理コンポーネント実装スケジュール

| コンポーネント | 優先度 | 実装順序 |
|---|---|---|
| Axios インスタンス | 高 | 1 |
| Socket.io インスタンス | 高 | 2 |
| Pinia ストア | 高 | 3 |
| Vue Router | 高 | 4 |
| エラーハンドラー | 中 | 5 |
| ロギングサービス | 中 | 6 |
| 接続状態マネージャー | 中 | 7 |
| 通知サービス | 中 | 8 |

