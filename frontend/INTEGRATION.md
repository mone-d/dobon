# DOBON フロントエンド - バックエンド統合完了

## 実装概要

DOBONフロントエンドとバックエンドのWebSocket統合を完了しました。

## 実装内容

### 1. WebSocketイベントハンドラー (`src/stores/gameStore.ts`)

#### 受信イベント
- `game:state-updated` - ゲーム状態の更新
- `game:started` - ゲーム開始通知
- `game:card-played` - カードプレイ通知
- `game:card-drawn` - カードドロー通知
- `game:suit-selected` - スート選択通知
- `game:dobo` - ドボン宣言通知
- `game:return` - 返しドボン通知
- `game:penalty` - ペナルティ通知
- `game:ended` - ゲーム終了通知
- `game:error` - ゲームエラー通知
- `connect` - 接続成功
- `disconnect` - 接続切断
- `connect_error` - 接続エラー
- `reconnect` - 再接続成功
- `reconnect_attempt` - 再接続試行
- `reconnect_error` - 再接続エラー
- `reconnect_failed` - 再接続失敗

#### 送信イベント
- `game:start` - ゲーム開始
- `game:play-card` - カードをプレイ
- `game:draw-card` - カードを引く
- `game:select-suit` - スートを選択（8のワイルド用）
- `game:declare-dobo` - ドボン宣言
- `game:declare-return` - 返しドボン宣言
- `game:declare-no-return` - 返しなし宣言
- `game:rejoin` - ゲームに再参加

### 2. エラーハンドリング

#### エラー状態管理
- `error: string | null` - 現在のエラーメッセージ
- `setError(error: string | null)` - エラーを設定（5秒後に自動クリア）
- `clearError()` - エラーを手動でクリア

#### エラー通知UI (`src/components/ErrorNotification.tsx`)
- 画面上部に表示される赤いトースト通知
- 5秒後に自動的に消える
- 手動で閉じることも可能
- スライドダウンアニメーション付き

### 3. 再接続処理

#### 自動再接続
- Socket.ioの自動再接続機能を使用
- 最大5回まで再接続を試行
- 再接続間隔: 1秒〜5秒（指数バックオフ）

#### ゲーム状態の復元
- 再接続成功時に `game:rejoin` イベントを送信
- バックエンドから最新のゲーム状態を取得
- ユーザーは中断したところから再開可能

### 4. ログ出力

すべてのWebSocketイベントに絵文字付きのログを追加：
- 🎮 ゲーム開始
- 🃏 カードプレイ
- 🎴 カードドロー
- ♠️ スート選択
- 💥 ドボン宣言
- 🔄 返しドボン / 再接続
- 🚫 返しなし
- ✅ 成功
- ❌ エラー
- ⚠️ 警告

## 使用方法

### ゲーム開始

```typescript
const { startGame } = useGameStore();

// ルーム画面でゲーム開始ボタンをクリック
startGame(roomId, players, baseRate);
```

### カード操作

```typescript
const { playCards, drawCard, selectSuit } = useGameStore();

// カードをプレイ
playCards(roomId, playerId, selectedCards);

// カードを引く
drawCard(roomId, playerId);

// スートを選択（8のワイルド用）
selectSuit(roomId, playerId, 'hearts');
```

### ドボン宣言

```typescript
const { declareDobo, declareReturn, declareNoReturn } = useGameStore();

// ドボン宣言
declareDobo(roomId, playerId);

// 返しドボン宣言
declareReturn(roomId, playerId);

// 返しなし宣言
declareNoReturn(roomId, playerId);
```

### エラー処理

```typescript
const { error, clearError } = useGameStore();

// エラーメッセージを表示
if (error) {
  console.error('Error:', error);
}

// エラーを手動でクリア
clearError();
```

## テスト方法

### 1. バックエンドを起動

```bash
cd ../backend
npm run dev
```

### 2. フロントエンドを起動

```bash
npm run dev
```

### 3. ブラウザで確認

1. http://localhost:5173/ を開く
2. ゲストログインして名前を入力
3. ロビー画面でルームを作成または参加
4. ルーム画面でゲーム開始ボタンをクリック
5. ゲーム画面でカードをプレイ

### 4. デバッグナビゲーション

画面右上のデバッグボタンで画面を切り替え可能：
- **Lobby** - ロビー画面
- **Room** - ルーム画面
- **Game** - ゲーム画面

## 今後の改善点

### 1. UI/UX
- [ ] ドボンエフェクトの実装
- [ ] 返しドボンエフェクトの実装
- [ ] ペナルティ通知の実装
- [ ] ゲーム終了画面の実装
- [ ] スート選択ダイアログの実装

### 2. 機能
- [ ] ルーム一覧のリアルタイム更新
- [ ] プレイヤー準備状態の管理
- [ ] チャット機能
- [ ] 観戦機能

### 3. パフォーマンス
- [ ] ゲーム状態の差分更新
- [ ] 画像の遅延読み込み
- [ ] アニメーションの最適化

### 4. テスト
- [ ] ユニットテスト
- [ ] 統合テスト
- [ ] E2Eテスト

## 関連ファイル

- `src/stores/gameStore.ts` - ゲーム状態管理とWebSocket統合
- `src/services/socket.ts` - WebSocket接続管理
- `src/components/ErrorNotification.tsx` - エラー通知UI
- `src/App.tsx` - アプリケーションルート
- `src/globals.css` - グローバルスタイル（アニメーション含む）

## 参考資料

- [Socket.io Client API](https://socket.io/docs/v4/client-api/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
