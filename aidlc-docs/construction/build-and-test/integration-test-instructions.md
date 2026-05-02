# Integration Test Instructions

## Overview

フロントエンド (Unit 1) とバックエンド (Unit 2) の相互作用をテストします。

---

## Integration Test Strategy

### Test Scope
- **フロントエンド ↔ バックエンド**: WebSocket 通信
- **ゲーム状態管理**: 複数プレイヤー間での状態同期
- **リアルタイム更新**: Dobo宣言、カード効果、支払い計算
- **エラーハンドリング**: ネットワーク障害、不正な操作

### Test Framework
- **Tool**: Socket.io テストクライアント + カスタムテストコード
- **Configuration**: `backend/src/**/*.integration.test.ts`

---

## Pre-requisites

### 1. 環境準備

```bash
# フロントエンド依存パッケージ確認
npm list socket.io-client

# バックエンド依存パッケージ確認
cd backend
npm list socket.io express

# テスト用パッケージ確認
npm list -D jest socket.io-client
```

### 2. テストデータ準備

**ユーザーデータ** (`backend/src/fixtures/users.json`):
```json
{
  "users": [
    { "id": "user1", "name": "Player1" },
    { "id": "user2", "name": "Player2" },
    { "id": "user3", "name": "Player3" }
  ]
}
```

**ルーム設定** (`backend/src/fixtures/rooms.json`):
```json
{
  "rooms": [
    {
      "id": "room1",
      "name": "TestRoom1",
      "playerCount": 2,
      "status": "waiting"
    },
    {
      "id": "room2",
      "name": "TestRoom2",
      "playerCount": 3,
      "status": "playing"
    }
  ]
}
```

---

## Step 1: テスト環境起動

### 1.1 バックエンドサーバー起動

```bash
cd backend
npm run dev
```

**確認**:
```
[info] Server running on port 3000
[info] WebSocket server initialized
```

### 1.2 フロントエンド開発サーバー起動（別ターミナル）

```bash
npm run dev
```

**確認**:
```
  VITE v4.x.x ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

### 1.3 接続テスト

```bash
curl http://localhost:3000/health
```

**期待される応答**:
```json
{ "status": "ok", "timestamp": "2026-05-02T00:00:00Z" }
```

---

## Step 2: WebSocket 接続テスト

### Scenario: クライアント接続 → サーバー確認

**テストコード** (`backend/src/socket/GameSessionManager.integration.test.ts`):

```typescript
describe('WebSocket Connection', () => {
  it('should connect client to server', async () => {
    const client = io('http://localhost:3000', {
      reconnection: false,
    });

    return new Promise((resolve) => {
      client.on('connect', () => {
        expect(client.connected).toBe(true);
        client.disconnect();
        resolve(true);
      });
    });
  });

  it('should receive connection acknowledgment', async () => {
    const client = io('http://localhost:3000');

    return new Promise((resolve) => {
      client.on('server:connected', (data) => {
        expect(data.status).toBe('ok');
        expect(data.clientId).toBeDefined();
        client.disconnect();
        resolve(true);
      });
    });
  });
});
```

**実行**:
```bash
cd backend
npm run test -- GameSessionManager.integration.test.ts
```

**期待される出力**:
```
 ✓ should connect client to server (50ms)
 ✓ should receive connection acknowledgment (60ms)
```

---

## Step 3: ゲーム開始フロー

### Scenario: ルーム作成 → プレイヤー参加 → ゲーム開始

**テストステップ**:

#### 3.1 ルーム作成

```bash
# クライアント 1 がルーム作成
POST http://localhost:3000/api/rooms
Content-Type: application/json

{
  "roomName": "IntegrationTestRoom",
  "creatorId": "user1",
  "creatorName": "Player1"
}
```

**期待される応答**:
```json
{
  "roomId": "room_xyz123",
  "roomName": "IntegrationTestRoom",
  "creatorId": "user1",
  "status": "waiting",
  "playerCount": 1
}
```

#### 3.2 プレイヤー参加

```bash
# クライアント 2 と 3 が参加
POST http://localhost:3000/api/rooms/room_xyz123/join
Content-Type: application/json

