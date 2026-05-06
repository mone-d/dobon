# Build Instructions

## Prerequisites

### Unit 1 (Frontend)
- **Build Tool**: Vite 5.x
- **Dependencies**: Node.js 18+, npm 9+
- **Environment Variables**: 
  - `VITE_API_URL` - バックエンドAPIのURL（開発: http://localhost:3000）
  - `VITE_WS_URL` - WebSocketのURL（開発: ws://localhost:3000）
- **System Requirements**: macOS/Linux/Windows, 2GB RAM, 500MB disk space

### Unit 2 (Backend - Game Logic)
- **Build Tool**: TypeScript Compiler (tsc) 5.x
- **Dependencies**: Node.js 18+, npm 9+
- **Environment Variables**: 
  - `PORT` - サーバーポート（デフォルト: 3000）
  - `NODE_ENV` - 環境（development/production）
- **System Requirements**: macOS/Linux/Windows, 2GB RAM, 500MB disk space

---

## Build Steps

### 1. Install Dependencies

#### Unit 1 (Frontend)
```bash
cd frontend
npm install
```

**Expected Output**: 
- 依存関係が正常にインストールされる
- `node_modules/` ディレクトリが作成される
- package-lock.json が更新される

#### Unit 2 (Backend)
```bash
cd backend
npm install
```

**Expected Output**: 
- 依存関係が正常にインストールされる
- `node_modules/` ディレクトリが作成される
- package-lock.json が更新される

---

### 2. Configure Environment

#### Unit 1 (Frontend)
```bash
cd frontend
# 開発環境用の環境変数を設定（.env.developmentは既に存在）
cat .env.development
# VITE_API_URL=http://localhost:3000
# VITE_WS_URL=ws://localhost:3000
```

#### Unit 2 (Backend)
```bash
cd backend
# 開発環境用の環境変数を設定（.env.developmentは既に存在）
cat .env.development
# PORT=3000
# NODE_ENV=development
```

---

### 3. Build All Units

#### Unit 2 (Backend) - ビルド実行
```bash
cd backend
npm run build
```

**Expected Output**: 
- TypeScriptコンパイルが成功
- `dist/` ディレクトリにJavaScriptファイルが生成される
- エラーなし（strict mode有効）

**Build Artifacts**:
- `backend/dist/` - コンパイル済みJavaScriptファイル
- `backend/dist/game/` - ゲームロジッククラス
- `backend/dist/socket/` - WebSocketハンドラー
- `backend/dist/types/` - 型定義
- `backend/dist/utils/` - ユーティリティ
- `backend/dist/index.js` - エントリーポイント

#### Unit 1 (Frontend) - ビルド実行
```bash
cd frontend
npm run build
```

**Expected Output**: 
- Viteビルドが成功
- `dist/` ディレクトリに最適化されたファイルが生成される
- バンドルサイズの警告が表示される場合あり（許容範囲内）

**Build Artifacts**:
- `frontend/dist/` - 本番用ビルドファイル
- `frontend/dist/index.html` - エントリーHTML
- `frontend/dist/assets/` - 最適化されたJS/CSSファイル

---

### 4. Verify Build Success

#### Unit 2 (Backend)
- **Expected Output**: `✓ Compiled successfully` または類似のメッセージ
- **Build Artifacts**: `backend/dist/` に全ファイルが存在
- **Common Warnings**: なし（strict mode有効のため警告もエラー扱い）

#### Unit 1 (Frontend)
- **Expected Output**: `✓ built in [X]ms` または類似のメッセージ
- **Build Artifacts**: `frontend/dist/` に全ファイルが存在
- **Common Warnings**: 
  - バンドルサイズの警告（500KB以下なら許容範囲）
  - ソースマップの警告（開発時のみ）

---

## Troubleshooting

### Build Fails with Dependency Errors

**Cause**: 
- `node_modules/` が破損している
- package-lock.json とpackage.jsonの不整合
- Node.jsバージョンの不一致

**Solution**:
```bash
# node_modules と package-lock.json を削除
rm -rf node_modules package-lock.json

# 依存関係を再インストール
npm install

# ビルドを再実行
npm run build
```

---

### Build Fails with TypeScript Compilation Errors (Backend)

**Cause**: 
- 型エラー
- import/exportの問題
- tsconfig.jsonの設定ミス

**Solution**:
1. エラーメッセージを確認
```bash
npm run build
```

2. 型エラーを修正
```bash
# 型チェックのみ実行
npx tsc --noEmit
```

3. ビルドを再実行
```bash
npm run build
```

---

### Build Fails with Vite Errors (Frontend)

**Cause**: 
- 環境変数の未設定
- importパスの問題
- プラグインの設定ミス

**Solution**:
1. 環境変数を確認
```bash
cat .env.development
```

2. Vite設定を確認
```bash
cat vite.config.ts
```

3. キャッシュをクリアして再ビルド
```bash
rm -rf node_modules/.vite
npm run build
```

---

## Build Verification Checklist

### Unit 2 (Backend)
- [ ] `npm run build` が成功する
- [ ] `backend/dist/` ディレクトリが存在する
- [ ] `backend/dist/index.js` が存在する
- [ ] TypeScriptエラーがない

### Unit 1 (Frontend)
- [ ] `npm run build` が成功する
- [ ] `frontend/dist/` ディレクトリが存在する
- [ ] `frontend/dist/index.html` が存在する
- [ ] `frontend/dist/assets/` にJS/CSSファイルが存在する

---

## Next Steps

ビルドが成功したら、次のテスト実行に進みます:
1. Unit Test Execution - `unit-test-instructions.md`
2. Integration Test Execution - `integration-test-instructions.md`
