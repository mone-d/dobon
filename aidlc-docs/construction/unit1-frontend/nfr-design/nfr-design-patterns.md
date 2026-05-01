# NFR Design Patterns - Unit 1 (Frontend)

## 概要

Unit 1（フロントエンド）の非機能要件を実現するためのデザインパターンを定義します。

---

## 1. レジリエンス（復帰）パターン

### 1.1 WebSocket 自動再接続パターン

**パターン**: Socket.io デフォルト再接続

**実装方針**:
```typescript
// Socket.io の自動再接続設定
const socket = io(WS_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  reconnectionAttempts: 5,
  // リトライ間隔: 1秒、2秒、3秒、4秒、5秒
});

// 接続状態の監視
socket.on('connect', () => {
  console.log('WebSocket connected');
  // ゲーム状態を再同期
});

socket.on('disconnect', () => {
  console.log('WebSocket disconnected');
  // 再接続中の通知を表示
});

socket.on('reconnect_attempt', () => {
  console.log('Attempting to reconnect...');
});

socket.on('reconnect_failed', () => {
  console.log('Reconnection failed');
  // ユーザーに通知
});
```

**特徴**:
- Socket.io のデフォルト再接続機能を使用
- リトライ間隔: 1秒、2秒、3秒、4秒、5秒
- 最大リトライ回数: 5 回
- 自動的に再接続を試みる

### 1.2 接続切断時のユーザー通知パターン

**パターン**: 画面上部バナー通知

**実装方針**:
```typescript
// 接続状態ストア
const connectionStore = defineStore('connection', {
  state: () => ({
    isConnected: true,
    isReconnecting: false,
  }),
  
  actions: {
    setConnected(connected: boolean) {
      this.isConnected = connected;
    },
    
    setReconnecting(reconnecting: boolean) {
      this.isReconnecting = reconnecting;
    },
  },
});

// コンポーネント
<template>
  <div v-if="!connectionStore.isConnected" class="connection-banner">
    <div v-if="connectionStore.isReconnecting">
      接続が切れました。再接続中...
    </div>
    <div v-else>
      接続が切れました。ページをリロードしてください。
    </div>
  </div>
</template>
```

**特徴**:
- 画面上部に固定バナーを表示
- 再接続中は「再接続中...」と表示
- 再接続成功時に自動的に消える
- ユーザーの操作を妨げない

### 1.3 再接続失敗時の処理パターン

**パターン**: ページリロード促進

**実装方針**:
```typescript
socket.on('reconnect_failed', () => {
  connectionStore.setConnected(false);
  connectionStore.setReconnecting(false);
  
  // ユーザーに通知
  showNotification({
    type: 'error',
    message: 'サーバーに接続できません。ページをリロードしてください。',
    action: {
      label: 'リロード',
      callback: () => {
        window.location.reload();
      },
    },
  });
});
```

**特徴**:
- 5 回のリトライ失敗後、ユーザーに通知
- 「リロード」ボタンを提供
- ユーザーが手動でページをリロード

---

## 2. API エラーハンドリングパターン

### 2.1 リトライ戦略

**パターン**: 固定間隔リトライ（3 回）

**実装方針**:
```typescript
// Axios インターセプター
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// リトライロジック
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // リトライ回数を追跡
    if (!config.retryCount) {
      config.retryCount = 0;
    }
    
    // 最大 3 回までリトライ
    if (config.retryCount < 3 && error.response?.status >= 500) {
      config.retryCount++;
      
      // 固定間隔（1 秒）で待機
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      return axiosInstance(config);
    }
    
    return Promise.reject(error);
  }
);
```

**特徴**:
- 最大 3 回までリトライ
- 固定間隔（1 秒）で待機
- サーバーエラー（5xx）のみリトライ
- クライアントエラー（4xx）はリトライしない

---

## 3. スケーラビリティパターン

### 3.1 ゲーム履歴の保存パターン

**パターン**: サーバー保存（バックエンド API）

**実装方針**:
```typescript
// ゲーム履歴ストア
const gameHistoryStore = defineStore('gameHistory', {
  state: () => ({
    gameHistory: [] as GameResult[],
    isLoading: false,
  }),
  
  actions: {
    async loadGameHistory() {
      this.isLoading = true;
      try {
        const response = await axiosInstance.get('/api/history');
        this.gameHistory = response.data;
      } finally {
        this.isLoading = false;
      }
    },
    
    async addGameResult(result: GameResult) {
      // サーバーに保存
      await axiosInstance.post('/api/history', result);
      // ローカルストアを更新
      this.gameHistory.unshift(result);
    },
  },
});
```

**特徴**:
- ゲーム履歴はサーバーに保存
- ローカルストレージは使用しない
- ブラウザ間でデータを共有可能
- スケーラビリティが高い

### 3.2 メモリ内ストアのサイズ管理

**パターン**: 最新 10 ゲームのみメモリに保持

