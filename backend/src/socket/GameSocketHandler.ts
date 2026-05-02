import { Server, Socket } from 'socket.io';
import { GameSession, Player, GameState, Card } from '../types/domain';
import { GameEngine } from './GameEngine';
import { DoboDeclarationService } from './DoboDeclaration';
import { PaymentCalculator } from './PaymentCalculator';
import { Logger } from '../utils/logger';

/**
 * GameSocketHandler - WebSocket イベント一元管理
 *
 * 責務:
 * - クライアント送信イベント（play-card, draw-card など）の処理
 * - ゲーム状態の更新と全プレイヤーへのブロードキャスト
 * - エラーハンドリングと接続管理
 */
export class GameSocketHandler {
  private gameEngine = new GameEngine();
  private doboDeclaration = new DoboDeclarationService();
  private paymentCalculator = new PaymentCalculator();
  private logger = new Logger('GameSocketHandler');

  // セッション管理: roomId → GameSession
  private sessionMap = new Map<string, GameSession>();

  // ソケット管理: socketId → { playerId, roomId }
  private socketPlayerMap = new Map<string, { playerId: string; roomId: string }>();

  // ドボン返し待機タイマー
  private doboTimeoutMap = new Map<string, NodeJS.Timeout>();

  /**
   * WebSocket ハンドラーを登録する
   *
   * @param io Socket.io サーバーインスタンス
   */
  registerHandlers(io: Server): void {
    io.on('connection', (socket: Socket) => {
      const logger = this.logger;
      logger.info('Client connected', { socketId: socket.id });

      // ゲーム開始イベント
      socket.on('game:start', (data: any, callback: any) => this.handleGameStart(socket, data, callback));

      // カード操作イベント
      socket.on('game:play-card', (data: any, callback: any) => this.handlePlayCard(socket, data, callback));
      socket.on('game:draw-card', (data: any, callback: any) => this.handleDrawCard(socket, data, callback));
      socket.on('game:select-suit', (data: any, callback: any) => this.handleSelectSuit(socket, data, callback));

      // ドボン関連イベント
      socket.on('game:declare-dobo', (data: any, callback: any) =>
        this.handleDeclarDobo(socket, data, callback)
      );
      socket.on('game:declare-return', (data: any, callback: any) =>
        this.handleDeclareReturn(socket, data, callback)
      );
      socket.on('game:declare-no-return', (data: any, callback: any) =>
        this.handleDeclareNoReturn(socket, data, callback)
      );

      // その他のイベント
      socket.on('game:leave-next', (data: any, callback: any) => this.handleLeaveNext(socket, data, callback));

      // 接続解除
      socket.on('disconnect', () => this.handleDisconnect(socket));

      // 再接続
      socket.on('game:rejoin', (data: any, callback: any) => this.handleRejoin(socket, data, callback));
    });
  }

  /**
   * ゲームを開始する
   */
  private handleGameStart(socket: Socket, data: any, callback: any): void {
    const { roomId, players, baseRate } = data;
    const logger = this.logger;

    try {
      // GameEngine でゲーム初期化
      const session = this.gameEngine.startGame(players, baseRate);
      this.sessionMap.set(roomId, session);

      // ソケットをルームに参加させる
      socket.join(roomId);
      this.socketPlayerMap.set(socket.id, { playerId: players[0].id, roomId });

      // 全プレイヤーに ゲーム開始通知を送信
      this.broadcastToRoom(roomId, 'game:started', {
        gameId: session.gameState.gameId,
        players: session.gameState.players,
        fieldCard: session.gameState.deckState.fieldCard,
        multiplier: session.multiplierState.totalMultiplier,
        currentPlayer: session.gameState.currentPlayer,
      });

      // 各プレイヤーにゲーム状態を送信（手札情報はカスタマイズ）
      for (const player of session.gameState.players) {
        const gameState = this.buildGameStateForClient(session, player.id);
        socket.to(roomId).emit('game:state-updated', gameState);
      }

      callback({ success: true, gameId: session.gameState.gameId });
      logger.info('Game started', { roomId, playerCount: players.length });
    } catch (error) {
      logger.error('Game start failed', { error: (error as Error).message });
      callback({ success: false, error: (error as Error).message });
    }
  }

