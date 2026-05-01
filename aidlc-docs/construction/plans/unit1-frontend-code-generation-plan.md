# Code Generation Plan - Unit 1 (Frontend) - REVISED

## ユニット概要

**Unit 1: フロントエンド**
- 責務: ゲーム画面、ロビー・ルーム管理、プロフィール・統計画面の実装
- 技術スタック: Vue.js 3 + TypeScript + Pinia + Vite
- 実装方針: モックデータ、モックAPI、モックWebSocket を使用
- コード位置: `src/`（ワークスペースルート）

---

## 🔴 CRITICAL REQUIREMENTS

### 1. 前工程成果物の厳密な参照
**全ての実装は以下のドキュメントに厳密に従うこと**:
- `aidlc-docs/construction/unit1-frontend/functional-design/domain-entities.md`
- `aidlc-docs/construction/unit1-frontend/functional-design/business-logic-model.md`
- `aidlc-docs/construction/unit1-frontend/functional-design/business-rules.md`
- `aidlc-docs/construction/unit1-frontend/functional-design/frontend-components.md`
- `aidlc-docs/construction/unit1-frontend/nfr-requirements/nfr-requirements.md`
- `aidlc-docs/construction/unit1-frontend/nfr-requirements/tech-stack-decisions.md`
- `aidlc-docs/construction/unit1-frontend/nfr-design/nfr-design-patterns.md`
- `aidlc-docs/construction/unit1-frontend/nfr-design/logical-components.md`
- `aidlc-docs/construction/unit1-frontend/infrastructure-design/infrastructure-design.md`
- `aidlc-docs/construction/unit1-frontend/infrastructure-design/deployment-architecture.md`

### 2. デザイン優先アプローチ
- **Step 3 でビジュアルコンポーネントを先行作成**
- ユーザーレビュー後に次のステップへ進む
- カードは視覚的に表現（SVG/画像、NOT 文字列）
- ドラッグ&ドロップ機能を実装

### 3. 各ステップでの検証
- 実装後、必ず参照ドキュメントとの整合性をチェック
- Business Rules との照合を徹底

---

## Code Generation 計画

### [x] Step 1: プロジェクト構造セットアップ

**参照ドキュメント**: 
- `tech-stack-decisions.md`
- `infrastructure-design.md`

**実装内容**:
- `package.json` - Vue 3, TypeScript, Vite, Pinia, Tailwind CSS, Socket.io, Axios
- `vite.config.ts` - Vite 設定（ルートベースコード分割）
- `tsconfig.json` - TypeScript strict mode
- `index.html` - エントリーポイント
- `src/` ディレクトリ構造
- `.gitignore`

**検証項目**:
- [x] 技術スタックが tech-stack-decisions.md と一致
- [x] ディレクトリ構造が適切

**成果物**:
- 基本的なプロジェクト構造
- 依存ライブラリのインストール

**実装完了**: 2026-04-30T14:20:00Z

---

### [x] Step 2: ドメインエンティティ実装

**参照ドキュメント**: 
- `domain-entities.md` ⚠️ **CRITICAL - 全属性を厳密に実装**

**実装内容**:
- `src/types/domain.ts` - 全ドメインエンティティ
  - Card (suit, rank, isPublic)
  - Player (id, name, handCards, score, isActive, isReady, isBurst, payments)
  - GameState (gameId, players, fieldCards, currentPlayerId, phase, doboDeclarations, returnDoboDeclarations, gameResults, settings)
  - Room, DoboDeclaration, ReturnDoboDeclaration, Payment, GameResult, etc.

**検証項目**:
- [x] 全エンティティが domain-entities.md と完全一致
- [x] 全属性が定義されている
- [x] 型定義が正確

**成果物**:
- 完全な型定義ファイル

**実装完了**: 2026-04-30T14:25:00Z

---

### [x] Step 3: デザインコンポーネント実装 ⚠️ **USER REVIEW REQUIRED**

