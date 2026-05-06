# 削除対象ファイル・ディレクトリ

## dobon直下の不要なファイル（Vue.js実装）

### ディレクトリ
- `src/` - 古いVue.js実装
- `node_modules/` - 古い依存関係
- `tests/` - 古いテスト

### ファイル
- `index.html` - 古いエントリーポイント
- `package.json` - 古い依存関係定義
- `package-lock.json` - 古いロックファイル
- `postcss.config.js` - 古いPostCSS設定
- `tailwind.config.js` - 古いTailwind設定
- `tsconfig.json` - 古いTypeScript設定
- `tsconfig.node.json` - 古いTypeScript設定
- `vite.config.ts` - 古いVite設定
- `vitest.config.ts` - 古いVitest設定
- `.env.development` - 古い環境変数（frontendに移動済み）
- `.env.production` - 古い環境変数（frontendに移動済み）

## 削除コマンド

```bash
cd /Users/daichi/Desktop/kiro/projects/dobon

# ディレクトリ削除
rm -rf src/
rm -rf node_modules/
rm -rf tests/

# ファイル削除
rm index.html
rm package.json
rm package-lock.json
rm postcss.config.js
rm tailwind.config.js
rm tsconfig.json
rm tsconfig.node.json
rm vite.config.ts
rm vitest.config.ts
rm .env.development
rm .env.production
```

## 保持するファイル・ディレクトリ

- `backend/` - バックエンド実装
- `frontend/` - フロントエンド実装（React + TypeScript）
- `figma/` - Figmaデザイン資材
- `aidlc-docs/` - AIDLCドキュメント
- `aws-aidlc-rule-details/` - AWS AIDLC設定
- `docs/` - プロジェクトドキュメント
- `.git/` - Gitリポジトリ
- `.github/` - GitHub設定
- `.kiro/` - Kiro設定
- `.vscode/` - VSCode設定
- `game-rule.md` - ゲームルール
- `README.md` - プロジェクトREADME
- `.gitignore` - Git除外設定
