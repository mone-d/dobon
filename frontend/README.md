# DOBON フロントエンド

オンライン対戦カードゲーム「DOBON」のフロントエンドアプリケーション

## 技術スタック

- **フレームワーク**: React 18 + TypeScript
- **状態管理**: Zustand (with localStorage persistence)
- **スタイリング**: Tailwind CSS v4
- **ビルドツール**: Vite
- **通信**: Socket.io Client, Axios
- **デザイン**: Figma生成コンポーネント

## セットアップ

### 前提条件

- Node.js 18以上
- npm または yarn

### インストール

```bash
npm install
```

### 開発サーバー起動

```bash
npm run dev
```

ブラウザで http://localhost:5173/ を開く

### ビルド

```bash
npm run build
```

ビルド成果物は `dist/` ディレクトリに出力されます。

### プレビュー

```bash
npm run preview
```

ビルドした成果物をローカルでプレビューします。

## プロジェクト構造

```
frontend/
├── src/
│   ├── components/        # Figma生成UIコンポーネント
│   │   ├── DobonEffectOverlay.tsx
│   │   ├── GameField.tsx
│   │   ├── OpponentPlayer.tsx
│   │   ├── PlayerHand.tsx
│   │   └── PlayingCard.tsx
│   ├── screens/           # 画面コンポーネント
│   │   ├── HomeScreen.tsx      # ゲストログイン
│   │   ├── LobbyScreen.tsx     # ルーム一覧
│   │   ├── RoomScreen.tsx      # 待機室
│   │   └── GameScreen.tsx      # ゲーム画面
│   ├── stores/            # Zustand状態管理
│   │   ├── userStore.ts        # ユーザー管理
│   │   ├── gameStore.ts        # ゲーム状態
│   │   └── roomStore.ts        # ルーム管理
│   ├── services/          # 通信サービス
│   │   └── socket.ts           # WebSocket接続
│   ├── types/             # 型定義
│   │   └── domain.ts           # ドメインエンティティ
│   ├── utils/             # ユーティリティ関数
│   │   ├── validation.ts       # カード検証
│   │   ├── formatting.ts       # 表示フォーマット
│   │   ├── calculation.ts      # 支払い計算
│   │   └── helpers.ts          # 汎用ヘルパー
│   ├── styles/            # スタイル
│   │   ├── theme.css           # Figmaテーマ
│   │   ├── globals.css         # グローバルスタイル
│   │   └── tailwind.css        # Tailwind設定
│   ├── App.tsx            # ルートコンポーネント
│   └── main.tsx           # エントリーポイント
├── public/                # 静的ファイル
├── .env.development       # 開発環境設定
├── .env.production        # 本番環境設定
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 主要機能

### 1. ゲストユーザー管理
- ゲストIDの自動生成と保存（localStorage）
- カスタム名前入力

### 2. ルーム管理
- ルーム一覧表示
- ルーム作成（基本レート設定）
- ルーム参加・退出
- プレイヤー準備状態管理

### 3. ゲームプレイ
- リアルタイムゲーム状態表示
- カード選択・プレイ
- ドボン宣言
- 倍率システム表示

### 4. ビジネスルール実装
- カード選択: 異なる数字で自動選択解除
- ドボン検証: 4つの演算式（+, -, *, /）
- 特殊カード効果: A, 2, 8, J, K

### 5. WebSocket統合 ✅ NEW
- バックエンドとのリアルタイム通信
- ゲーム状態の自動同期
- エラーハンドリングと通知
- 自動再接続機能

詳細は [INTEGRATION.md](./INTEGRATION.md) を参照してください。

## 環境変数

### 開発環境 (.env.development)
```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### 本番環境 (.env.production)
```
VITE_API_URL=https://api.dobon.example.com
VITE_WS_URL=wss://api.dobon.example.com
```

## デバッグ機能

開発中は右上にデバッグナビゲーションボタンが表示されます：
- **Lobby**: ロビー画面へ移動
- **Room**: ルーム画面へ移動
- **Game**: ゲーム画面へ移動

## モックデータ

現在、以下のモックデータが実装されています：
- ルーム一覧（3つのルーム）
- ゲーム状態（6人プレイヤー）

バックエンドAPI接続後、モックデータは削除されます。

## デプロイ

### Vercel（推奨）

1. GitHubリポジトリにプッシュ
2. Vercelでプロジェクトをインポート
3. 環境変数を設定
4. 自動デプロイ

### 手動デプロイ

```bash
npm run build
# dist/ ディレクトリを静的ホスティングサービスにアップロード
```

## トラブルシューティング

### ビルドエラー

```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### WebSocket接続エラー

- バックエンドサーバーが起動しているか確認
- 環境変数のURLが正しいか確認
- CORSの設定を確認

## ライセンス

MIT

## 開発者

AIDLC Workflow