**参照ドキュメント**: 
- `frontend-components.md`
- `business-rules.md`

**実装内容**:
- `src/components/Card.vue` - カードコンポーネント
  - ♠️♥️♦️♣️ のビジュアル表現（Unicode symbols）
  - カード番号の視覚的表示
  - ドラッグ可能（HTML5 Drag and Drop API）
- `src/components/CardHand.vue` - 手札コンポーネント
  - ドラッグ可能なカード配置
  - 選択状態の視覚的フィードバック
- `src/components/FieldCard.vue` - 場札コンポーネント
  - ドロップターゲット
  - 場札の積み重ね表示
- `src/components/DoboDeclarationUI.vue` - ドボン宣言UI
  - **常時表示の4つの式オプション**
  - **ワンタップで宣言（確認ダイアログなし）**
- `src/components/ReturnDoboUI.vue` - 返しドボンUI
  - 返し宣言の可視性ルール実装

**デザイン要件**:
- ✅ カードは視覚的に表現（Unicode symbols）
- ✅ ドラッグ&ドロップ機能
- ✅ リアルなカードゲーム風デザイン
- ✅ モバイルレスポンシブ

**検証項目**:
- [x] カードが視覚的に表現されている（文字列ではない）
- [x] ドラッグ&ドロップが動作する
- [x] ドボンUIが常時4つの式を表示
- [x] ワンタップで宣言可能
- [x] デザインがカードゲーム風

**成果物**:
- 5つのビジュアルコンポーネント
- デモページ (src/views/Home.vue)

**実装完了**: 2026-04-30T14:35:00Z

**⚠️ このステップ完了後、ユーザーレビューを待つ**

---

### [ ] Step 4: Pinia ストア実装

**参照ドキュメント**: 
- `logical-components.md`
- `business-logic-model.md`
- `business-rules.md` ⚠️ **CRITICAL**

**実装内容**:
- `src/stores/user.ts` - ゲストID管理（localStorage）
- `src/stores/game.ts` - ゲーム状態、カード操作、ドボンロジック
- `src/stores/room.ts` - ルーム管理
- `src/stores/statistics.ts` - 統計（メモリ10件、サーバー保存）
- `src/stores/connection.ts` - WebSocket接続状態

**重要なビジネスルール実装**:
- ✅ カード操作: 異なる数字で自動選択解除（business-rules.md Section 2.1）
- ✅ ドボン宣言: 自分のカードでも可能、ルール違反でバーストレベルペナルティ（Section 2.2）
- ✅ 返しドボン: 非表示の宣言、表示される返しイベント（Section 2.3）
- ✅ 支払い計算: 倍率システム（Section 2.4）

**検証項目**:
- [ ] 全ストアメソッドが business-logic-model.md と一致
- [ ] 全ビジネスルールが business-rules.md と一致
- [ ] カード操作ロジックが正確
- [ ] ドボンロジックが正確
- [ ] 返しドボンロジックが正確

**成果物**:
- 5つの Pinia ストア

---

### [ ] Step 5: 通信層実装

**参照ドキュメント**: 
- `logical-components.md`
- `nfr-design-patterns.md`

**実装内容**:
- `src/services/api.ts` - Axios（3回リトライ、1秒間隔）
- `src/services/socket.ts` - Socket.io（デフォルト再接続: 5回、1-5秒間隔）
- `src/services/errorHandler.ts` - グローバルエラーハンドラー（APIエラーのみ）
- `src/services/logger.ts` - 全ゲームイベントログ
- `src/services/notification.ts` - トップバナー通知

**検証項目**:
- [ ] リトライロジックが nfr-design-patterns.md と一致
- [ ] 再接続ロジックが nfr-design-patterns.md と一致
- [ ] エラーハンドリングが適切

**成果物**:
- 通信層サービス

---

### [ ] Step 6: ゲームビュー・ボードコンポーネント実装

**参照ドキュメント**: 
- `frontend-components.md`
- `business-logic-model.md`

