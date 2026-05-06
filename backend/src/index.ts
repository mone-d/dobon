import express from 'express';
import cors from 'cors';
import path from 'path';
import { Server } from 'socket.io';
import http from 'http';
import { GameSocketHandler } from './socket/GameSocketHandler';
import { logger } from './utils/logger';

const app = express();

// ミドルウェア設定
app.use(cors()); // CORS: 全オリジン許可
app.use(express.json());

// フロントエンドの静的ファイル配信（本番用）
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// サーバーの作成
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // 全オリジン許可
    methods: ['GET', 'POST'],
  },
});

// GameSocketHandler を初期化
const gameSocketHandler = new GameSocketHandler();
gameSocketHandler.registerHandlers(io);

// ==================== REST API エンドポイント ====================

/**
 * ヘルスチェック
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * ゲーム履歴取得（プレースホルダー）
 */
app.get('/api/games/:gameId', (req, res) => {
  const { gameId } = req.params;
  logger.info('Fetching game history', { gameId });

  // TODO: Firebase から履歴を取得
  res.json({
    gameId,
    date: new Date(),
    players: [],
    winner: 'player_1',
    multiplier: 2,
  });
});

/**
 * ゲームルーム取得（プレースホルダー）
 */
app.get('/api/rooms', (req, res) => {
  logger.info('Fetching rooms');

  // TODO: 現在のゲームルーム一覧を取得
  res.json({
    rooms: [],
  });
});

// ==================== エラーハンドリング ====================

/**
 * SPA フォールバック（フロントエンドのルーティング対応）
 */
app.get('*', (req, res, next) => {
  // APIリクエストはスキップ
  if (req.path.startsWith('/api/') || req.path === '/health') {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

/**
 * 404 エラーハンドラー
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

/**
 * グローバルエラーハンドラー
 */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Server error', { error: err.message });
  res.status(500).json({ error: 'Internal Server Error' });
});

// ==================== サーバー起動 ====================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info('Server started', { port: PORT });
  console.log(`🚀 Dobon Backend Server running on port ${PORT}`);
});

// プロセス終了時のクリーンアップ
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.info('Shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