  /**
   * カードを出す
   */
  private handlePlayCard(socket: Socket, data: any, callback: any): void {
    const { roomId, playerId, cards } = data;
    const logger = this.logger;

    try {
      const session = this.sessionMap.get(roomId);
      if (!session) {
        logger.warn('Session not found', { roomId });
        callback({ success: false });
        return;
      }

      // GameEngine でカード操作を実行
      const success = this.gameEngine.playCard(session, playerId, cards);

      if (success) {
        // 全プレイヤーに カード出却通知を送信
        this.broadcastToRoom(roomId, 'game:card-played', {
          playerId,
          cards,
          fieldCard: session.gameState.deckState.fieldCard,
          currentPlayer: session.gameState.currentPlayer,
        });

        // 全プレイヤーにゲーム状態を更新
        this.broadcastGameState(roomId, session);
      }

      callback({ success });
      logger.info('Card played', { roomId, playerId, success });
    } catch (error) {
      logger.error('Play card failed', { error: (error as Error).message });
      callback({ success: false });
    }
  }

  /**
   * 山札からカードを引く
   */
  private handleDrawCard(socket: Socket, data: any, callback: any): void {
    const { roomId, playerId } = data;
    const logger = this.logger;

    try {
      const session = this.sessionMap.get(roomId);
      if (!session) {
        logger.warn('Session not found', { roomId });
        callback({ success: false });
        return;
      }

      // GameEngine でカード引く処理を実行
      const card = this.gameEngine.drawCard(session, playerId);

      if (card) {
        // 全プレイヤーに カード引く通知を送信（カード情報は非表示）
        this.broadcastToRoom(roomId, 'game:card-drawn', {
          playerId,
          // card は宣言者のみが見える（callback で返す）
        });

        // 全プレイヤーにゲーム状態を更新
        this.broadcastGameState(roomId, session);

        // 引いたカードを宣言者のみに返す
        callback({ success: true, card });
      } else {
        callback({ success: false });
      }

      logger.info('Card drawn', { roomId, playerId, success: !!card });
    } catch (error) {
      logger.error('Draw card failed', { error: (error as Error).message });
      callback({ success: false });
    }
  }

  /**
   * スートを選択（8のワイルド用）
   */
  private handleSelectSuit(socket: Socket, data: any, callback: any): void {
    const { roomId, playerId, suit } = data;
    const logger = this.logger;

    try {
      const session = this.sessionMap.get(roomId);
      if (!session) {
        logger.warn('Session not found', { roomId });
        callback({ success: false });
        return;
      }

      // GameEngine でスート選択を実行
      this.gameEngine.selectSuit(session, suit);

      // 全プレイヤーに スート指定通知を送信
      this.broadcastToRoom(roomId, 'game:suit-selected', {
        playerId,
        suit,
      });

      // 全プレイヤーにゲーム状態を更新
      this.broadcastGameState(roomId, session);

      callback({ success: true });
      logger.info('Suit selected', { roomId, playerId, suit });
    } catch (error) {
      logger.error('Select suit failed', { error: (error as Error).message });
      callback({ success: false });
    }
  }