**実装方針**:
```typescript
// ゲーム履歴ストア
const gameHistoryStore = defineStore('gameHistory', {
  state: () => ({
    gameHistory: [] as GameResult[],
    totalCount: 0,
  }),
  
  getters: {
    recentGames: (state) => state.gameHistory.slice(0, 10),
  },
  
  actions: {
    async loadGameHistory() {
      // サーバーから最新 10 ゲームを取得
      const response = await axiosInstance.get('/api/history?limit=10');
      this.gameHistory = response.data.games;
      this.totalCount = response.data.total;
    },
  },
});
```

**特徴**:
- メモリに最新 10 ゲームのみ保持
- 古いゲームはサーバーから取得
- メモリ効率が高い
- ページネーション対応

### 3.3 コンポーネント分割戦略

**パターン**: 機能ごとの分割

**実装方針**:
```
src/
├── components/
│   ├── GameBoard/
│   │   ├── GameBoard.vue
│   │   ├── CardHand.vue
│   │   ├── DoboDeclarationUI.vue
│   │   └── ReturnDoboUI.vue
│   ├── Lobby/
│   │   ├── LobbyScreen.vue
│   │   └── RoomList.vue
│   ├── Room/
│   │   ├── RoomScreen.vue
│   │   └── PlayerList.vue
│   ├── Profile/
│   │   ├── ProfileScreen.vue
│   │   └── ProfileEditForm.vue
│   └── Statistics/
│       ├── StatisticsScreen.vue
│       ├── GameHistory.vue
│       └── Ranking.vue
```

**特徴**:
- 機能ごとにディレクトリを分割
- 関連コンポーネントをグループ化
- スケーラビリティが高い
- 保守性が向上

---

## 4. パフォーマンスパターン

### 4.1 レンダリング最適化パターン

**パターン**: computed プロパティのみ

**実装方針**:
```typescript
// Vue.js 3 Composition API
import { computed, ref } from 'vue';

export default {
  setup() {
    const selectedCards = ref<Card[]>([]);
    const hand = ref<Card[]>([]);
    
    // computed で派生状態を管理
    const selectedCardCount = computed(() => selectedCards.value.length);
    
    const canPlayCards = computed(() => {
      // カード出し可能かどうかを判定
      return selectedCards.value.length > 0 && 
             selectedCards.value.every(card => card.suit === selectedCards.value[0].suit);
    });
    
    return {
      selectedCards,
      hand,
      selectedCardCount,
      canPlayCards,
    };
  },
};
```

**特徴**:
- computed プロパティで派生状態を管理
- 不要な再レンダリングを回避
- Vue.js の基本機能のみ使用
- シンプルで保守性が高い

### 4.2 仮想スクロール非使用パターン

**パターン**: シンプルな実装

**実装方針**:
```typescript
// ゲーム履歴表示
<template>
  <div class="game-history">
    <div v-for="game in gameHistory" :key="game.gameId" class="game-item">
      {{ game.date }} - {{ game.winner.userName }} vs {{ game.loser.userName }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameHistoryStore } from '@/stores/gameHistory';

const gameHistoryStore = useGameHistoryStore();

// 最新 10 ゲームのみ表示
const gameHistory = computed(() => gameHistoryStore.recentGames);
</script>
```

**特徴**:
- 最新 10 ゲームのみ表示
- 仮想スクロール不要
- シンプルな実装
- パフォーマンスに問題なし

### 4.3 初期ロード時間最適化パターン

**パターン**: ルートベースのコード分割

**実装方針**:
```typescript
// Vite + Vue Router でコード分割
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    component: () => import('@/views/LobbyScreen.vue'),
  },
  {
    path: '/room/:roomId',
    component: () => import('@/views/RoomScreen.vue'),
  },
  {
    path: '/game/:gameId',
    component: () => import('@/views/GameBoard.vue'),
  },
  {
    path: '/profile',
    component: () => import('@/views/ProfileScreen.vue'),
  },
  {
    path: '/statistics',
    component: () => import('@/views/StatisticsScreen.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
```

**特徴**:
- ルートごとにコード分割
- 初期ロード時間を短縮
- 必要なコンポーネントのみ読み込み
- Vite の自動最適化

### 4.4 画像の初期ロード時にすべて読み込みパターン

**パターン**: 初期ロード時にすべて読み込み

**実装方針**:
```typescript
// カード画像をプリロード
const preloadCardImages = async () => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = Array.from({ length: 13 }, (_, i) => i + 1);
  
  const promises = suits.flatMap((suit) =>
    values.map((value) => {
      const img = new Image();
      img.src = `/images/cards/${suit}-${value}.png`;
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );
  
  await Promise.all(promises);
};

// アプリケーション起動時にプリロード
onMounted(async () => {
  await preloadCardImages();
});
```

**特徴**:
- 初期ロード時にすべてのカード画像を読み込み
- ゲーム中の画像読み込み遅延を回避
- ユーザー体験が向上
- 初期ロード時間は増加するが、ゲーム中のレスポンスが向上

---

## 5. セキュリティパターン

### 5.1 開発環境での HTTP/WS 使用パターン

**パターン**: 開発環境では HTTP/WS、本番環境では HTTPS/WSS

