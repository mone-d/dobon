# Code Generation Plan - Unit 2 (Backend - Game Logic)

## ユニット概要

**Unit 2: バックエンド - ゲームロジック**
- 責務: ゲームロジック、WebSocket通信、特殊カード効果処理
- 技術スタック: Node.js 18 + TypeScript + Express.js + Socket.io
- ホスティング: Heroku（dobon-backend.herokuapp.com）
- コード位置: `backend/`（モノレポ内）

---

## 🔴 CRITICAL REQUIREMENTS

### 前工程成果物の厳密な参照
**全ての実装は以下のドキュメントに厳密に従うこと**:
- `aidlc-docs/construction/unit2-backend/functional-design/domain-entities.md`
- `aidlc-docs/construction/unit2-backend/functional-design/business-logic-model.md`
- `aidlc-docs/construction/unit2-backend/functional-design/business-rules.md`
- `aidlc-docs/construction/unit2-backend/functional-design/api-contracts.md`
- `aidlc-docs/construction/unit2-backend/nfr-requirements/tech-stack-decisions.md`
- `aidlc-docs/construction/unit2-backend/nfr-design/nfr-design-patterns.md`
- `aidlc-docs/construction/unit2-backend/nfr-design/logical-components.md`
- `aidlc-docs/construction/unit2-backend/infrastructure-design/infrastructure-design.md`
- `aidlc-docs/construction/unit2-backend/infrastructure-design/deployment-architecture.md`

---

## Code Generation 計画

### [x] Step 1: プロジェクト構造セットアップ

**参照ドキュメント**:
- `tech-stack-decisions.md`
- `deployment-architecture.md`

**実装内容**:
- `backend/package.json` - 依存ライブラリ定義
- `backend/tsconfig.json` - TypeScript strict mode
- `backend/jest.config.js` - Jest + ts-jest 設定
- `backend/Procfile` - Heroku デプロイ設定
- `backend/.env.development` - 開発環境変数
- `backend/.gitignore`
- ディレクトリ構造作成（src/, tests/）

**検証項目**:
- [x] 依存ライブラリが tech-stack-decisions.md と一致
- [x] TypeScript strict mode が有効
- [x] Procfile が正しく設定されている

---

### [x] Step 2: ドメインエンティティ実装

**参照ドキュメント**:
- `domain-entities.md` ⚠️ **CRITICAL - 全エンティティを厳密に実装**

**実装内容**:
- `backend/src/types/domain.ts` - 全エンティティ定義
  - Unit 1 と共通: User, Card, Player, GameState, DoboDeclaration, ReturnDoboDeclaration, Room, GameResult, Payment, Statistics, Ranking
  - バックエンド専用: DeckState, TurnState, MultiplierState, DoboPhaseState, GameSession, CardValidationResult, DoboValidationResult

**検証項目**:
- [x] 全エンティティが domain-entities.md と完全一致
- [x] TurnState に forcedDrawCount（スタッキング対応）が含まれる
- [x] TurnState に openHandExpiresAtTurnEnd が含まれない（削除済み）
- [x] DoboPhaseState.timeoutSeconds が 10秒

---

### [x] Step 3: Logger 実装

**参照ドキュメント**:
- `nfr-design-patterns.md` Section 5.1

**実装内容**:
- `backend/src/utils/logger.ts` - クラスベースロガー

**検証項目**:
- [x] ISO 8601 タイムスタンプ付き
- [x] ログレベル（debug/info/warn/error）対応
- [x] JSON データ付加対応

---

### [x] Step 4: ゲームロジック実装（コアクラス）

**参照ドキュメント**:
- `business-logic-model.md` ⚠️ **CRITICAL**
- `business-rules.md` ⚠️ **CRITICAL**
- `domain-entities.md`

**実装内容**:
- `backend/src/game/CardValidator.ts`
- `backend/src/game/MultiplierCalculator.ts`
- `backend/src/game/DeckManager.ts`
- `backend/src/game/PaymentCalculator.ts`