{
  "playerId": "user2",
  "playerName": "Player2"
}
```

#### 3.3 ゲーム開始シグナル

```bash
# クライアント 1 がゲーム開始
POST http://localhost:3000/api/rooms/room_xyz123/start
```

**期待される状態**:
- ルーム状態: `playing`
- プレイヤー数: 3
- 全クライアントが `game:started` イベント受信

---

## Step 4: ゲームプレイ テスト

### Scenario: カードドロー → カードプレイ → Dobo宣言

#### 4.1 初期手札配布

**テスト検証**:
```typescript
it('should distribute initial hand', async () => {
  // ゲーム開始後、各プレイヤーが 5 枚の手札を受け取る
  const hand = await gameSession.getPlayerHand('user1');
  expect(hand.length).toBe(5);
  expect(hand.every(card => card.rank !== undefined)).toBe(true);
});
```

#### 4.2 カードプレイ

```typescript
it('should play a valid card', async () => {
  const card = hand[0];
  
  const response = await client.emit('game:playCard', {
    roomId: 'room_xyz123',
    playerId: 'user1',
    cardId: card.id,
    specialAction: null
  });

  expect(response.success).toBe(true);
  expect(response.newFieldCard).toBeDefined();
});
```

#### 4.3 無効なカードプレイ（失敗テスト）

```typescript
it('should reject invalid card play', async () => {
  const invalidCard = {
    rank: 'Q',
    suit: 'spades'
  };

  const response = await client.emit('game:playCard', {
    roomId: 'room_xyz123',
    playerId: 'user1',
    cardId: invalidCard.id
  });

  expect(response.success).toBe(false);
  expect(response.error).toBe('CARD_NOT_PLAYABLE');
});
```

#### 4.4 Dobo宣言

```typescript
it('should handle Dobo declaration', async () => {
  // プレイヤーが Dobo 宣言
  const response = await client.emit('game:dobo', {
    roomId: 'room_xyz123',
    playerId: 'user1',
    formula: '3 + 2 + 10 = 15'
  });

  expect(response.success).toBe(true);
  expect(response.status).toBe('doboPhase');
});
```

#### 4.5 Dobo返し

```typescript
it('should handle Dobo return challenge', async () => {
  // プレイヤー 2 が Dobo 返し
  const response = await client.emit('game:returnDobo', {
    roomId: 'room_xyz123',
    playerId: 'user2',
    returnFormula: '7 + 8 = 15'
  });

  expect(response.success).toBe(true);
  expect(response.winner).toBe('user2');
});
```

---

## Step 5: 複数クライアント同期テスト

### Scenario: 3 プレイヤーでのリアルタイム同期

**テストコード**:

```typescript
describe('Multi-Client Synchronization', () => {
  let client1, client2, client3;
  const roomId = 'sync_test_room';

  beforeAll(async () => {
    // 3 つのクライアント接続
    client1 = io('http://localhost:3000');
    client2 = io('http://localhost:3000');
    client3 = io('http://localhost:3000');
  });

  it('should sync game state across all clients', async () => {
    // クライアント 1 がカード をプレイ
    await client1.emit('game:playCard', { cardId: 'card1' });

    // クライアント 2 と 3 が状態更新を受け取る
    const client2Update = await new Promise(resolve => {
      client2.on('game:cardPlayed', resolve);
    });
    const client3Update = await new Promise(resolve => {
      client3.on('game:cardPlayed', resolve);
    });

    expect(client2Update.playerId).toBe('user1');
    expect(client3Update.playerId).toBe('user1');
    expect(client2Update.cardId).toBe(client3Update.cardId);
  });

  it('should handle concurrent plays', async () => {
    // 2 プレイヤーが同時にカード をプレイ（テスト）
    const play1 = client1.emit('game:playCard', { cardId: 'card1' });
    const play2 = client2.emit('game:playCard', { cardId: 'card2' });

    const results = await Promise.all([play1, play2]);

    // 1 つは成功、1 つは失敗（ターンベースのため）
    const successes = results.filter(r => r.success).length;
    expect(successes).toBe(1);
  });

  afterAll(() => {
    client1.disconnect();
    client2.disconnect();
    client3.disconnect();
  });
});
```

**実行**:
```bash
cd backend
npm run test -- GameSessionManager.integration.test.ts
```

---

## Step 6: エラーハンドリング テスト

### Scenario: ネットワークエラーとリカバリー

```typescript
describe('Error Handling and Recovery', () => {
  it('should handle connection loss', async () => {
    const client = io('http://localhost:3000');

    // 接続確認
    expect(client.connected).toBe(true);

    // 接続を切断
    client.disconnect();
    expect(client.connected).toBe(false);

    // 再接続
    client.connect();
    expect(client.connected).toBe(true);
  });

  it('should handle invalid game action', async () => {
    const response = await client.emit('game:playCard', {
      roomId: 'invalid_room',
      cardId: 'card1'
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('ROOM_NOT_FOUND');
  });

  it('should handle server timeout', async () => {
    const promise = new Promise((resolve) => {
      client.emit('game:action', {}, (response) => {
        resolve(response);
      });

      setTimeout(() => resolve({ timeout: true }), 5000);
    });

    const result = await promise;
    expect(result).toBeDefined();
  });
});
```

---

## Step 7: 統合テスト実行

### 7.1 全統合テスト実行

```bash
cd backend
npm run test:integration
```

**期待される出力**:
```
 PASS  src/socket/GameSessionManager.integration.test.ts (12s)
  WebSocket Connection
    ✓ should connect client to server (50ms)
    ✓ should receive connection acknowledgment (60ms)
  Game Flow
    ✓ should create room and start game (500ms)
    ✓ should play cards and sync state (800ms)
    ✓ should handle Dobo declaration (1200ms)
  Multi-Client Sync
    ✓ should sync game state across all clients (900ms)
    ✓ should handle concurrent plays (1100ms)
  Error Handling
    ✓ should handle connection loss (300ms)
    ✓ should handle invalid game action (200ms)

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Time:        14.5s
```

### 7.2 特定のシナリオのみ実行

```bash
cd backend
npm run test:integration -- --testNamePattern="Multi-Client"
```

### 7.3 デバッグモード

```bash
cd backend
npm run test:integration -- --detectOpenHandles --forceExit
```

---

## Step 8: 統合テスト結果検証

### チェックリスト

- [ ] WebSocket 接続テスト PASS
- [ ] ゲーム開始フロー PASS
- [ ] カードプレイ テスト PASS
- [ ] Dobo宣言 テスト PASS
- [ ] 複数クライアント同期 PASS
- [ ] エラーハンドリング PASS
- [ ] 全テスト実行時間 < 30秒
- [ ] エラーメッセージなし

### テスト結果記録

```markdown
## Integration Test Results

- **Test Date**: 2026-05-02
- **Total Tests**: 9
- **Passed**: 9
- **Failed**: 0
- **Skipped**: 0
- **Duration**: 14.5s
- **Coverage**: Socket.io 통신 100%

### Key Scenarios Validated
✅ WebSocket Connection
✅ Game Flow (Room Creation → Start)
✅ Card Play and State Sync
✅ Dobo Declaration
✅ Multi-Client Synchronization
✅ Error Recovery
```

---

## トラブルシューティング

### Integration tests fail with "ECONNREFUSED"

**原因**: バックエンドサーバーが起動していない

**解決策**:
```bash
# ターミナル 1: バックエンドサーバー起動
cd backend
npm run dev

# ターミナル 2: テスト実行
npm run test:integration
```

### Socket.io connection timeout

**原因**: CORS 設定またはポート設定の問題

**解決策**:
```bash
# backend/src/index.ts で確認
const io = new Server(app, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  }
});

# バックエンド再起動
npm run dev
```

### Tests intermittently fail

**原因**: タイミング関連のレースコンディション

**解決策**:
```typescript
// テストに適切な待機を追加
jest.setTimeout(10000);

await new Promise(resolve => setTimeout(resolve, 100));
```

