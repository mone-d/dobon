# Performance Test Instructions

## Overview

Dobonゲームの各ユニットとシステム全体のパフォーマンス特性をテストします。

---

## Performance Test Strategy

### Test Scope

| テスト項目 | 対象 | 測定項目 |
|-----------|------|--------|
| Load Testing | バックエンド | 同時プレイヤー数 | レスポンス時間 |
| Stress Testing | WebSocket | メッセージ処理率 | メモリ使用量 |
| Endurance Testing | フロントエンド | 長時間使用での安定性 |
| Spike Testing | システム全体 | 瞬間的な負荷変動への対応 |

---

## Prerequisites

### ツール導入

```bash
# Apache JMeter (負荷テスト)
# または: npm install -D artillery autocannon

npm install -D autocannon

# メモリプロファイラー
npm install -D clinic

# ベンチマーク
npm install -D benchmark
```

### 環境準備

- **メモリ**: 2GB 以上
- **CPU**: 2 コア以上
- **ネットワーク**: 安定した接続
- **テスト環境**: 本番相似

---

## Step 1: API応答時間テスト

### 1.1 バックエンド API レスポンス時間

**テストコード** (`backend/src/api.performance.test.ts`):

```typescript
import autocannon from 'autocannon';

describe('API Performance', () => {
  it('should respond within 100ms for room creation', async () => {
    const result = await autocannon({
      url: 'http://localhost:3000/api/rooms',
      connections: 10,
      pipelining: 1,
      duration: 30,
      requests: [
        {
          method: 'POST',
          path: '/api/rooms',
          body: JSON.stringify({
            roomName: 'TestRoom',
            creatorId: 'user1',
            creatorName: 'Player1'
          })
        }
      ]
    });

    // 平均応答時間 < 100ms
    expect(result.latency.mean).toBeLessThan(100);
    
    // P99 応答時間 < 500ms
    expect(result.latency.p99).toBeLessThan(500);
    
    // エラーレート = 0%
    expect(result.errors).toBe(0);
  });
});
```

**実行**:
```bash
cd backend
npm run test:performance -- api.performance.test.ts
```

**期待される結果**:
```
┌─────────────────────────────────────────────┐
│ Requests: 3000, Throughput: 100 req/sec   │
├─────────────────────────────────────────────┤
│ Avg Latency:   45ms                        │
│ Min Latency:   12ms                        │
│ Max Latency:   180ms                       │
│ P99 Latency:   120ms                       │
├─────────────────────────────────────────────┤
│ Errors: 0                                   │
│ Timeouts: 0                                 │
└─────────────────────────────────────────────┘
```

---

## Step 2: WebSocket スループット テスト

### 2.1 メッセージ処理速度

**テストコード** (`backend/src/socket/performance.integration.test.ts`):

```typescript
describe('WebSocket Performance', () => {
  it('should handle 1000 messages per second', async () => {
    const client = io('http://localhost:3000');
    let messagesReceived = 0;
    let startTime: number;

    client.on('game:update', () => {
      messagesReceived++;
    });

    await new Promise(resolve => {
      client.on('connect', () => {
        startTime = Date.now();
        
        // 1秒間に1000メッセージを送信
        for (let i = 0; i < 1000; i++) {
          client.emit('game:ping', { id: i });
        }

        setTimeout(() => {
          const duration = (Date.now() - startTime) / 1000;
          const throughput = messagesReceived / duration;
          
          console.log(`Throughput: ${throughput.toFixed(0)} msg/sec`);
          expect(throughput).toBeGreaterThan(800); // 80% 以上の応答
          resolve(true);
        }, 2000);
      });
    });
  });

  it('should maintain < 50ms latency under load', async () => {
    const latencies: number[] = [];
    
    const client = io('http://localhost:3000');

    client.on('game:pong', (data) => {
      const latency = Date.now() - data.timestamp;
      latencies.push(latency);
    });

    await new Promise(resolve => {
      let sent = 0;
      const interval = setInterval(() => {
        client.emit('game:ping', { timestamp: Date.now(), id: sent++ });
        
        if (sent >= 100) {
          clearInterval(interval);
          resolve(true);
        }
      }, 10); // 100ms で 100 メッセージ = 1000 msg/sec
    });

    const avgLatency = latencies.reduce((a, b) => a + b) / latencies.length;
    expect(avgLatency).toBeLessThan(50);
  });
});
```