**実装方針**:
```typescript
// 環境に応じた URL 設定
const API_BASE_URL = import.meta.env.PROD
  ? 'https://api.example.com'
  : 'http://localhost:3000';

const WS_URL = import.meta.env.PROD
  ? 'wss://ws.example.com'
  : 'ws://localhost:3000';

// Axios インスタンス
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Socket.io インスタンス
const socket = io(WS_URL);
```

**特徴**:
- 環境変数で URL を切り替え
- 開発効率と本番セキュリティのバランス
- 環境ごとに異なる設定

### 5.2 SSL/TLS 証明書の自動管理パターン

**パターン**: Vercel/Netlify の自動管理

**実装方針**:
- Vercel/Netlify にデプロイ
- 自動的に SSL/TLS 証明書を取得・更新
- 追加設定不要

**特徴**:
- 自動更新で証明書の有効期限切れを回避
- 管理コストが低い
- 推奨される方法

### 5.3 ゲストID の保存パターン

**パターン**: ローカルストレージのみ

**実装方針**:
```typescript
// ゲストID の保存
const saveGuestId = (guestId: string) => {
  localStorage.setItem('guestId', guestId);
};

// ゲストID の読み込み
const loadGuestId = (): string | null => {
  return localStorage.getItem('guestId');
};

// ゲストID の削除
const clearGuestId = () => {
  localStorage.removeItem('guestId');
};
```

**特徴**:
- ローカルストレージに平文で保存
- 最小限の保護（POC レベル）
- ユーザーが手動で削除可能

---

## 6. 論理コンポーネント

### 6.1 エラーハンドリングコンポーネント

**パターン**: API エラーのみ一元化

**実装方針**:
```typescript
// グローバルエラーハンドラー
const setupErrorHandling = (app: App) => {
  app.config.errorHandler = (err, instance, info) => {
    console.error('Global error:', err, info);
    
    // API エラーの場合
    if (axios.isAxiosError(err)) {
      const message = err.response?.data?.message || 'エラーが発生しました';
      showNotification({
        type: 'error',
        message,
      });
    }
  };
};

// Axios インターセプター
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // API エラーを一元化
    if (error.response?.status === 401) {
      // 認証エラー
      router.push('/login');
    } else if (error.response?.status === 500) {
      // サーバーエラー
      showNotification({
        type: 'error',
        message: 'サーバーエラーが発生しました',
      });
    }
    
    return Promise.reject(error);
  }
);
```

**特徴**:
- API エラーのみ一元化
- UI エラーは各コンポーネントで処理
- 保守性と柔軟性のバランス

### 6.2 ロギングコンポーネント

**パターン**: すべてのイベントをログ

**実装方針**:
```typescript
// ロギングサービス
class Logger {
  log(message: string, data?: any) {
    console.log(`[LOG] ${message}`, data);
  }
  
  error(message: string, error?: any) {
    console.error(`[ERROR] ${message}`, error);
  }
  
  warn(message: string, data?: any) {
    console.warn(`[WARN] ${message}`, data);
  }
  
  info(message: string, data?: any) {
    console.info(`[INFO] ${message}`, data);
  }
}

// グローバルロガー
const logger = new Logger();

// ゲームイベントのログ
logger.info('Game started', { gameId, players });
logger.info('Card played', { playerId, cards });
logger.info('Dobo declared', { playerId, formula });
logger.info('Game ended', { winner, loser, payment });
```

**特徴**:
- すべてのゲームイベントをログ
- 詳細なデバッグ情報
- 本番環境では console.log を削除

---

## 7. パフォーマンス監視

### 7.1 パフォーマンス計測非実装パターン

**パターン**: 計測なし

**理由**:
- POC レベルのため、計測は不要
- 必要に応じて後で追加可能
- 開発効率を優先

---

## 8. デザインパターンサマリー

| 項目 | パターン | 理由 |
|---|---|---|
| WebSocket 再接続 | Socket.io デフォルト | 自動再接続機能 |
| 接続切断通知 | 画面上部バナー | ユーザー体験 |
| 再接続失敗処理 | ページリロード促進 | シンプル |
| API リトライ | 固定間隔 3 回 | シンプル |
| ゲーム履歴保存 | サーバー保存 | スケーラビリティ |
| メモリ管理 | 最新 10 ゲーム | メモリ効率 |
| コンポーネント分割 | 機能ごと | 保守性 |
| レンダリング最適化 | computed のみ | シンプル |
| 仮想スクロール | 非使用 | シンプル |
| コード分割 | ルートベース | 初期ロード最適化 |
| 画像読み込み | 初期ロード時 | ゲーム中のレスポンス |
| 開発環境 | HTTP/WS | 開発効率 |
| SSL/TLS 管理 | Vercel/Netlify | 自動管理 |
| ゲストID 保存 | ローカルストレージ | 最小限の保護 |
| エラーハンドリング | API エラーのみ一元化 | バランス |
| ロギング | すべてのイベント | デバッグ |
| パフォーマンス計測 | 非実装 | POC レベル |