**実装内容**:
- `src/views/Game.vue` - メインゲームビュー
- `src/components/GameBoard.vue` - 場札表示、ドラッグ&ドロップハンドラー
- `src/components/PaymentUI.vue` - 支払い表示（倍率内訳）
- `src/components/GameInfo.vue` - 現在のプレイヤー、フェーズ、スコア

**検証項目**:
- [ ] コンポーネント構造が frontend-components.md と一致
- [ ] メソッドが frontend-components.md と一致
- [ ] ドラッグ&ドロップが動作

**成果物**:
- ゲーム画面コンポーネント

---

### [ ] Step 7: ロビー・ルーム管理ビュー実装

**参照ドキュメント**: 
- `frontend-components.md`
- `business-logic-model.md`

**実装内容**:
- `src/views/Home.vue` - ゲストログイン（ID生成・再利用）
- `src/views/Lobby.vue` - ルーム一覧、作成、参加
- `src/views/Room.vue` - 待機室、プレイヤー一覧、準備状態

**検証項目**:
- [ ] ゲストID保存（localStorage）が実装されている
- [ ] ルーム管理フローが正確

**成果物**:
- ロビー・ルーム管理画面

---

### [ ] Step 8: プロフィール・統計ビュー実装

**参照ドキュメント**: 
- `frontend-components.md`
- `logical-components.md`

**実装内容**:
- `src/views/Profile.vue` - プロフィール、ゲーム履歴
- `src/views/Statistics.vue` - ランキング、統計

**検証項目**:
- [ ] メモリ10件、サーバー保存が実装されている

**成果物**:
- プロフィール・統計画面

---

### [ ] Step 9: モック API 実装

**参照ドキュメント**: 
- `frontend-components.md`
- `business-logic-model.md`

**実装内容**:
- `src/mocks/mockApi.ts` - 全APIエンドポイントのモック

**検証項目**:
- [ ] モックデータ構造が domain-entities.md と一致

**成果物**:
- モック API

---

### [ ] Step 10: モック WebSocket 実装

**参照ドキュメント**: 
- `frontend-components.md`
- `business-logic-model.md`
- `business-rules.md`

**実装内容**:
- `src/mocks/mockSocket.ts` - 全WebSocketイベントのモック

**検証項目**:
- [ ] イベントペイロードが domain-entities.md と一致
- [ ] イベントフローが business-rules.md と一致

**成果物**:
- モック WebSocket

---

### [ ] Step 11: ユーティリティ関数実装

**参照ドキュメント**: 
- `business-logic-model.md`
- `business-rules.md`

**実装内容**:
- `src/utils/validation.ts` - カード検証、ドボン式検証
- `src/utils/formatting.ts` - カード表示、スコア表示
- `src/utils/calculation.ts` - 支払い計算（倍率システム）
- `src/utils/helpers.ts` - 汎用ヘルパー

**検証項目**:
- [ ] 計算ロジックが business-rules.md Section 2.4 と一致

**成果物**:
- ユーティリティ関数

---

### [ ] Step 12: ルーティング・ナビゲーション実装

**参照ドキュメント**: 
- `frontend-components.md`
- `nfr-design-patterns.md`

**実装内容**:
- `src/router/index.ts` - Vue Router（ルートベースコード分割）
- ルート設定: Home, Lobby, Room, Game, Profile, Statistics
- ナビゲーションガード

**検証項目**:
- [ ] ルートベースコード分割が実装されている

**成果物**:
- ルーティング設定

---

### [ ] Step 13: Tailwind CSS スタイリング実装

**参照ドキュメント**: 
- `nfr-requirements.md`（リアルなカードゲーム風デザイン）

**実装内容**:
- `src/assets/styles/globals.css`
- `tailwind.config.js` - カードゲームテーマ
- `postcss.config.js`
- カード画像のプリロード（使用する場合）

**検証項目**:
- [ ] デザインが「リアルなカードゲーム風」要件を満たす