**実行**:
```bash
cd backend
npm run test:performance -- socket/performance.integration.test.ts
```

---

## Step 3: メモリ使用量テスト

### 3.1 メモリリーク検出

**テストコード**:

```typescript
import * as clinic from 'clinic';

describe('Memory Performance', () => {
  it('should not leak memory during 1000 game cycles', async () => {
    const doctor = new clinic.Doctor();

    // メモリプロファイル開始
    doctor.collect(async () => {
      for (let i = 0; i < 1000; i++) {
        // ゲームサイクル 1 回
        const room = await createGameRoom(`room${i}`);
        await simulateGamePlay(room);
        await deleteGameRoom(room.id);
      }
    });

    const report = await doctor.report();
    
    // メモリ使用量増加 < 100MB
    expect(report.memoryGrowth).toBeLessThan(100 * 1024 * 1024);
  });
});
```

**実行（コマンドラインから）**:
```bash
cd backend
clinic doctor -- npm run dev
# ブラウザで http://localhost:3000 にアクセス、ゲームプレイ
# プロセス終了後にレポート生成
```

### 3.2 メモリプロファイラー（Node.js built-in）

```bash
cd backend
node --prof src/index.ts

# ゲームをプレイ後、Ctrl+C で終了

# プロファイルレポート生成
node --prof-process isolate-*.log > profile-summary.txt

# レポート確認
cat profile-summary.txt | head -50
```

**期待される出力**:
```
Statistical profiling result from isolate-xxxxx, (10192 ticks, ...)
 [Shared objects]
  ticks  total  nonlib   name
  1234   12.1%        C++ code
```

---

## Step 4: CPU 使用率テスト

### 4.1 CPU プロファイリング

**テストコード**:

```typescript
describe('CPU Performance', () => {
  it('should not exceed 50% CPU for 100 concurrent games', async () => {
    const cpuMonitor = new CPUMonitor();
    cpuMonitor.start();

    // 100 並行ゲーム作成
    const games = Array.from({ length: 100 }, (_, i) =>
      createAndPlayGame(`game${i}`)
    );

    await Promise.all(games);

    const avgCpuUsage = cpuMonitor.getAverageCpuUsage();
    cpuMonitor.stop();

    console.log(`Average CPU usage: ${avgCpuUsage}%`);
    expect(avgCpuUsage).toBeLessThan(50);
  });
});
```

**実行**:
```bash
cd backend
npm run test:performance -- cpu.performance.test.ts
```

---

## Step 5: スケーラビリティ テスト

### 5.1 同時ユーザー数での負荷テスト

**テストコード**:

```typescript
describe('Scalability', () => {
  it('should support 50 concurrent players', async () => {
    const players = Array.from({ length: 50 }, (_, i) => ({
      id: `player${i}`,
      name: `Player${i}`
    }));

    const room = await createRoom('scalability-test', 50);
    
    // 全プレイヤーが同時接続
    const connections = players.map(player =>
      connectPlayer(player, room.id)
    );

    await Promise.all(connections);

    // ゲーム開始
    const gameResult = await startGame(room.id);

    expect(gameResult.success).toBe(true);
    expect(gameResult.playerCount).toBe(50);
    expect(gameResult.avgLatency).toBeLessThan(500); // 平均500ms以下
  });

  it('should handle 100 room instances simultaneously', async () => {
    const rooms = Array.from({ length: 100 }, (_, i) =>
      createRoom(`room${i}`, 4)
    );

    const createdRooms = await Promise.all(rooms);

    expect(createdRooms.filter(r => r.success).length).toBe(100);
    expect(createdRooms.filter(r => !r.success).length).toBe(0);
  });
});
```

---

## Step 6: エンデュランス テスト（長時間実行）