**重要な実装ポイント**:
- CardValidator: 8はワイルド、複数枚は同じ数字のみ
- MultiplierCalculator: 2^n 累積計算、オープンドボンは全カード isPublic=true の時のみ
- DeckManager: 定数配列から生成、山札再生成は場の最後の1枚を除く
- PaymentCalculator: ドボン/バースト/ペナルティの3パターン

**検証項目**:
- [x] CardValidator の全検証ケースが business-rules.md と一致
- [x] MultiplierCalculator の倍率計算が正確（2^n）
- [x] DeckManager の山札再生成ルールが正確（場の最後の1枚を除く）
- [x] PaymentCalculator の支払い計算が正確

---

### [x] Step 5: 特殊カードハンドラー実装

**参照ドキュメント**:
- `business-logic-model.md` Section 1.4
- `business-rules.md` Section 2

**実装内容**:
- `backend/src/game/handlers/ACardHandler.ts` - スキップ
- `backend/src/game/handlers/TwoCardHandler.ts` - 2枚ドロー（スタッキング対応）
- `backend/src/game/handlers/EightCardHandler.ts` - ワイルド
- `backend/src/game/handlers/JCardHandler.ts` - リバース
- `backend/src/game/handlers/KCardHandler.ts` - オープン（スタッキング対応）

**重要な実装ポイント**:
- TwoCardHandler: forcedDrawCount に加算、押し付けたプレイヤーはドローしない
- KCardHandler: 押し付けたプレイヤーの手札は公開されない、カードが場に出されるまでオープン継続

**検証項目**:
- [x] 2のスタッキング: 押し付けたプレイヤーはドローしない
- [x] Kのスタッキング: 押し付けたプレイヤーの手札は公開されない
- [x] Kのオープン: ターン終了でクローズされない（カードが場に出されるまで）

---

### [x] Step 6: DoboDeclaration 実装

**参照ドキュメント**:
- `business-logic-model.md` Section 2
- `business-rules.md` Section 3, 4

**実装内容**:
- `backend/src/game/DoboDeclaration.ts`

**重要な実装ポイント**:
- 演算式自動計算: 4演算子を全試行、0除算はスキップ
- ルール違反ドボン: ペナルティ処理後 false を返す
- 返し判定: setTimeout 10秒、pendingPlayerIds が空になったら終了
- 勝者決定: returnDeclarations の配列末尾（最後に宣言したプレイヤー）

**検証項目**:
- [x] 演算式自動計算が正確（4演算子試行）
- [x] タイムアウトが 10秒
- [x] 勝者決定ロジックが配列順序で判定
- [x] 「返さない」宣言が他プレイヤーに通知されない

---

### [x] Step 7: GameEngine 実装

**参照ドキュメント**:
- `business-logic-model.md` Section 1
- `business-rules.md` Section 1, 5, 6, 7

**実装内容**:
- `backend/src/game/GameEngine.ts`

**重要な実装ポイント**:
- ゲーム初期化: DeckManager → MultiplierCalculator（初期A）→ TurnState 初期化
- カード操作: CardValidator → 特殊カードハンドラー → バースト判定 → ターン更新
- ターン管理: currentPlayerIndex を直接管理、スキップ/強制ドロー処理
- バースト判定: 手札 14 枚で即敗北

**検証項目**:
- [x] ゲーム初期化フローが business-logic-model.md と一致
- [x] カード操作フローが正確
- [x] ターン管理（スキップ、強制ドロー、リバース）が正確
- [x] バースト判定が正確（14枚）

---

### [x] Step 8: GameSocketHandler 実装

**参照ドキュメント**:
- `api-contracts.md`
- `nfr-design-patterns.md`
- `logical-components.md`

**実装内容**:
- `backend/src/socket/GameSocketHandler.ts`

