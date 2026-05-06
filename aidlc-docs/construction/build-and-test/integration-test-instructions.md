# Integration Test Instructions

## Purpose

Unit 1 (Frontend) と Unit 2 (Backend) 間の統合をテストし、両ユニットが正しく連携することを確認します。

---

## Current Status

**⚠️ Integration Tests: PENDING**

Unit 1 (Frontend) のコード生成が未完了のため、統合テストは現時点では実行できません。

---

## Test Scenarios (計画)

### Scenario 1: Frontend → Backend WebSocket Connection
- **Description**: フロントエンドがバックエンドのWebSocketに接続できることを確認
- **Setup**: 
  1. バックエンドサーバーを起動
  2. フロントエンドアプリケーションを起動
- **Test Steps**:
  1. フロントエンドからWebSocket接続を確立
  2. `game:start` イベントを送信
  3. バックエンドから `game:started` イベントを受信
- **Expected Results**: 
  - WebSocket接続が成功
  - イベントの送受信が正常に動作
- **Cleanup**: サーバーとアプリケーションを停止

---

### Scenario 2: Game State Synchronization
- **Description**: ゲーム状態がフロントエンドとバックエンド間で正しく同期されることを確認
- **Setup**: 
  1. バックエンドサーバーを起動
  2. 複数のフロントエンドクライアントを起動
- **Test Steps**:
  1. プレイヤー1がカードを出す
  2. プレイヤー2が更新されたゲーム状態を受信
  3. プレイヤー2がカードを引く
  4. プレイヤー1が更新されたゲーム状態を受信
- **Expected Results**: 
  - 全プレイヤーが同じゲーム状態を持つ
  - リアルタイムで状態が同期される
- **Cleanup**: サーバーとクライアントを停止

---

### Scenario 3: Dobo Declaration Flow
- **Description**: ドボン宣言のフロー全体が正しく動作することを確認
- **Setup**: 
  1. バックエンドサーバーを起動
  2. フロントエンドクライアントを起動
  3. テスト用のゲーム状態を設定
- **Test Steps**:
  1. プレイヤーAがカードを出す
  2. プレイヤーBがドボン宣言
  3. バックエンドが演算式を検証
  4. 他プレイヤーに `game:dobo` イベントを送信
  5. 10秒のタイムアウト待機
  6. 勝者決定
- **Expected Results**: 
  - ドボン宣言が正しく処理される
  - タイムアウトが正確に動作
  - 勝者が正しく決定される
- **Cleanup**: サーバーとクライアントを停止

---

### Scenario 4: Error Handling and Reconnection
- **Description**: エラーハンドリングと再接続が正しく動作することを確認
- **Setup**: 
  1. バックエンドサーバーを起動
  2. フロントエンドクライアントを起動
  3. ゲームを開始
- **Test Steps**:
  1. ネットワーク接続を切断
  2. フロントエンドが切断を検知
  3. ネットワーク接続を復旧
  4. フロントエンドが自動再接続
  5. `game:rejoin` イベントでゲーム状態を復元
- **Expected Results**: 
  - 切断が正しく検知される
  - 再接続が自動的に行われる
  - ゲーム状態が正しく復元される
- **Cleanup**: サーバーとクライアントを停止

---

## Setup Integration Test Environment (将来の実装)

### 1. Start Backend Service
```bash
cd backend
npm run dev
```

**Expected Output**:
```
🚀 Dobon Backend Server running on port 3000
```

---

### 2. Start Frontend Application
```bash
cd frontend
npm run dev
```

**Expected Output**:
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

### 3. Configure Service Endpoints

フロントエンドの環境変数を確認:
```bash
cd frontend
cat .env.development
```

**Expected**:
```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

---

## Run Integration Tests (将来の実装)

### Manual Testing Approach

現時点では自動化された統合テストはありません。以下の手動テストを実行します:

#### 1. WebSocket Connection Test
1. バックエンドを起動
2. フロントエンドを起動
3. ブラウザの開発者ツールでWebSocket接続を確認
4. ネットワークタブで `ws://localhost:3000` への接続を確認

#### 2. Game Flow Test
1. 複数のブラウザタブでフロントエンドを開く
2. ゲームルームを作成
3. 他のタブから参加
4. ゲームを開始
5. カードを出す、引く、ドボン宣言などの操作を実行
6. 全タブで状態が同期されることを確認

#### 3. Error Scenario Test
1. ゲーム中にバックエンドを停止
2. フロントエンドのエラーハンドリングを確認
3. バックエンドを再起動
4. 再接続が動作することを確認

---

### Automated Integration Tests (将来の実装)

将来的には以下のツールで自動化を検討:
- **Playwright** または **Cypress**: E2Eテスト
- **Socket.io Client**: WebSocketテスト
- **Supertest**: REST APIテスト

---

## Verify Service Interactions

### Check Backend Logs
```bash
# バックエンドのログを確認
cd backend
npm run dev
```

ログで以下を確認:
- WebSocket接続の確立
- イベントの送受信
- エラーメッセージ

### Check Frontend Console
ブラウザの開発者ツールで以下を確認:
- WebSocket接続状態
- 受信したイベント
- エラーメッセージ

---

## Cleanup

### Stop Services
```bash
# バックエンドを停止（Ctrl+C）
cd backend
# プロセスを停止

# フロントエンドを停止（Ctrl+C）
cd frontend
# プロセスを停止
```

---

## Integration Test Checklist

### Prerequisites
- [ ] Unit 1 (Frontend) のコード生成が完了
- [ ] Unit 2 (Backend) のビルドが成功
- [ ] 両ユニットのユニットテストがpass

### Test Execution
- [ ] WebSocket接続テストが成功
- [ ] ゲーム状態同期テストが成功
- [ ] ドボン宣言フローテストが成功
- [ ] エラーハンドリングと再接続テストが成功

---

## Next Steps

統合テストが完了したら、次のステップに進みます:
1. Performance Test Execution - `performance-test-instructions.md` (必要に応じて)
2. Build and Test Summary - `build-and-test-summary.md`