### 6.1 24 時間ゲーム運用テスト

**テストシナリオ**:

```bash
# テスト実行スクリプト (endurance-test.sh)
#!/bin/bash

START_TIME=$(date +%s)
DURATION=$((24 * 60 * 60)) # 24 hours

while true; do
  CURRENT_TIME=$(date +%s)
  ELAPSED=$((CURRENT_TIME - START_TIME))
  
  if [ $ELAPSED -gt $DURATION ]; then
    break
  fi
  
  # 1 時間ごとにゲームを実行
  npm run test:game-simulation
  
  # メモリ使用量ログ
  free -h >> memory-log.txt
  
  sleep 3600 # 1 hour
done
```

**モニタリング項目**:
- メモリ使用量（安定性）
- CPU 使用率（異常上昇なし）
- エラーログ（なし）
- 応答時間（増加傾向なし）

---

## Step 7: フロントエンド レンダリング パフォーマンス

### 7.1 Vue コンポーネント レンダリング速度

**テストコード** (`tests/performance/rendering.test.ts`):

```typescript
import { mount } from '@vue/test-utils';
import GameBoard from '@/components/GameBoard.vue';

describe('Frontend Rendering Performance', () => {
  it('should render 100 cards in < 100ms', async () => {
    const startTime = performance.now();
    
    const wrapper = mount(GameBoard, {
      props: {
        cards: Array.from({ length: 100 }, (_, i) => ({
          id: `card${i}`,
          rank: 'A',
          suit: 'hearts'
        }))
      }
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    console.log(`Render time: ${renderTime}ms`);
    expect(renderTime).toBeLessThan(100);
  });

  it('should update 50 cards in < 50ms', async () => {
    const wrapper = mount(GameBoard, {
      props: {
        cards: Array.from({ length: 50 }, (_, i) => ({
          id: `card${i}`,
          rank: 'A',
          suit: 'hearts'
        }))
      }
    });

    const startTime = performance.now();
    
    // 全カードを更新
    await wrapper.setProps({
      cards: Array.from({ length: 50 }, (_, i) => ({
        id: `card${i}`,
        rank: 'K',
        suit: 'spades'
      }))
    });

    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(50);
  });
});
```

**実行**:
```bash
npm run test:performance -- rendering.test.ts
```

---

## Step 8: パフォーマンス テスト結果総括

### チェックリスト

- [ ] API応答時間 < 100ms
- [ ] WebSocket スループット > 800 msg/sec
- [ ] メモリリーク検出 = なし
- [ ] CPU使用率 < 50%
- [ ] 同時50ユーザー対応
- [ ] 100ルーム同時稼働
- [ ] フロントエンド レンダリング < 100ms
- [ ] エラー率 = 0%

### パフォーマンス レポート テンプレート

```markdown
## Performance Test Report

### 実行日時
- **Date**: 2026-05-02
- **Environment**: Development
- **Duration**: 2 hours

### API Performance
- Average Response Time: 45ms
- P99 Response Time: 120ms
- Throughput: 100 req/sec
- Error Rate: 0%

### WebSocket Performance
- Message Throughput: 950 msg/sec
- Average Latency: 35ms
- Max Latency: 180ms

### Resource Usage
- Memory (Peak): 250MB
- Memory (Average): 180MB
- Memory Leak: None
- CPU (Average): 25%
- CPU (Peak): 45%

### Scalability
- Max Concurrent Players: 50
- Max Room Instances: 100
- Average Latency at Scale: 350ms

### Frontend Performance
- Card Render Time: 75ms
- Update Time (50 cards): 35ms

### Conclusion
✅ All performance targets met
✅ System ready for production
```

---

## トラブルシューティング

### Performance tests timeout

**解決策**:
```typescript
jest.setTimeout(60000); // 60秒
```

### Memory usage grows excessively

**解決策**:
- メモリリークテストを実行
- garbage collection の明示的呼び出しを確認
- 接続/セッションの適切なクリーンアップ

### CPU spikes detected

**解決策**:
- CPU プロファイリングでボトルネック特定
- 不要なループや計算の最適化