  /**
   * ドボン宣言
   */
  private handleDeclarDobo(socket: Socket, data: any, callback: any): void {
    const { roomId, playerId } = data;
    const logger = this.logger;

    try {
      const session = this.sessionMap.get(roomId);
      if (!session) {
        logger.warn('Session not found', { roomId });
        callback({ success: false });
        return;
      }

      const lastPlayedPlayerId = session.gameState.lastPlayedPlayer;

      // DoboDeclarationService でドボン宣言を処理
      const success = this.doboDeclaration.declareDobo(session, playerId, lastPlayedPlayerId);

      if (success) {
        // 全プレイヤーに ドボン通知を送信
        const doboData = session.doboPhaseState.firstDoboDeclaration;
        this.broadcastToRoom(roomId, 'game:dobo', {
          playerId: doboData.playerId,
          formula: doboData.formula,
          cardsUsed: doboData.cards.length,
          timeoutSeconds: 10,
        });

        // ドボン返し待機タイマーを設定
        const timeoutId = setTimeout(() => {
          this.doboDeclaration.handleDoboTimeout(session);
          this.checkDoboPhaseEnd(roomId, session);
        }, 10000);

        this.doboTimeoutMap.set(roomId, timeoutId);

        // 全プレイヤーにゲーム状態を更新
        this.broadcastGameState(roomId, session);
      } else {
        // ペナルティ発生通知
        this.broadcastToRoom(roomId, 'game:penalty', {
          playerId,
          reason: 'invalid_dobo',
        });
      }

      callback({ success });
      logger.info('Dobo declared', { roomId, playerId, success });
    } catch (error) {
      logger.error('Declare dobo failed', { error: (error as Error).message });
      callback({ success: false });
    }
  }

  /**
   * 返しドボン宣言
   */
  private handleDeclareReturn(socket: Socket, data: any, callback: any): void {
    const { roomId, playerId } = data;
    const logger = this.logger;

    try {
      const session = this.sessionMap.get(roomId);
      if (!session) {
        logger.warn('Session not found', { roomId });
        callback({ success: false });
        return;
      }

      const lastPlayedPlayerId = session.gameState.lastPlayedPlayer;

      // DoboDeclarationService で返しドボン宣言を処理
      const success = this.doboDeclaration.declareReturn(session, playerId, lastPlayedPlayerId);

      if (success) {
        // 全プレイヤーに 返しドボン通知を送信
        const returnData = session.doboPhaseState.returnDeclarations[
          session.doboPhaseState.returnDeclarations.length - 1
        ];
        this.broadcastToRoom(roomId, 'game:return', {
          playerId: returnData.playerId,
          formula: returnData.formula,
          cardsUsed: returnData.cards.length,
          isWinner: session.doboPhaseState.pendingPlayerIds.length === 0,
        });

        // ドボンフェーズが終了したか確認
        this.checkDoboPhaseEnd(roomId, session);
      } else {
        // ペナルティ発生通知
        this.broadcastToRoom(roomId, 'game:penalty', {
          playerId,
          reason: 'invalid_return_dobo',
        });
      }

      callback({ success });
      logger.info('Return dobo declared', { roomId, playerId, success });
    } catch (error) {
      logger.error('Declare return failed', { error: (error as Error).message });
      callback({ success: false });
    }
  }

  /**
   * 返さない宣言
   */
  private handleDeclareNoReturn(socket: Socket, data: any, callback: any): void {
    const { roomId, playerId } = data;
    const logger = this.logger;

    try {
      const session = this.sessionMap.get(roomId);
      if (!session) {
        logger.warn('Session not found', { roomId });
        callback({ success: false });
        return;
      }

      // DoboDeclarationService で返さない宣言を処理
      this.doboDeclaration.declareNoReturn(session, playerId);

      // 他プレイヤーには通知しない（非表示ルール）
      // 宣言者のみに成功を返す
      callback({ success: true });

      // ドボンフェーズが終了したか確認
      this.checkDoboPhaseEnd(roomId, session);

      logger.info('No return declared', { roomId, playerId });
    } catch (error) {
      logger.error('Declare no return failed', { error: (error as Error).message });
      callback({ success: false });
    }
  }

  /**
   * 次のゲームで退出宣言
   */
  private handleLeaveNext(socket: Socket, data: any, callback: any): void {
    const { roomId, playerId } = data;
    const logger = this.logger;

    try {
      callback({ success: true });
      logger.info('Leave next declared', { roomId, playerId });
      // 実装省略（ゲーム終了後の処理で使用）
    } catch (error) {
      logger.error('Leave next failed', { error: (error as Error).message });
      callback({ success: false });
    }
  }

