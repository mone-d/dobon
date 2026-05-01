# Infrastructure Design - Unit 1 (Frontend)

## 概要

Unit 1（フロントエンド）のインフラストラクチャ設計を定義します。POC レベルのプロジェクトであり、チームメイトのみが利用するため、シンプルで管理コストが低いインフラを選定しました。

---

## 1. デプロイメント環境

### 1.1 クラウドプロバイダー

**選定**: Vercel

**理由**:
- Vue.js に最適化
- 自動デプロイ、自動スケーリング
- 無料プラン利用可能
- セットアップが簡単

**特徴**:
- GitHub との連携で自動デプロイ
- プレビューデプロイメント機能
- 自動 SSL/TLS 証明書管理
- グローバル CDN

### 1.2 環境構成

**選定**: 本番環境のみ

**理由**:
- POC レベルのため、本番環境のみで十分
- 開発環境はローカルで実行
- ステージング環境は不要

**環境**:
- **開発環境**: ローカル（npm run dev）
- **本番環境**: Vercel

---

## 2. コンピュート インフラストラクチャ

### 2.1 フロントエンドホスティング

**選定**: Vercel（サーバーレス）

**理由**:
- 自動スケーリング
- 管理コスト最小
- 無料プラン利用可能

**特徴**:
- Node.js ランタイム
- 自動スケーリング
- 自動ロードバランシング
- 99.95% の可用性

### 2.2 スケーリング戦略

**選定**: 自動スケーリング

**理由**:
- Vercel の自動スケーリング機能を活用
- 管理コスト最小

**特徴**:
- トラフィック増加時に自動的にスケール
- トラフィック減少時に自動的にスケールダウン
- 追加設定不要

---

## 3. ストレージ インフラストラクチャ

### 3.1 フロントエンドアセット

**選定**: Vercel CDN

**理由**:
- グローバル配信
- 自動キャッシング
- 追加設定不要

**特徴**:
- 世界中のエッジロケーションから配信
- 自動キャッシング
- 高速配信

### 3.2 キャッシング戦略

**選定**: 長期キャッシュ

**キャッシング設定**:
- **HTML**: 短期（1 時間）
  - 常に最新のバージョンを取得
  - ユーザーが最新の機能を使用可能

- **CSS/JavaScript**: 長期（1 年）
  - ビルド時にハッシュ値を付与
  - ファイルが変更されない限りキャッシュ

- **画像**: 長期（1 年）
  - ビルド時にハッシュ値を付与
  - ファイルが変更されない限りキャッシュ

**実装**:
```
vercel.json
{
  "headers": [
    {
      "source": "/index.html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 3.3 ゲーム履歴・統計データ

**選定**: Firebase Realtime Database

**理由**:
- リアルタイム双方向通信に対応
- スケーラビリティが高い
- セットアップが簡単
- コストが安い（POC レベル）

**特徴**:
- NoSQL データベース
- リアルタイム同期
- 自動スケーリング
- 無料プラン利用可能

**データ構造**:
```json
{
  "gameHistory": {
    "game1": {
      "gameId": "game1",
      "date": "2026-04-30T12:00:00Z",
      "players": ["user1", "user2"],
      "winner": "user1",
      "loser": "user2",
      "payment": 1000,
      "multiplier": 1
    }
  },
  "statistics": {
    "user1": {
      "userId": "user1",
      "totalGames": 10,
      "wins": 7,
      "losses": 3,
      "winRate": 70,
      "totalEarnings": 5000,
      "totalPayments": 2000
    }
  }
}
```

### 3.4 バックアップ戦略

**選定**: バックアップなし

**理由**:
- POC レベルのため、バックアップは不要
- Firebase の自動バックアップ機能に依存
- データ損失のリスクは低い

---

## 4. メッセージング インフラストラクチャ

### 4.1 リアルタイム通信

**選定**: Firebase Realtime Database

**理由**:
- リアルタイム双方向通信に対応
- セットアップが簡単
- コストが安い

**特徴**:
- WebSocket ベースの通信
- リアルタイム同期
- 自動再接続機能
- オフラインサポート

### 4.2 メッセージング方式

**選定**: WebSocket（Firebase Realtime Database）

**理由**:
- リアルタイム双方向通信が必要
- Socket.io より簡単

**実装**:
```typescript
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ゲーム状態の監視
const gameStateRef = ref(database, `gameState/${gameId}`);
onValue(gameStateRef, (snapshot) => {
  const gameState = snapshot.val();
  gameStore.updateGameState(gameState);
});

