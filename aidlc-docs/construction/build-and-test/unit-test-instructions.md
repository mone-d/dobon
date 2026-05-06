# Unit Test Execution

## Overview

Unit 2 (Backend - Game Logic) のユニットテストを実行します。
Unit 1 (Frontend) はコード生成が未完了のため、テストは保留中です。

---

## Unit 2 (Backend - Game Logic) - Unit Tests

### 1. Execute All Unit Tests

```bash
cd backend
npm test
```

**Expected Output**:
```
PASS  tests/game/CardValidator.test.ts
PASS  tests/game/MultiplierCalculator.test.ts
PASS  tests/game/DoboDeclaration.test.ts
PASS  tests/game/PaymentCalculator.test.ts
PASS  tests/game/DeckManager.test.ts

Test Suites: 5 passed, 5 total
Tests:       37 passed, 37 total
Snapshots:   0 total
Time:        X.XXXs
```

---

### 2. Test Coverage

#### Current Test Coverage
- **CardValidator**: 全検証ケース（有効/無効カード、複数枚出し、ワイルド）
- **MultiplierCalculator**: 各倍率条件の組み合わせ、2^n 計算
- **DoboDeclaration**: 演算式計算（全4演算子）、勝者決定、タイムアウト
- **PaymentCalculator**: ドボン/バースト/ペナルティ支払い計算
- **DeckManager**: デッキ初期化、山札再生成（場の最後の1枚を除く）

#### Test Statistics
- **Total Test Suites**: 5
- **Total Tests**: 37
- **Expected Pass Rate**: 100%
- **Test Coverage**: コアビジネスロジックをカバー

---

### 3. Review Test Results

#### Test Report Location
- **Console Output**: ターミナルに直接表示
- **Coverage Report**: `backend/coverage/` (生成する場合)

#### Success Criteria
- ✅ 全37テストがpass
- ✅ テストスイートが5つ全てpass
- ✅ エラーなし
- ✅ タイムアウトなし

---

### 4. Fix Failing Tests

テストが失敗した場合:

#### Step 1: エラーメッセージを確認
```bash
npm test
```

失敗したテストのエラーメッセージを確認します。

#### Step 2: 特定のテストファイルを実行
```bash
# 特定のテストファイルのみ実行
npm test -- tests/game/CardValidator.test.ts
```

#### Step 3: コードを修正
1. エラーメッセージから問題箇所を特定
2. 該当するソースコードを修正
3. テストを再実行

#### Step 4: 全テストを再実行
```bash
npm test
```

全テストがpassするまで繰り返します。

---

## Unit 1 (Frontend) - Unit Tests

### Status: PENDING

Unit 1 (Frontend) のコード生成が未完了のため、ユニットテストは保留中です。

**Next Steps**:
1. Figmaデザインの完成を待つ
2. Unit 1のコード生成を完了させる
3. フロントエンドのユニットテストを実行

---

## Test Execution Checklist

### Unit 2 (Backend)
- [x] `npm test` が成功する
- [x] 全37テストがpass
- [x] テストスイート5つ全てpass
- [x] エラーなし

### Unit 1 (Frontend)
- [ ] コード生成完了待ち
- [ ] テスト実行保留中

---

## Troubleshooting

### Tests Fail with Module Not Found Errors

**Cause**: 
- 依存関係が未インストール
- importパスの問題

**Solution**:
```bash
# 依存関係を再インストール
npm install

# テストを再実行
npm test
```

---

### Tests Fail with Type Errors

**Cause**: 
- TypeScript型の不一致
- テストファクトリーの問題

**Solution**:
1. TypeScriptコンパイルを確認
```bash
npm run build
```

2. 型エラーを修正

3. テストを再実行
```bash
npm test
```

---

### Tests Timeout

**Cause**: 
- 非同期処理の問題
- 無限ループ

**Solution**:
1. タイムアウトしたテストを特定
```bash
npm test -- --verbose
```

2. 該当テストのロジックを確認

3. タイムアウト時間を調整（必要に応じて）
```typescript
// テストファイル内
jest.setTimeout(10000); // 10秒に延長
```

---

## Next Steps

ユニットテストが全てpassしたら、次のステップに進みます:
1. Integration Test Execution - `integration-test-instructions.md`