  /**
   * 再接続
   */
  private handleRejoin(socket: Socket, data: any, callback: any): void {
    const { roomId, playerId } = data;
    const logger = this.logger;

    try {
      const session = this.sessionMap.get(roomId);
      if (!session) {
        logger.warn('Session not found', { roomId });
        callback({ success: false });
        return;
      }

      // ソケットを更新
      socket.join(roomId);
      this.socketPlayerMap.set(socket.id, { playerId, roomId });

      // ゲーム状態を再送信
      const gameState = this.buildGameStateForClient(session, playerId);
      callback({ success: true, gameState });

      logger.info('Rejoin successful', { roomId, playerId });
    } catch (error) {
      logger.error('Rejoin failed', { error: (error as Error).message });
      callback({ success: false });
    }
  }

  /**
   * 切断
   */
  private handleDisconnect(socket: Socket): void {
    const playerInfo = this.socketPlayerMap.get(socket.id);
    if (playerInfo) {
      this.socketPlayerMap.delete(socket.id);
      this.logger.info('Client disconnected', { socketId: socket.id, playerId: playerInfo.playerId });
    }
  }

  /**
   * ドボンフェーズが終了したか確認
   */
  private checkDoboPhaseEnd(roomId: string, session: GameSession): void {
    if (!session.doboPhaseState.isActive) {
      return;
    }

    if (session.doboPhaseState.pendingPlayerIds.length === 0 || new Date() >= session.doboPhaseState.timeoutAt) {
      // ドボンフェーズ終了
      const winner = this.doboDeclaration.determineWinner(session);

      // 倍率計算
      const multiplier = session.multiplierState.totalMultiplier;

      // ゲーム終了通知
      this.broadcastToRoom(roomId, 'game:ended', {
        winner,
        multiplier,
      });

      // タイマーをクリア
      const timeoutId = this.doboTimeoutMap.get(roomId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.doboTimeoutMap.delete(roomId);
      }

      this.logger.info('Dobo phase ended', { roomId, winner, multiplier });
    }
  }

  /**
   * プレイヤーごとにカスタマイズしたゲーム状態を構築
   *
   * @param session ゲームセッション
   * @param playerId プレイヤーID
   * @returns カスタマイズされたゲーム状態
   */
  private buildGameStateForClient(session: GameSession, playerId: string): any {
    const player = session.gameState.players.find((p) => p.id === playerId);
    if (!player) {
      return null;
    }

    return {
      gameId: session.gameState.gameId,
      currentPlayer: session.gameState.currentPlayer,
      fieldCard: session.gameState.deckState.fieldCard,
      players: session.gameState.players.map((p) => ({
        id: p.id,
        name: p.user.userName,
        handCount: p.hand.length,
        hand: p.id === playerId ? p.hand : undefined, // 自分のみ手札が見える
        isBurst: p.isBurst,
      })),
      multiplier: session.multiplierState.totalMultiplier,
      gamePhase: session.gameState.gamePhase,
      deckRemaining: session.gameState.deckState.deck.length,
    };
  }

  /**
   * ルーム内の全プレイヤーにゲーム状態を送信
   *
   * @param roomId ルームID
   * @param session ゲームセッション
   */
  private broadcastGameState(roomId: string, session: GameSession): void {
    // 各プレイヤーにカスタマイズされたゲーム状態を送信
    for (const player of session.gameState.players) {
      const gameState = this.buildGameStateForClient(session, player.id);
      // Socket.io ブロードキャスト（該当プレイヤーのソケットに送信）
      const sockets = this.socketPlayerMap.get(player.id);
      if (sockets) {
        // TODO: Socket.io で個別送信する方法を確認（複数タブ対応など）
      }
    }
  }

  /**
   * ルーム内の全プレイヤーにイベントをブロードキャスト
   *
   * @param roomId ルームID
   * @param eventName イベント名
   * @param data イベントデータ
   */
  private broadcastToRoom(roomId: string, eventName: string, data: any): void {
    // TODO: Socket.io Server インスタンスを取得してブロードキャスト
    // io.to(roomId).emit(eventName, data);
    this.logger.debug('Broadcast to room', { roomId, eventName });
  }
}