// ゲーム状態の更新
const updateGameState = (gameState: GameState) => {
  set(ref(database, `gameState/${gameId}`), gameState);
};
```

---

## 5. ネットワーク インフラストラクチャ

### 5.1 API ゲートウェイ

**選定**: 使用しない

**理由**:
- POC レベルのため、API ゲートウェイは不要
- バックエンドサーバーに直接接続
- 管理コスト最小化

**実装**:
```typescript
const API_BASE_URL = import.meta.env.PROD
  ? 'https://api.example.com'
  : 'http://localhost:3000';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});
```

### 5.2 CORS 設定

**選定**: すべてのドメインを許可

**理由**:
- POC レベル、チームメイトのみ
- セキュリティリスクは低い

**実装**:
```typescript
// バックエンド（Node.js + Express）
import cors from 'cors';

app.use(cors());
```

**本番化時の対応**:
```typescript
app.use(cors({
  origin: 'https://dobon.example.com',
  credentials: true,
}));
```

### 5.3 SSL/TLS 証明書

**選定**: Vercel の自動管理

**理由**:
- 自動取得・更新
- 追加設定不要

**特徴**:
- Let's Encrypt で自動取得
- 有効期限 90 日前に自動更新
- 無料

---

## 6. 監視 インフラストラクチャ

### 6.1 ロギング

**選定**: ローカルファイル

**理由**:
- POC レベルのため、ローカルファイルで十分
- コスト最小化

**実装**:
```typescript
// ブラウザコンソールにログ出力
const logger = {
  log: (message: string, data?: any) => {
    console.log(`[LOG] ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  },
};

// 本番環境ではログを削除
if (!import.meta.env.PROD) {
  logger.log('Game started', { gameId, players });
}
```

### 6.2 ログ保持期間

**選定**: 短期（1 週間）

**理由**:
- POC レベルのため、短期で十分
- コスト最小化

---

### 6.3 エラー監視

**選定**: 使用しない

**理由**:
- POC レベルのため、エラー監視は不要
- ログから手動で確認

**本番化時の対応**:
```typescript
import * as Sentry from "@sentry/vue";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
```

---

### 6.4 パフォーマンス監視

**選定**: 実装しない

**理由**:
- POC レベルのため、パフォーマンス監視は不要

**本番化時の対応**:
```typescript
// Google Analytics
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

const analytics = getAnalytics(app);
```

---

## 7. セキュリティ インフラストラクチャ

### 7.1 認証・認可

**選定**: ゲストID のみ

**理由**:
- POC レベル、チームメイトのみ
- シンプルな実装

**実装**:
```typescript
// ゲストID の生成
const generateGuestId = (): string => {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ゲストID の保存
const saveGuestId = (guestId: string) => {
  localStorage.setItem('guestId', guestId);
};

// ゲストID の読み込み
const loadGuestId = (): string | null => {
  return localStorage.getItem('guestId');
};
```

### 7.2 セッション管理

**選定**: ローカルストレージ + JWT

**理由**:
- ステートレス設計
- シンプルな実装
- スケーラビリティが高い

**実装**:
```typescript
// JWT トークンの保存
const saveToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

// JWT トークンの読み込み
const loadToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// API リクエストに JWT を含める
axiosInstance.interceptors.request.use((config) => {
  const token = loadToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 7.3 データ保護

**選定**: HTTPS/WSS のみ（DB 暗号化は不要）

**理由**:
- HTTPS/WSS で通信暗号化
- DB 暗号化は POC レベルでは不要

**実装**:
- **開発環境**: HTTP/WS（ローカル）
- **本番環境**: HTTPS/WSS（Vercel + Firebase）

**環境変数**:
```
# .env.development
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# .env.production
VITE_API_BASE_URL=https://api.example.com
VITE_WS_URL=wss://api.example.com
```

---

## 8. 共有インフラストラクチャ

### 8.1 複数ユニット間の共有

**選定**: 共有する

**理由**:
- 同じクラウドプロバイダー（Vercel + Firebase）を使用
- 同じデータベース、ログサービス等を共有
- 管理コスト最小化

**共有インフラ**:
- **フロントエンド**: Vercel
- **バックエンド**: Node.js + Express（AWS EC2 または Heroku）
- **データベース**: Firebase Realtime Database
- **認証**: Firebase Authentication（将来）

**アーキテクチャ**:
```
┌─────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                 │
│  - Vue.js 3 アプリケーション                         │
│  - 自動デプロイ、自動スケーリング                   │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼──────────┐ │
│ REST API     │ │ Firebase    │ │
│ (Node.js)    │ │ Realtime DB │ │
│ AWS EC2/     │ │ (Shared)    │ │
│ Heroku       │ └─────────────┘ │
└──────────────┘                  │
                                  │
                    ┌─────────────┘
                    │
            ┌───────▼──────────┐
            │ Firebase Auth    │
            │ (Future)         │
            └──────────────────┘
```

---

## 9. インフラストラクチャコンポーネント一覧

| コンポーネント | 選定 | 理由 |
|---|---|---|
| ホスティング | Vercel | 自動デプロイ、無料 |
| 環境 | 本番環境のみ | POC レベル |
| コンピュート | サーバーレス | 管理コスト最小 |
| スケーリング | 自動 | Vercel の機能 |
| CDN | Vercel CDN | グローバル配信 |
| キャッシング | 長期 | パフォーマンス最適化 |
| データベース | Firebase Realtime DB | リアルタイム、簡単 |
| バックアップ | なし | POC レベル |
| WebSocket | Firebase Realtime DB | リアルタイム通信 |
| API ゲートウェイ | なし | POC レベル |
| CORS | すべて許可 | POC レベル |
| SSL/TLS | Vercel 自動管理 | 無料、自動更新 |
| ロギング | ローカルファイル | POC レベル |
| ログ保持 | 1 週間 | コスト最小化 |
| エラー監視 | なし | POC レベル |
| パフォーマンス監視 | なし | POC レベル |
| 認証 | ゲストID | シンプル |
| セッション | JWT | ステートレス |
| データ暗号化 | HTTPS/WSS のみ | 通信暗号化 |
| インフラ共有 | 共有 | 管理コスト最小化 |

---

## 10. 本番化への移行ガイドライン

### 10.1 セキュリティ強化

- [ ] Firebase Authentication の導入
- [ ] API ゲートウェイの導入（AWS API Gateway）
- [ ] CORS の制限（特定ドメインのみ）
- [ ] データベース暗号化の有効化
- [ ] WAF（Web Application Firewall）の導入

### 10.2 監視・ロギング強化

- [ ] Sentry でエラー監視
- [ ] Google Analytics でパフォーマンス監視
- [ ] CloudWatch でログ管理
- [ ] アラート設定

### 10.3 スケーリング対応

- [ ] 負荷テスト実施
- [ ] キャッシング戦略の最適化
- [ ] データベースのシャーディング検討
- [ ] CDN の最適化

### 10.4 コスト最適化

- [ ] Vercel の料金プラン見直し
- [ ] Firebase の料金プラン見直し
- [ ] 不要なリソースの削除
- [ ] 予算アラートの設定

---

## 11. インフラストラクチャ実装チェックリスト

### デプロイメント
- [ ] Vercel アカウント作成
- [ ] GitHub リポジトリ連携
- [ ] 自動デプロイ設定
- [ ] 環境変数設定

### ストレージ
- [ ] Firebase プロジェクト作成
- [ ] Realtime Database 設定
- [ ] セキュリティルール設定
- [ ] バックアップ設定

### ネットワーク
- [ ] SSL/TLS 証明書確認
- [ ] CORS 設定確認
- [ ] API エンドポイント設定

### セキュリティ
- [ ] ゲストID 生成ロジック実装
- [ ] JWT トークン実装
- [ ] 環境変数設定

### 監視
- [ ] ロギング実装
- [ ] エラーハンドリング実装
- [ ] 本番環境でのテスト