**成果物**:
- スタイリング設定

---

### [ ] Step 14: ユニットテスト実装

**参照ドキュメント**: 
- `nfr-requirements.md`（カバレッジ目標なし、最小限）

**実装内容**:
- `tests/validation.test.ts`
- `tests/calculation.test.ts`
- `tests/game.test.ts`

**検証項目**:
- [ ] テストカバレッジが最小限（要件通り）

**成果物**:
- ユニットテスト

---

### [ ] Step 15: 環境設定実装

**参照ドキュメント**: 
- `infrastructure-design.md`
- `deployment-architecture.md`

**実装内容**:
- `.env.development` - HTTP/WS（ローカル開発）
- `.env.production` - HTTPS/WSS（Vercel）
- `vercel.json` - Vercel デプロイ設定
- `.gitignore` 更新

**検証項目**:
- [ ] 環境設定が infrastructure-design.md と一致

**成果物**:
- 環境設定ファイル

---

### [ ] Step 16: ドキュメント生成

**実装内容**:
- `README.md` - セットアップ、実行、ビルド手順
- `docs/API.md` - APIエンドポイント
- `docs/COMPONENTS.md` - コンポーネント一覧
- `docs/SETUP.md` - 詳細セットアップガイド

**成果物**:
- プロジェクトドキュメント

---

### [ ] Step 17: ビルド・デプロイメント設定

**参照ドキュメント**: 
- `deployment-architecture.md`

**実装内容**:
- npm スクリプト設定（dev, build, preview, test）
- Vercel デプロイ設定（GitHub自動デプロイ）
- ビルドプロセステスト

**検証項目**:
- [ ] デプロイパイプラインが deployment-architecture.md と一致

**成果物**:
- ビルド・デプロイ設定

---

### [ ] Step 18: 統合テスト・検証

**参照ドキュメント**: 
- **全ての前工程成果物**

**実装内容**:
- 統合テストチェックリスト作成
- エンドツーエンド動作確認
- **business-rules.md との完全照合（全9カテゴリ）**
- 既知の問題のドキュメント化

**検証項目**:
- [ ] 全機能がエンドツーエンドで動作
- [ ] 全ビジネスルールが実装されている
- [ ] ドラッグ&ドロップが動作
- [ ] カードが視覚的に表現されている
- [ ] ドボンロジックが正確
- [ ] 返しドボンロジックが正確
- [ ] 支払い計算が正確

**成果物**:
- 統合テストチェックリスト
- 既知の問題リスト

---

## 実装サマリー

**総ステップ数**: 18 ステップ

**推定工数**: 50-70 時間（品質重視のPOCレベル）

**実装順序**:
1. プロジェクト構造
2. ドメインエンティティ
3. **デザインコンポーネント（レビュー待ち）** ⚠️
4. Pinia ストア
5. 通信層
6. ゲームビュー・ボード
7. ロビー・ルーム管理
8. プロフィール・統計
9. モック API
10. モック WebSocket
11. ユーティリティ
12. ルーティング
13. スタイリング
14. ユニットテスト
15. 環境設定
16. ドキュメント
17. ビルド・デプロイ
18. 統合テスト・検証

---

## 成功基準

- ✅ 全コンポーネントが正しくレンダリング
- ✅ カードが視覚的に表現されている（文字列ではない）
- ✅ ドラッグ&ドロップ機能が動作
- ✅ 全ビジネスルールが実装されている
- ✅ モックデータがアプリケーション全体で流れる
- ✅ 全画面間のナビゲーションが動作
- ✅ ゲームメカニクスがモックデータで動作
- ✅ コードが適切に構造化され保守可能
- ✅ **実装が全ての前工程成果物と一致**

---

## 次のステップ

このプランが承認されたら、**Step 1 から順番に実装**を進めます。

**Step 3 完了後、ユーザーレビューを待ちます。**

各ステップ完了後、チェックボックス [ ] を [x] に更新して進捗を追跡します。
