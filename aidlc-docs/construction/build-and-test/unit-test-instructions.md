# Unit Test Execution Instructions

## Overview

ユニット単位でテストを実行します。各ユニットのテストは独立して実行可能です。

---

## Unit 1: Frontend (Vue.js)

### Test Framework
- **Framework**: Vitest
- **Configuration**: `vitest.config.ts`
- **Coverage Tool**: vitest built-in coverage

### Step 1: フロントエンドテスト環境確認

```bash
# プロジェクトルートで実行
npm run test --version
```

### Step 2: 全フロントエンドテスト実行

```bash
npm run test
```

**期待される出力**:
```
 ✓ tests/components/Card.test.ts
 ✓ tests/components/GameBoard.test.ts
 ✓ tests/components/ControlPanel.test.ts
 ✓ tests/services/GameService.test.ts
 ...
 
 Test Files  15 passed (15)
 Tests       45 passed (45)
 Coverage    85%+
```

### Step 3: 特定のコンポーネントテスト

```bash
# コンポーネント単位でテスト実行
npm run test -- tests/components/Card.test.ts

npm run test -- tests/services/GameService.test.ts
```

### Step 4: カバレッジ確認

```bash
npm run test:coverage
```

**期待される出力**:
```
File                        | % Stmts | % Branch | % Funcs | % Lines
---------------------------------------------------------------------------------------
All files                   |   85.5  |   82.1   |   87.2  |   85.5
 src/components             |   88.3  |   85.1   |   90.5  |   88.3
  Card.vue                  |   92.1  |   88.5   |   95.0  |   92.1
  GameBoard.vue             |   86.5  |   82.3   |   88.0  |   86.5
  ControlPanel.vue          |   85.0  |   80.0   |   86.0  |   85.0
 src/services               |   82.5  |   80.0   |   84.0  |   82.5
  GameService.ts            |   85.0  |   82.0   |   87.0  |   85.0
 src/stores                 |   87.0  |   84.0   |   89.0  |   87.0
```

**カバレッジ目標**:
- ステートメント: 80% 以上
- ブランチ: 75% 以上
- 関数: 80% 以上
- 行: 80% 以上

### Step 5: デバッグモードでテスト実行

```bash
npm run test -- --inspect-brk
```

このモードでは以下が可能:
- ブレークポイント設定
- ステップ実行
- 変数検査

### Step 6: Watch モードでテスト実行（開発中）

```bash
npm run test -- --watch
```

ファイル保存時に自動的にテストが再実行されます。

---

## Unit 2: Backend (Node.js + Express)

### Test Framework
- **Framework**: Jest
- **Configuration**: `backend/jest.config.js`
- **Test Files Location**: `backend/src/**/*.test.ts`

### Step 1: バックエンドテスト環境確認

```bash
cd backend
npm run test --version
```

### Step 2: 全バックエンドテスト実行

```bash
cd backend
npm run test
```

**期待される出力**:
```
 PASS  src/game/CardValidator.test.ts
 PASS  src/game/MultiplierCalculator.test.ts
 PASS  src/game/DeckManager.test.ts
 PASS  src/game/PaymentCalculator.test.ts
 PASS  src/game/DoboDeclaration.test.ts
 PASS  src/game/handlers/TwoCardHandler.test.ts
 PASS  src/game/handlers/KCardHandler.test.ts
 PASS  src/socket/GameSessionManager.test.ts

Test Suites: 8 passed, 8 total
Tests:       120 passed, 120 total
Snapshots:   0 total
Time:        12.345s
```

### Step 3: テストカバレッジ確認

```bash
cd backend
npm run test:coverage
```

**期待される出力**:
```
File                              | % Stmts | % Branch | % Funcs | % Lines
---------------------------------------------------------------------------------------------------------
All files                         |   88.2  |   85.5   |   90.0  |   88.2
 src/game                         |   92.0  |   89.0   |   94.0  |   92.0
  CardValidator.ts                |   95.0  |   92.0   |   96.0  |   95.0
  MultiplierCalculator.ts          |   90.0  |   87.0   |   92.0  |   90.0
  DeckManager.ts                  |   88.0  |   85.0   |   90.0  |   88.0
  PaymentCalculator.ts            |   91.0  |   88.0   |   93.0  |   91.0
  DoboDeclaration.ts              |   90.0  |   86.0   |   92.0  |   90.0
 src/game/handlers                |   89.0  |   86.0   |   91.0  |   89.0
 src/socket                       |   85.0  |   82.0   |   87.0  |   85.0
```

**カバレッジ目標**:
- ステートメント: 85% 以上
- ブランチ: 80% 以上
- 関数: 85% 以上
- 行: 85% 以上

### Step 4: 特定のテストモジュール実行

```bash
cd backend

# ゲームロジック テスト
npm run test -- CardValidator.test.ts
npm run test -- MultiplierCalculator.test.ts
npm run test -- DeckManager.test.ts
npm run test -- PaymentCalculator.test.ts
npm run test -- DoboDeclaration.test.ts

# カードハンドラー テスト
npm run test -- handlers/TwoCardHandler.test.ts
npm run test -- handlers/KCardHandler.test.ts
npm run test -- handlers/ACardHandler.test.ts

# Socket/セッション管理 テスト
npm run test -- GameSessionManager.test.ts
```

### Step 5: リアルタイム Watch モード

```bash
cd backend
npm run test -- --watch
```

### Step 6: デバッグモードでテスト実行

```bash
cd backend
npm run test -- --inspect-brk --forceExit
```

Node.js デバッガーでステップ実行可能。

---

## テスト失敗時のトラブルシューティング

### フロントエンド

#### Error: Cannot find module 'vue'
```bash
npm install
```

#### Tests timeout
```bash
# timeout を増加
npm run test -- --testTimeout=10000
```

#### Snapshot mismatch
```bash
# snapshot を更新
npm run test -- --updateSnapshot
```

### バックエンド

#### Error: Cannot find module '...'
```bash
cd backend
npm install
npm run build
```

#### Test timeout
```bash
cd backend
npm run test -- --testTimeout=10000
```

#### Connection refused (Socket.io テスト)
```bash
# テストサーバーが起動しているか確認
npm run test -- --forceExit
```

---

## Test Results Summary Template

### Frontend Test Report
- **Total Tests**: X
- **Passed**: X
- **Failed**: 0
- **Coverage**: X%
- **Duration**: X.XXs
- **Status**: ✅ PASS / ❌ FAIL

### Backend Test Report
- **Total Tests**: X
- **Passed**: X
- **Failed**: 0
- **Coverage**: X%
- **Duration**: X.XXs
- **Status**: ✅ PASS / ❌ FAIL

---

## ユニットテスト実行チェックリスト

- [ ] Node.js v18 確認
- [ ] npm install 完了（両ユニット）
- [ ] フロントエンド テスト実行成功
- [ ] フロントエンド カバレッジ 80% 以上
- [ ] バックエンド テスト実行成功
- [ ] バックエンド カバレッジ 85% 以上
- [ ] テスト失敗なし（全テスト PASS）
- [ ] エラーメッセージなし
