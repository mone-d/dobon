# Build Instructions

## Prerequisites

### Build Tool & Runtime
- **Node.js**: v18.x (LTS)
- **npm**: v9.x 以上
- **Package Manager**: npm

### System Requirements
- **OS**: Windows, macOS, Linux対応
- **Memory**: 1GB以上推奨
- **Disk Space**: 500MB以上

### Environment Setup
- **Frontend Port**: 5173 (Vite dev server)
- **Backend Port**: 3000 (Express server)
- **Development Mode**: npm scripts使用

---

## Build Steps

### Step 1: 依存ライブラリのインストール

#### フロントエンド (Unit 1)
```bash
# プロジェクトルートで実行
npm install

# または個別実行
cd .
npm install
```

#### バックエンド (Unit 2)
```bash
# バックエンドディレクトリで実行
cd backend
npm install
```

**確認**:
```bash
npm list
```
出力: 依存ライブラリが一覧表示されること

---

### Step 2: 環境変数の設定

#### フロントエンド (.env.development)
```bash
# VITE_ プリフィックス付き環境変数
VITE_API_BASE_URL=http://localhost:3000
VITE_WEBSOCKET_URL=ws://localhost:3000
```

#### バックエンド (backend/.env.development)
```bash
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
HEROKU_APP_NAME=dobon-backend
```

---

### Step 3: フロントエンド ビルド

#### 開発ビルド
```bash
npm run dev
```

**期待される出力**:
```
  VITE v4.x.x ready in xxx ms
  ➜  Local:   http://localhost:5173/
  ➜  Press q to quit
```

#### プロダクション ビルド
```bash
npm run build
```

**期待される出力**:
- `dist/` ディレクトリが生成される
- ファイルサイズが表示される
- ビルド完了メッセージ

**ビルド成果物の検証**:
```bash
ls -la dist/
# 以下のファイルが存在することを確認
# - index.html
# - assets/ (JS, CSS, etc.)
```

---

### Step 4: バックエンド ビルド

#### 開発実行（TypeScript コンパイル + 実行）
```bash
cd backend
npm run dev
```

**期待される出力**:
```
[info] Server running on port 3000
[info] WebSocket server initialized
```

#### TypeScript コンパイル（本番用）
```bash
cd backend
npm run build
```

**期待される出力**:
- `dist/` ディレクトリが生成される
- TypeScript が JavaScript にコンパイルされる

**ビルド成果物の検証**:
```bash
ls -la backend/dist/
```

---

### Step 5: マルチパッケージビルド（全体）

```bash
# モノレポ全体のビルド（オプション）
npm run build:all
```

このコマンドで以下が実行される:
1. フロントエンド ビルド
2. バックエンド ビルド
3. 検証

---

### Step 6: ビルド成果物の検証

#### フロントエンド検証
```bash
# dist/ の内容確認
cat dist/index.html | head -20

# JS ファイルが最小化されているか確認
wc -c dist/assets/*.js
```

#### バックエンド検証
```bash
# dist/ の内容確認
ls -la backend/dist/

# 入力ポイントが生成されているか確認
head -20 backend/dist/index.js
```

---

## ビルド出力の成功条件

| 項目 | フロントエンド | バックエンド |
|-----|-------------|-----------|
| ビルド状態 | `dist/` 生成 | `dist/` 生成 |
| ファイル存在 | index.html + assets | index.js + modules |
| ファイルサイズ | > 50KB | > 100KB |
| エラー | なし | なし |
| 警告 | 最小限（許容） | なし |

---

## トラブルシューティング

### Error: Cannot find module
**原因**: 依存ライブラリがインストールされていない

**解決策**:
```bash
# キャッシュクリア
npm cache clean --force
rm -rf node_modules package-lock.json

# 再インストール
npm install
```

### Error: TypeScript compilation failed
**原因**: TypeScript 構文エラー

**解決策**:
```bash
# エラー詳細確認
npm run type-check

# エラー箇所修正
# ファイルを編集して問題を解決
```

### Build fails with "PORT already in use"
**原因**: ポート 3000 が既に使用されている

**解決策**:
```bash
# 既存プロセス停止
lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000   # Windows

# または別のポートで実行
PORT=3001 npm run dev
```

### Build fails with "EACCES" permission error
**原因**: ファイルシステムパーミッション不足

**解決策**:
```bash
# キャッシュクリア＋再インストール
npm install --no-save
```

---

## ビルド確認チェックリスト

- [ ] Node.js v18 インストール確認（`node -v`）
- [ ] npm インストール確認（`npm -v`）
- [ ] `npm install` 成功（エラーなし）
- [ ] フロントエンド ビルド成功（`npm run build`）
- [ ] バックエンド ビルド成功（`cd backend && npm run build`）
- [ ] フロントエンド検証（`dist/` が生成される）
- [ ] バックエンド検証（`backend/dist/` が生成される）
