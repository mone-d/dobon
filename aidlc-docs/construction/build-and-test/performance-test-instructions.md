# Performance Test Instructions

## Purpose

システムが負荷下で要求されるパフォーマンス要件を満たすことを検証します。

---

## Performance Requirements

### Response Time
- **WebSocket接続**: < 100ms
- **カード操作（play-card）**: < 50ms
- **ドボン宣言（declare-dobo）**: < 100ms
- **ゲーム状態更新**: < 50ms

### Throughput
- **同時接続数**: 100接続以上
- **イベント処理**: 1000イベント/秒以上

### Concurrent Users
- **同時プレイヤー数**: 100人以上（25ゲーム × 4人）
- **同時ゲーム数**: 25ゲーム以上

### Error Rate
- **許容エラー率**: < 1%
- **タイムアウト率**: < 0.5%

---

## Current Status

**⚠️ Performance Tests: PENDING**

現時点ではパフォーマンステストは実装されていません。以下は将来の実装計画です。

---

## Setup Performance Test Environment (将来の実装)

### 1. Prepare Test Environment

#### Backend Scaling
```bash
# 本番環境に近い設定でバックエンドを起動
cd backend
NODE_ENV=production npm start
```

#### Load Balancer Configuration (Heroku)
```bash
# Herokuで複数dynoを起動
heroku ps:scale web=2 -a dobon-backend
```

---

### 2. Configure Test Parameters

#### Load Test Configuration
- **Test Duration**: 5分
- **Ramp-up Time**: 30秒
- **Virtual Users**: 100ユーザー
- **Think Time**: 1-3秒（ユーザー操作間の待機時間）

#### Stress Test Configuration
- **Test Duration**: 10分
- **Ramp-up Time**: 2分
- **Virtual Users**: 10 → 200ユーザー（段階的に増加）
- **Think Time**: 1-3秒

---

## Run Performance Tests (将来の実装)

### Tool Options

#### Option 1: Artillery (推奨)
WebSocketとHTTPの両方をサポート

```bash
# Artilleryをインストール
npm install -g artillery

# テストスクリプトを作成
cat > artillery-test.yml << EOF
config:
  target: "ws://localhost:3000"
  phases:
    - duration: 300
      arrivalRate: 20
      name: "Load test"
  engines:
    socketio: {}

scenarios:
  - name: "Game Flow"
    engine: socketio
    flow:
      - emit:
          channel: "game:start"
          data:
            roomId: "test-room"
            players: []
            baseRate: 100
      - think: 2
      - emit:
          channel: "game:play-card"
          data:
            roomId: "test-room"
            playerId: "player1"
            cards: []
      - think: 1
EOF

# テストを実行
artillery run artillery-test.yml
```

---

#### Option 2: k6
高性能な負荷テストツール

```bash
# k6をインストール
brew install k6  # macOS

# テストスクリプトを作成
cat > k6-test.js << EOF
import ws from 'k6/ws';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '5m', target: 100 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const url = 'ws://localhost:3000';
  const params = { tags: { my_tag: 'websocket' } };

  const res = ws.connect(url, params, function (socket) {
    socket.on('open', () => {
      socket.send(JSON.stringify({
        event: 'game:start',
        data: { roomId: 'test', players: [], baseRate: 100 }
      }));
    });

    socket.on('message', (data) => {
      console.log('Message received: ', data);
    });

    socket.setTimeout(() => {
      socket.close();
    }, 5000);
  });

  check(res, { 'status is 101': (r) => r && r.status === 101 });
}
EOF

# テストを実行
k6 run k6-test.js
```

---

### 1. Execute Load Tests

#### Purpose
通常の負荷下でのパフォーマンスを測定

```bash
# Artilleryでロードテストを実行
artillery run artillery-test.yml --output load-test-results.json

# レポートを生成
artillery report load-test-results.json
```

**Expected Metrics**:
- **Response Time (p95)**: < 100ms
- **Response Time (p99)**: < 200ms
- **Throughput**: > 1000 req/s
- **Error Rate**: < 1%

---

### 2. Execute Stress Tests

#### Purpose
システムの限界を特定

```bash
# 段階的に負荷を増加させるストレステスト
artillery run artillery-stress-test.yml --output stress-test-results.json

# レポートを生成
artillery report stress-test-results.json
```

**Expected Behavior**:
- システムが段階的な負荷増加に対応
- エラー率が許容範囲内
- リソース使用率が監視可能

---

### 3. Analyze Performance Results

#### Response Time Analysis
```
Metrics:
  - Response Time (min): XXms
  - Response Time (median): XXms
  - Response Time (p95): XXms
  - Response Time (p99): XXms
  - Response Time (max): XXms
```

**Target vs Actual**:
- **Target p95**: < 100ms
- **Actual p95**: [測定値]
- **Status**: [Pass/Fail]

---

#### Throughput Analysis
```
Metrics:
  - Requests/sec (mean): XXX
  - Requests/sec (max): XXX
  - Total requests: XXXX
```

**Target vs Actual**:
- **Target**: > 1000 req/s
- **Actual**: [測定値]
- **Status**: [Pass/Fail]

---

#### Error Rate Analysis
```
Metrics:
  - Total errors: XX
  - Error rate: X.XX%
  - Timeout errors: XX
  - Connection errors: XX
```

**Target vs Actual**:
- **Target**: < 1%
- **Actual**: [測定値]
- **Status**: [Pass/Fail]

---

#### Bottleneck Identification

パフォーマンステスト中に以下を監視:
- **CPU使用率**: `top` または `htop`
- **メモリ使用率**: `free -m`
- **ネットワークI/O**: `iftop`
- **ディスクI/O**: `iotop`

**Common Bottlenecks**:
- WebSocket接続数の上限
- メモリリーク
- データベースクエリの遅延
- ネットワーク帯域幅

---

## Performance Optimization

パフォーマンスが要件を満たさない場合:

### 1. Identify Bottlenecks
- プロファイリングツールを使用（Node.js Profiler, Chrome DevTools）
- ログから遅い処理を特定
- リソース使用率を確認

### 2. Optimize Code
- **非効率なループ**: O(n²) → O(n)
- **不要なデータコピー**: 参照渡しを使用
- **同期処理**: 非同期処理に変更

### 3. Optimize Queries
- インデックスの追加
- クエリの最適化
- キャッシュの導入

### 4. Scale Infrastructure
- Heroku dynoの増加
- Redis導入（セッション管理）
- CDN導入（静的ファイル配信）

### 5. Rerun Tests
最適化後、パフォーマンステストを再実行して改善を検証

---

## Performance Test Checklist

### Prerequisites
- [ ] Unit 1 (Frontend) のコード生成が完了
- [ ] Unit 2 (Backend) のビルドが成功
- [ ] 統合テストが成功

### Test Execution
- [ ] ロードテストが実行された
- [ ] ストレステストが実行された
- [ ] パフォーマンスメトリクスが収集された

### Results Analysis
- [ ] レスポンスタイムが要件を満たす
- [ ] スループットが要件を満たす
- [ ] エラー率が許容範囲内
- [ ] ボトルネックが特定された（該当する場合）

---

## Results Location

パフォーマンステスト結果は以下に保存:
- **Artillery**: `load-test-results.json`, `stress-test-results.json`
- **k6**: `k6-results.json`
- **Reports**: `performance-reports/`

---

## Next Steps

パフォーマンステストが完了したら:
1. Build and Test Summary - `build-and-test-summary.md` を確認
2. 必要に応じて最適化を実施
3. Operations フェーズに進む準備