**重要な実装ポイント**:
- sessionMap: `Map<roomId, GameSession>`
- socketPlayerMap: `Map<socketId, { playerId, roomId }>`
- buildGameStateForClient: プレイヤーごとに手札情報をカスタマイズ
- broadcastGameState: 全プレイヤーに個別送信
- handleGameAction: try-catch でエラーハンドリング
- game:rejoin: 再接続時の GameState 送信

**検証項目**:
- [x] 全イベントが api-contracts.md と一致
- [x] 手札情報が自分のみ全て、他は isPublic=true のみ
- [x] エラー時に game:error を送信してセッション終了
- [x] 「返さない」宣言が他プレイヤーに通知されない

---

### [x] Step 9: エントリーポイント実装

**参照ドキュメント**:
- `logical-components.md` Section 1
- `infrastructure-design.md`

**実装内容**:
- `backend/src/index.ts` - Express + Socket.io 初期化
- REST API エンドポイント（再接続用）

**検証項目**:
- [x] CORS が全オリジン許可
- [x] ポートが process.env.PORT || 3000
- [x] Socket.io が正しく初期化されている

---

### [x] Step 10: テストファクトリー実装

**参照ドキュメント**:
- `business-rules.md` Section 9.3
- `domain-entities.md`

**実装内容**:
- `backend/tests/factories/CardFactory.ts`
- `backend/tests/factories/PlayerFactory.ts`
- `backend/tests/factories/GameStateFactory.ts`
- `backend/tests/factories/DeckStateFactory.ts`

**検証項目**:
- [x] ファクトリーが domain-entities.md のエンティティを正確に生成

---

### [x] Step 11: ユニットテスト実装

**参照ドキュメント**:
- `business-rules.md` Section 9
- `business-logic-model.md`

**実装内容**:
- `backend/tests/game/CardValidator.test.ts`
- `backend/tests/game/MultiplierCalculator.test.ts`
- `backend/tests/game/DoboDeclaration.test.ts`
- `backend/tests/game/PaymentCalculator.test.ts`
- `backend/tests/game/DeckManager.test.ts`

**重点テストケース**:
- CardValidator: 有効/無効カード、複数枚出し、ワイルド
- MultiplierCalculator: 各倍率条件の組み合わせ、2^n 計算
- DoboDeclaration: 演算式計算（全4演算子）、勝者決定、タイムアウト
- PaymentCalculator: ドボン/バースト/ペナルティ支払い計算
- DeckManager: デッキ初期化、山札再生成（場の最後の1枚を除く）

**検証項目**:
- [x] 全テストが pass
- [x] 境界値テスト（手札14枚、倍率計算）が含まれる

---

### [x] Step 12: ビルド・デプロイ設定

**参照ドキュメント**:
- `deployment-architecture.md`

**実装内容**:
- npm scripts 設定（dev, build, test, start）
- TypeScript コンパイル確認（`npm run build`）
- `backend/README.md` - セットアップ手順

**検証項目**:
- [x] `npm run build` が成功する
- [x] `npm run test` が全テスト pass
- [x] TypeScript エラーがない

---

## 実装サマリー

**総ステップ数**: 12 ステップ

**実装順序**:
1. プロジェクト構造
2. ドメインエンティティ
3. Logger
4. ゲームロジック（コアクラス）
5. 特殊カードハンドラー
6. DoboDeclaration
7. GameEngine
8. GameSocketHandler
9. エントリーポイント
10. テストファクトリー
11. ユニットテスト
12. ビルド・デプロイ設定

---

## 成功基準

- ✅ TypeScript エラーなし（strict mode）
- ✅ 全ユニットテストが pass
- ✅ 全ビジネスルールが business-rules.md と一致
- ✅ 全 WebSocket イベントが api-contracts.md と一致
- ✅ `npm run build` が成功
- ✅ **実装が全ての前工程成果物と一致**
