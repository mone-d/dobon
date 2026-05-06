import { Server, Socket } from 'socket.io';
import { GameSession, Player, GameState, Card } from '../types/domain';
import { GameEngine } from '../game/GameEngine';
import { DoboDeclarationService } from '../game/DoboDeclaration';
import { PaymentCalculator } from '../game/PaymentCalculator';
import { DeckManager } from '../game/DeckManager';
import { MultiplierCalculator } from '../game/MultiplierCalculator';
import { logger } from '../utils/logger';

/**
 * Generate a random 4-character uppercase room code
 */
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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
  private multiplierCalculator = new MultiplierCalculator();
  private deckManager = new DeckManager(this.multiplierCalculator);
  private paymentCalculator = new PaymentCalculator(this.deckManager);

  // Socket.io Server インスタンス
  private io: Server | null = null;

  // セッション管理: roomId → GameSession
  private sessionMap = new Map<string, GameSession>();

  // ソケット管理: socketId → { playerId, roomId }
  private socketPlayerMap = new Map<string, { playerId: string; roomId: string }>();

  // ドボン返し待機タイマー
  private doboTimeoutMap = new Map<string, NodeJS.Timeout>();

  // 待機ルーム: roomId → { players, baseRate, roomCode, creatorId }
  private waitingRooms = new Map<string, {
    players: Array<{id: string; user: any; socketId: string}>;
    baseRate: number;
    roomCode: string;
    creatorId: string;
  }>();

  // ルームコード → roomId のマッピング
  private roomCodeMap = new Map<string, string>();

  // 次で抜けるプレイヤー: roomId → Set<playerId>
  private leaveNextPlayerIds = new Map<string, Set<string>>();

  /**
   * WebSocket ハンドラーを登録する
   */
  registerHandlers(io: Server): void {
    this.io = io;
    
    io.on('connection', (socket: Socket) => {
      logger.info('Client connected', { socketId: socket.id });

      // ルーム作成・参加（マルチプレイヤー用）
      socket.on('room:create', (data: any, callback: any) => this.handleRoomCreate(socket, data, callback));
      socket.on('room:join', (data: any, callback: any) => this.handleRoomJoin(socket, data, callback));
      socket.on('room:leave', (data: any, callback: any) => this.handleRoomLeave(socket, data, callback));
      socket.on('room:rejoin', (data: any, callback: any) => this.handleRoomRejoin(socket, data, callback));
      socket.on('room:list', (data: any, callback: any) => this.handleRoomList(socket, data, callback));

      // ゲーム開始イベント
      socket.on('game:start', (data: any, callback: any) => this.handleGameStart(socket, data, callback));

      // ゲーム継続イベント
      socket.on('game:next-round', (data: any, callback: any) => this.handleNextRound(socket, data, callback));

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
      socket.on('game:accept-effect', (data: any, callback: any) => this.handleAcceptEffect(socket, data, callback));

      // 接続解除
      socket.on('disconnect', () => this.handleDisconnect(socket));

      // 再接続
      socket.on('game:rejoin', (data: any, callback: any) => this.handleRejoin(socket, data, callback));
    });
  }

  /**
   * ルーム作成（マルチプレイヤー用）
   * Generates a random 4-char room code, stores room with creator info
   */
  private handleRoomCreate(socket: Socket, data: any, callback: any): void {
    const { player, baseRate } = data;
    
    // Generate unique room code
    let roomCode = generateRoomCode();
    while (this.roomCodeMap.has(roomCode)) {
      roomCode = generateRoomCode();
    }
    
    const roomId = `room-${Date.now()}-${roomCode}`;
    
    logger.info('Room create requested', { roomId, roomCode, playerId: player.id });
    
    this.waitingRooms.set(roomId, {
      players: [{ id: player.id, user: player.user, socketId: socket.id }],
      baseRate: baseRate || 100,
      roomCode,
      creatorId: player.id,
    });
    
    this.roomCodeMap.set(roomCode, roomId);
    
    socket.join(roomId);
    this.socketPlayerMap.set(socket.id, { playerId: player.id, roomId });
    
    // Build room data for client
    const roomData = {
      roomId,
      roomCode,
      creator: player.user,
      players: [player.user],
      baseRate: baseRate || 100,
      status: 'waiting',
      createdAt: new Date(),
    };
    
    callback({ success: true, roomId, roomCode, playerCount: 1, room: roomData });
    logger.info('Room created, waiting for players', { roomId, roomCode });
  }

  /**
   * ルーム参加（マルチプレイヤー用）
   * Accepts roomCode, finds room, adds player, broadcasts update
   */
  private handleRoomJoin(socket: Socket, data: any, callback: any): void {
    const { roomCode, roomId: legacyRoomId, player } = data;
    
    // Support both roomCode (new) and roomId (legacy/testing)
    let roomId: string | undefined;
    if (roomCode) {
      roomId = this.roomCodeMap.get(roomCode.toUpperCase());
    } else if (legacyRoomId) {
      roomId = legacyRoomId;
    }
    
    if (!roomId) {
      // Try legacy roomId directly
      if (legacyRoomId && this.waitingRooms.has(legacyRoomId)) {
        roomId = legacyRoomId;
      } else {
        logger.warn('Room not found', { roomCode, legacyRoomId });
        callback({ success: false, error: 'ルームが見つかりません' });
        return;
      }
    }
    
    const resolvedRoomId = roomId as string;
    
    const room = this.waitingRooms.get(resolvedRoomId);
    if (!room) {
      logger.warn('Room not found', { roomId: resolvedRoomId });
      callback({ success: false, error: 'ルームが見つかりません' });
      return;
    }
    
    // Enforce max 6 players
    if (room.players.length >= 6) {
      logger.warn('Room is full', { roomId: resolvedRoomId, playerCount: room.players.length });
      callback({ success: false, error: 'ルームが満員です（最大6人）' });
      return;
    }
    
    // Check if player already in room
    if (room.players.some(p => p.id === player.id)) {
      logger.warn('Player already in room', { roomId: resolvedRoomId, playerId: player.id });
      callback({ success: false, error: '既にルームに参加しています' });
      return;
    }
    
    // プレイヤーを追加
    room.players.push({ id: player.id, user: player.user, socketId: socket.id });
    socket.join(resolvedRoomId);
    this.socketPlayerMap.set(socket.id, { playerId: player.id, roomId: resolvedRoomId });
    
    logger.info('Player joined room', { roomId: resolvedRoomId, playerId: player.id, playerCount: room.players.length });
    
    // Build room data for all clients
    const roomData = {
      roomId: resolvedRoomId,
      roomCode: room.roomCode,
      creator: room.players.find(p => p.id === room.creatorId)?.user || room.players[0].user,
      players: room.players.map(p => p.user),
      baseRate: room.baseRate,
      status: 'waiting',
      createdAt: new Date(),
    };
    
    // Broadcast room update to all players in room
    this.broadcastToRoom(resolvedRoomId, 'room:updated', roomData);
    
    callback({ success: true, gameStarted: false, playerCount: room.players.length, room: roomData });
  }

  /**
   * ルーム退出
   */
  private handleRoomLeave(socket: Socket, data: any, callback: any): void {
    const { roomId, playerId } = data;
    
    const room = this.waitingRooms.get(roomId);
    if (!room) {
      callback({ success: false, error: 'ルームが見つかりません' });
      return;
    }
    
    // Remove player from room
    room.players = room.players.filter(p => p.id !== playerId);
    socket.leave(roomId);
    this.socketPlayerMap.delete(socket.id);
    
    logger.info('Player left room', { roomId, playerId, remainingPlayers: room.players.length });
    
    // If room is empty, delete it
    if (room.players.length === 0) {
      this.waitingRooms.delete(roomId);
      this.roomCodeMap.delete(room.roomCode);
      logger.info('Room deleted (empty)', { roomId });
    } else {
      // Broadcast updated room to remaining players
      const roomData = {
        roomId,
        roomCode: room.roomCode,
        creator: room.players.find(p => p.id === room.creatorId)?.user || room.players[0].user,
        players: room.players.map(p => p.user),
        baseRate: room.baseRate,
        status: 'waiting',
        createdAt: new Date(),
      };
      this.broadcastToRoom(roomId, 'room:updated', roomData);
    }
    
    callback({ success: true });
  }

  /**
   * ルーム一覧取得
   */
  private handleRoomList(_socket: Socket, _data: any, callback: any): void {
    const rooms = Array.from(this.waitingRooms.entries()).map(([roomId, room]) => ({
      roomId,
      roomCode: room.roomCode,
      creator: room.players.find(p => p.id === room.creatorId)?.user || room.players[0].user,
      players: room.players.map(p => p.user),
      baseRate: room.baseRate,
      status: 'waiting',
      playerCount: room.players.length,
    }));
    
    callback({ success: true, rooms });
  }

  /**
   * ルーム再参加（再接続時）
   * ソケットをSocket.ioルームに再参加させ、最新のルーム状態を返す
   */
  private handleRoomRejoin(socket: Socket, data: any, callback: any): void {
    const { roomId, playerId } = data;
    
    // 待機ルームを確認
    const room = this.waitingRooms.get(roomId);
    if (room) {
      // Socket.ioルームに再参加
      socket.join(roomId);
      this.socketPlayerMap.set(socket.id, { playerId, roomId });
      
      // ソケットIDを更新
      const playerEntry = room.players.find(p => p.id === playerId);
      if (playerEntry) {
        playerEntry.socketId = socket.id;
      }
      
      // 最新のルーム状態を返す
      const roomData = {
        roomId,
        roomCode: room.roomCode,
        creator: room.players.find(p => p.id === room.creatorId)?.user || room.players[0].user,
        players: room.players.map(p => p.user),
        baseRate: room.baseRate,
        status: 'waiting',
        createdAt: new Date(),
      };
      
      callback({ success: true, room: roomData });
      logger.info('Room rejoin successful', { roomId, playerId });
      return;
    }
    
    // ゲームセッションを確認
    const session = this.sessionMap.get(roomId);
    if (session) {
      socket.join(roomId);
      this.socketPlayerMap.set(socket.id, { playerId, roomId });
      callback({ success: true });
      logger.info('Room rejoin (game active)', { roomId, playerId });
      return;
    }
    
    callback({ success: false, error: 'ルームが見つかりません' });
  }

  /**
   * 次のラウンドを開始（ゲーム継続）
   */
  private handleNextRound(socket: Socket, data: any, callback: any): void {
    const { roomId } = data;
    
    try {
      const session = this.sessionMap.get(roomId);
      if (!session) {
        logger.warn('Session not found for next round', { roomId });
        callback({ success: false, error: 'セッションが見つかりません' });
        return;
      }
      
      // Check if any player wants to leave
      const leaveSet = this.leaveNextPlayerIds.get(roomId);
      if (leaveSet && leaveSet.size > 0) {
        // End the room session, notify all players
        this.broadcastToRoom(roomId, 'room:ended', {
          reason: 'player-leaving',
          leavingPlayers: Array.from(leaveSet),
        });
        
        // Clean up
        this.sessionMap.delete(roomId);
        this.leaveNextPlayerIds.delete(roomId);
        
        // Remove all socket mappings for this room
        for (const [socketId, info] of this.socketPlayerMap.entries()) {
          if (info.roomId === roomId) {
            this.socketPlayerMap.delete(socketId);
          }
        }
        
        callback({ success: true, roomEnded: true });
        logger.info('Room ended due to player leaving', { roomId, leavingPlayers: Array.from(leaveSet) });
        return;
      }
      
      // Re-initialize game with same players and baseRate
      const gamePlayers = session.gameState.players.map(p => ({
        id: p.id,
        user: p.user,
        hand: [] as Card[],
        handCount: 0,
        isCurrentPlayer: false,
      }));
      
      const newSession = this.gameEngine.startGame(gamePlayers, session.baseRate);
      this.sessionMap.set(roomId, newSession);
      
      // Broadcast game started to all players
      this.broadcastToRoom(roomId, 'game:started', { roomId,
        gameId: newSession.gameState.gameId,
        players: newSession.gameState.players.map(p => this.simplifyPlayer(p)),
        fieldCard: newSession.deckState.fieldCard,
        multiplier: newSession.multiplierState.totalMultiplier,
        currentPlayer: this.simplifyPlayer(newSession.gameState.currentPlayer),
      });
      
      // Send individual game states
      this.broadcastGameStateToAll(roomId, newSession);
      
      callback({ success: true, gameId: newSession.gameState.gameId });
      logger.info('Next round started', { roomId, gameId: newSession.gameState.gameId });
    } catch (error) {
      logger.error('Next round failed', { error: (error as Error).message });
      callback({ success: false, error: (error as Error).message });
    }
  }

  /**
   * ゲームを開始する
   */
  private handleGameStart(socket: Socket, data: any, callback: any): void {
    const { roomId, players, baseRate, myPlayerId } = data;

    try {
      // Enforce minimum 2 players
      if (!players || players.length < 2) {
        logger.warn('Not enough players to start game', { roomId, playerCount: players?.length || 0 });
        callback({ success: false, error: '最低2人のプレイヤーが必要です' });
        return;
      }
      
      // Enforce maximum 6 players
      if (players.length > 6) {
        logger.warn('Too many players', { roomId, playerCount: players.length });
        callback({ success: false, error: '最大6人までです' });
        return;
      }

      logger.info('Game start requested', { roomId, playerCount: players.length, baseRate, myPlayerId });
      
      // 人間プレイヤーを先頭に移動（TEST_FIXED_HANDが先頭プレイヤーに適用されるため）
      const humanPlayerId = myPlayerId || players[0]?.id || '';
      const reorderedPlayers = [...players];
      if (myPlayerId) {
        const humanIdx = reorderedPlayers.findIndex((p: any) => p.id === myPlayerId);
        if (humanIdx > 0) {
          const [human] = reorderedPlayers.splice(humanIdx, 1);
          reorderedPlayers.unshift(human);
        }
      }
      
      // GameEngine でゲーム初期化
      const session = this.gameEngine.startGame(reorderedPlayers, baseRate);
      this.sessionMap.set(roomId, session);

      // ソケットをルームに参加させる
      socket.join(roomId);
      
      // ゲーム開始したプレイヤーIDを特定
      this.socketPlayerMap.set(socket.id, { playerId: humanPlayerId, roomId });

      logger.info('Human player registered', { socketId: socket.id, humanPlayerId });

      // ゲーム開始通知を送信
      if (process.env.MULTIPLAYER === 'true') {
        this.broadcastToRoom(roomId, 'game:started', { roomId,
          gameId: session.gameState.gameId,
          players: session.gameState.players.map(p => this.simplifyPlayer(p)),
          fieldCard: session.deckState.fieldCard,
          multiplier: session.multiplierState.totalMultiplier,
          currentPlayer: this.simplifyPlayer(session.gameState.currentPlayer),
        });
      } else {
        socket.emit('game:started', {
          roomId,
          gameId: session.gameState.gameId,
          players: session.gameState.players.map(p => this.simplifyPlayer(p)),
          fieldCard: session.deckState.fieldCard,
          multiplier: session.multiplierState.totalMultiplier,
          currentPlayer: this.simplifyPlayer(session.gameState.currentPlayer),
        });
      }

      // 現在のターンが開始プレイヤーでない場合、自動スキップ（最終状態もここで送信）
      this.autoSkipToPlayer(roomId, session, humanPlayerId, socket);

      callback({ success: true, gameId: session.gameState.gameId });
      logger.info('Game started successfully', { roomId, gameId: session.gameState.gameId, playerCount: players.length });
      
      // Clean up waiting room if it exists (game has started)
      if (this.waitingRooms.has(roomId)) {
        const room = this.waitingRooms.get(roomId)!;
        this.roomCodeMap.delete(room.roomCode);
        this.waitingRooms.delete(roomId);
      }
    } catch (error) {
      logger.error('Game start failed', { error: (error as Error).message, stack: (error as Error).stack });
      callback({ success: false, error: (error as Error).message });
    }
  }

  // 効果タイマー: roomId → NodeJS.Timeout
  private effectTimeoutMap = new Map<string, NodeJS.Timeout>();

  /**
   * カードを出す
   */
  private handlePlayCard(socket: Socket, data: any, callback: any): void {
    const { roomId, playerId, cards } = data;

    try {
      const session = this.sessionMap.get(roomId);
      if (!session) {
        logger.warn('Session not found', { roomId });
        callback({ success: false });
        return;
      }

      // 2/K効果の猶予中は、押し付け（2/K）のみ許可
      if (this.effectTimeoutMap.has(roomId)) {
        const lastCard = cards[cards.length - 1];
        const isCounter = lastCard.value === 2 || lastCard.value === 13;
        if (!isCounter) {
          logger.debug('Play blocked during effect pending (not a counter card)', { roomId, playerId });
          callback({ success: false });
          return;
        }
      }

      // ドボンフェーズ中はカードプレイを拒否
      if (session.doboPhaseState.isActive) {
        logger.debug('Play blocked during dobo phase', { roomId, playerId });
        callback({ success: false });
        return;
      }

      // GameEngine でカード操作を実行
      const success = this.gameEngine.playCard(session, playerId, cards);

      if (success) {
        // 8（ワイルドカード）が出された場合、フロントエンドに通知
        const has8 = cards.some((c: any) => c.value === 8);
        if (has8) {
          socket.emit('game:card-played', {
            playerId,
            cards,
          });
          logger.info('Wild card 8 played', { roomId, playerId });
        }
        
        // カードプレイ後、ターンを進める
        if (session.gameState.gamePhase === 'playing') {
          this.gameEngine.endTurn(session);
        }

        // 2/Kの効果判定
        const lastCard = cards[cards.length - 1];
        if (lastCard.value === 2 || lastCard.value === 13) {
          this.handleStackableEffect(roomId, session, lastCard.value);
        }

        // 状態を全プレイヤーに送信
        this.autoSkipToPlayer(roomId, session, playerId, socket);
      }

      callback({ success });
      logger.info('Card played', { roomId, playerId, success });
    } catch (error) {
      logger.error('Play card failed', { error: (error as Error).message });
      callback({ success: false });
    }
  }

  /**
   * 2/Kのスタッキング効果を処理
   * 押し付け可否に関わらず30秒の猶予タイムを設ける
   * 被害者は: 押し付け(2/K出す) / 受け入れ(ボタン) / ドボン / タイムアウト
   */
  private handleStackableEffect(roomId: string, session: GameSession, cardValue: number): void {
    const currentPlayerId = session.turnState.turnOrder[session.turnState.currentPlayerIndex];
    const currentPlayer = session.gameState.players.find(p => p.id === currentPlayerId);
    
    if (!currentPlayer) return;

    const effectType = cardValue === 2 ? 'forced-draw' : 'open-hand';
    const effectCount = cardValue === 2 ? session.turnState.forcedDrawCount : 0;
    const hasCounter = currentPlayer.hand.some(c => c.value === cardValue);

    logger.info('Stackable effect pending', { playerId: currentPlayerId, cardValue, hasCounter, timeout: 30 });
    
    // 全プレイヤーに猶予開始を通知
    logger.info('Broadcasting effect-pending', { roomId, effectType, victimId: currentPlayerId });
    this.broadcastToRoom(roomId, 'game:effect-pending', {
      effectType,
      victimId: currentPlayerId,
      counterCard: cardValue,
      timeoutSeconds: 30,
      effectCount,
      hasCounter,
    });

    // 既存のタイマーをクリア
    const existingTimeout = this.effectTimeoutMap.get(roomId);
    if (existingTimeout) clearTimeout(existingTimeout);

    // 30秒タイムアウト
    const timeoutId = setTimeout(() => {
      this.applyStackableEffect(roomId, session, cardValue);
      this.effectTimeoutMap.delete(roomId);
    }, 30000);

    this.effectTimeoutMap.set(roomId, timeoutId);
  }

  /**
   * 2/Kの効果を発動する（タイムアウトまたは被害者の受け入れ）
   */
  private applyStackableEffect(roomId: string, session: GameSession, cardValue: number): void {
    const currentPlayerId = session.turnState.turnOrder[session.turnState.currentPlayerIndex];
    const effectType = cardValue === 2 ? 'forced-draw' : 'open-hand';

    if (cardValue === 2 && session.turnState.forcedDrawCount > 0) {
      this.gameEngine.applyForcedDraw(session, currentPlayerId);
      logger.info('Forced draw applied', { playerId: currentPlayerId });
    } else if (cardValue === 13) {
      this.gameEngine.applyOpenHand(session, currentPlayerId);
      this.gameEngine.endTurn(session);
      logger.info('Open hand applied', { playerId: currentPlayerId });
    }

    this.broadcastToRoom(roomId, 'game:effect-applied', { effectType, victimId: currentPlayerId });

    // バースト判定
    if (session.gameState.gamePhase === 'ended') {
      this.handleBurstEnd(roomId, session);
    } else {
      this.broadcastGameStateToAll(roomId, session);
    }
  }

  /**
   * 被害者が効果を受け入れる（「2枚引く」/「オープン」ボタン）
   */
  private handleAcceptEffect(socket: Socket, data: any, callback: any): void {
    const { roomId, playerId } = data;

    try {
      const session = this.sessionMap.get(roomId);
      if (!session) {
        callback({ success: false, error: 'Session not found' });
        return;
      }

      // 現在のターンプレイヤーが被害者か確認
      const currentPlayerId = session.turnState.turnOrder[session.turnState.currentPlayerIndex];
      if (currentPlayerId !== playerId) {
        callback({ success: false, error: 'Not the victim' });
        return;
      }

      // タイマーをクリア
      const timeoutId = this.effectTimeoutMap.get(roomId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.effectTimeoutMap.delete(roomId);
      }

      // 効果を発動（forcedDrawCountがあれば2の効果、なければKの効果）
      const cardValue = session.turnState.forcedDrawCount > 0 ? 2 : 13;
      this.applyStackableEffect(roomId, session, cardValue);

      callback({ success: true });
      logger.info('Effect accepted by victim', { roomId, playerId, cardValue });
    } catch (error) {
      logger.error('Accept effect failed', { error: (error as Error).message });
      callback({ success: false });
    }
  }

  /**
   * 山札からカードを引く
   */
  private handleDrawCard(socket: Socket, data: any, callback: any): void {
    const { roomId, playerId } = data;

    try {
      const session = this.sessionMap.get(roomId);
      if (!session) {
        logger.warn('Session not found', { roomId });
        callback({ success: false });
        return;
      }

      // 2/K効果の猶予中は通常ドローを拒否
      if (this.effectTimeoutMap.has(roomId)) {
        logger.debug('Draw blocked during effect pending', { roomId, playerId });
        callback({ success: false });
        return;
      }

      // ドボンフェーズ中はドローを拒否
      if (session.doboPhaseState.isActive) {
        logger.debug('Draw blocked during dobo phase', { roomId, playerId });
        callback({ success: false });
        return;
      }

      // GameEngine でカード引く処理を実行
      const card = this.gameEngine.drawCard(session, playerId);

      if (card) {
        // 引いたカードを宣言者のみに返す
        callback({ success: true, card });

        // 次のターンが別プレイヤーなら自動スキップ（最終状態もここで送信）
        this.autoSkipToPlayer(roomId, session, playerId, socket);
      } else {
        // ドローできない場合（山札が空）
        logger.warn('Draw returned null (deck empty)', { roomId, playerId });
        this.autoSkipToPlayer(roomId, session, playerId, socket);
        callback({ success: false, error: 'deck_empty' });
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

    try {
      const session = this.sessionMap.get(roomId);
      if (!session) {
        logger.warn('Session not found', { roomId });
        callback({ success: false });
        return;
      }

      // GameEngine でスート選択を実行
      this.gameEngine.selectSuit(session, suit);

      // スート選択後、自動スキップ（最終状態もここで送信）
      this.autoSkipToPlayer(roomId, session, playerId, socket);

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

    try {
      const session = this.sessionMap.get(roomId);
      if (!session) {
        logger.warn('Session not found', { roomId });
        callback({ success: false });
        return;
      }

      const lastPlayedPlayerId = session.gameState.lastPlayedPlayer?.id || '';

      // DoboDeclarationService でドボン宣言を処理
      const success = this.doboDeclaration.declareDobo(session, playerId, lastPlayedPlayerId);

      if (success) {
        // 引きドボンフラグを保存（ドボン宣言時点でdrawnCardThisTurnがあれば引きドボン）
        (session.doboPhaseState as any).isDrawDobo = session.turnState.drawnCardThisTurn !== null;
        
        // 全プレイヤーに ドボン通知を送信
        const doboData = session.doboPhaseState.firstDoboDeclaration;
        if (doboData) {
          this.broadcastToRoom(roomId, 'game:dobo', {
            playerId: doboData.playerId,
            formula: doboData.formula,
            cardsUsed: doboData.cards.length,
            timeoutSeconds: 30,
          });
        }

        // ドボン返し待機タイマーを設定
        const timeoutId = setTimeout(() => {
          logger.info('Dobo timeout fired', { roomId });
          this.doboDeclaration.handleDoboTimeout(session);
          // handleDoboTimeout内でdetermineWinnerが呼ばれてisActive=falseになるため、
          // checkDoboPhaseEndではなく直接ゲーム終了処理を行う
          if (!session.doboPhaseState.isActive) {
            // 既にdetermineWinnerで勝者が決定済み
            this.finalizeDoboGame(roomId, session);
          }
        }, 30000);

        this.doboTimeoutMap.set(roomId, timeoutId);

        // 全プレイヤーにゲーム状態を更新
        this.broadcastGameState(roomId, session);
      } else {
        // ゲーム終了（バーストと同じ扱い）
        const penaltyPlayer = session.gameState.players.find(p => p.id === playerId);
        const multiplier = session.multiplierState.totalMultiplier;

        // 山札から支払いカードを引く
        let drawnCard = null;
        let cardValue = 1;
        try {
          if (session.deckState.deck.length === 0 && session.deckState.discardPile.length > 0) {
            this.deckManager.reshuffleDeck(session.deckState);
          }
          if (session.deckState.deck.length > 0) {
            drawnCard = this.deckManager.drawCard(session.deckState);
            cardValue = drawnCard.value;
          }
        } catch {
          // 山札が空の場合は1として計算
        }

        const amount = cardValue * session.baseRate * multiplier;

        session.gameState.gamePhase = 'ended';
        const endData = {
          winnerId: '',
          winnerName: '全員',
          loserName: penaltyPlayer?.user.userName || 'Unknown',
          multiplier,
          baseRate: session.baseRate,
          payments: [{
            payer: penaltyPlayer ? this.simplifyPlayer(penaltyPlayer) : { id: playerId, name: 'Unknown' },
            payee: { id: '', name: '全員' },
            amount,
            reason: 'invalid-formula',
            drawnCard,
          }],
          doboFormula: '',
          returnCount: 0,
          isPenalty: true,
        };

        for (const [socketId, info] of this.socketPlayerMap.entries()) {
          if (info.roomId === roomId && this.io) {
            this.io.to(socketId).emit('game:ended', endData);
          }
        }

        logger.info('Dobo penalty - game ended', { roomId, playerId, amount, cardValue });
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

    try {
      const session = this.sessionMap.get(roomId);
      if (!session) {
        logger.warn('Session not found', { roomId });
        callback({ success: false });
        return;
      }

      const lastPlayedPlayerId = session.gameState.lastPlayedPlayer?.id || '';

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
      callback({ success: true });

      // ドボンフェーズが終了したか確認
      // declareNoReturn内でcheckDoboPhaseEnd→determineWinnerが呼ばれてisActive=falseになる場合がある
      if (!session.doboPhaseState.isActive) {
        // 既に勝者決定済み → ゲーム終了処理
        this.finalizeDoboGame(roomId, session);
        // タイマーをクリア
        const timeoutId = this.doboTimeoutMap.get(roomId);
        if (timeoutId) {
          clearTimeout(timeoutId);
          this.doboTimeoutMap.delete(roomId);
        }
      }

      logger.info('No return declared', { roomId, playerId, pendingRemaining: session.doboPhaseState.pendingPlayerIds.length });
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

    try {
      // Track player in leaveNextPlayerIds
      if (!this.leaveNextPlayerIds.has(roomId)) {
        this.leaveNextPlayerIds.set(roomId, new Set());
      }
      this.leaveNextPlayerIds.get(roomId)!.add(playerId);
      
      callback({ success: true });
      logger.info('Leave next declared', { roomId, playerId });
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
      logger.info('Client disconnected', { socketId: socket.id, playerId: playerInfo.playerId });
    }
  }

  /**
   * ドボンフェーズが終了したか確認
   */
  private checkDoboPhaseEnd(roomId: string, session: GameSession): void {
    if (!session.doboPhaseState.isActive) {
      return;
    }

    if (session.doboPhaseState.pendingPlayerIds.length === 0 || Date.now() >= session.doboPhaseState.timeoutAt) {
      // ドボンフェーズ終了 → 勝者決定
      this.doboDeclaration.determineWinner(session);
      this.finalizeDoboGame(roomId, session);
    }
  }

  /**
   * ドボンゲーム終了処理（支払い計算 + game:ended送信）
   */
  private finalizeDoboGame(roomId: string, session: GameSession): void {
    const doboPhase = session.doboPhaseState;
    
    // 勝者を特定
    let winnerId: string;
    if (doboPhase.returnDeclarations.length > 0) {
      winnerId = doboPhase.returnDeclarations[doboPhase.returnDeclarations.length - 1].playerId;
    } else if (doboPhase.firstDoboDeclaration) {
      winnerId = doboPhase.firstDoboDeclaration.playerId;
    } else {
      logger.error('No dobo declaration found in finalizeDoboGame');
      return;
    }

    const winnerPlayer = session.gameState.players.find(p => p.id === winnerId);
    const lastPlayedPlayer = session.gameState.lastPlayedPlayer;

    // 倍率更新: 条件に応じて加算
    // 引きドボン: 山札から引いたターンにドボン成立 → ×2
    if ((session.doboPhaseState as any).isDrawDobo) {
      this.multiplierCalculator.addDrawDobo(session.multiplierState);
      logger.info('Draw dobon multiplier applied');
    }

    // オープンドボン: 手札が全て公開状態でドボン → ×2
    if (winnerPlayer && winnerPlayer.hand.length > 0 && winnerPlayer.hand.every(c => c.isPublic)) {
      this.multiplierCalculator.addOpenDobo(session.multiplierState);
      logger.info('Open dobon multiplier applied');
    }
    
    // 返しドボンがあれば追加倍率 → ×2 per counter
    for (let i = 0; i < session.doboPhaseState.returnDeclarations.length; i++) {
      this.multiplierCalculator.addReturnDobo(session.multiplierState);
    }

    const multiplier = session.multiplierState.totalMultiplier;

    // 支払い計算
    let payments: any[] = [];
    let loserName = '';
    try {
      if (lastPlayedPlayer && winnerPlayer) {
        const payment = this.paymentCalculator.calculateDoboPayment(
          session.baseRate,
          session.multiplierState,
          session.deckState,
          lastPlayedPlayer,
          winnerPlayer
        );
        payments = [{
          payer: this.simplifyPlayer(lastPlayedPlayer),
          payee: this.simplifyPlayer(winnerPlayer),
          amount: payment.amount,
          reason: payment.reason,
          drawnCard: payment.drawnCard,
        }];
        loserName = lastPlayedPlayer.user.userName;
      }
    } catch (e) {
      logger.warn('Payment calculation failed (deck empty)', { error: (e as Error).message });
      if (lastPlayedPlayer && winnerPlayer) {
        payments = [{
          payer: this.simplifyPlayer(lastPlayedPlayer),
          payee: this.simplifyPlayer(winnerPlayer),
          amount: session.baseRate * multiplier,
          reason: 'dobo',
          drawnCard: null,
        }];
        loserName = lastPlayedPlayer.user.userName;
      }
    }

    // ゲームフェーズを終了に設定
    session.gameState.gamePhase = 'ended';

    // ゲーム終了通知（詳細情報付き）
    const endData = {
      winnerId,
      winnerName: winnerPlayer ? winnerPlayer.user.userName : 'Unknown',
      loserId: lastPlayedPlayer?.id || '',
      loserName,
      multiplier,
      baseRate: session.baseRate,
      payments,
      doboFormula: session.doboPhaseState.firstDoboDeclaration?.formula || '',
      doboCards: session.doboPhaseState.firstDoboDeclaration?.cards || [],
      fieldCard: session.deckState.fieldCard,
      returnCount: session.doboPhaseState.returnDeclarations.length,
    };

    // POC: 直接ソケットに送信
    for (const [socketId, info] of this.socketPlayerMap.entries()) {
      if (info.roomId === roomId && this.io) {
        this.io.to(socketId).emit('game:ended', endData);
      }
    }

    // タイマーをクリア
    const timeoutId = this.doboTimeoutMap.get(roomId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.doboTimeoutMap.delete(roomId);
    }

    logger.info('Game ended', { roomId, winnerId, winnerName: endData.winnerName, loserName, multiplier, payments: payments.length });
  }

  /**
   * プレイヤーオブジェクトを簡略化形式に変換
   */
  private simplifyPlayer(player: Player): { id: string; name: string } {
    return {
      id: player.id,
      name: player.user.userName,
    };
  }

  /**
   * 指定プレイヤーのターンになるまで他プレイヤーを自動ドローでスキップ
   * POC用: 1ブラウザでのテストを可能にする
   *
   * @param roomId ルームID
   * @param session ゲームセッション
   * @param humanPlayerId 操作中のプレイヤーID
   * @param socket 操作中のソケット
   */
  private autoSkipToPlayer(roomId: string, session: GameSession, humanPlayerId: string, socket: Socket): void {
    // バースト判定: ゲームが終了している場合
    if (session.gameState.gamePhase === 'ended') {
      this.handleBurstEnd(roomId, session);
      return;
    }

    // マルチプレイヤーモード: 自動スキップを無効化し、全プレイヤーに状態を送信
    if (process.env.MULTIPLAYER === 'true') {
      this.broadcastGameStateToAll(roomId, session);
      return;
    }

    const maxSkips = session.gameState.players.length * 3; // 無限ループ防止
    let skipped = 0;
    const aiPlayCards = process.env.AI_PLAY_CARDS !== 'false'; // デフォルトはtrue

    while (
      session.gameState.currentPlayer.id !== humanPlayerId &&
      session.gameState.gamePhase === 'playing' &&
      skipped < maxSkips
    ) {
      const aiPlayerId = session.turnState.turnOrder[session.turnState.currentPlayerIndex];
      
      // 山札も捨て札も空ならドローせずにターンを進める（リシャッフルの重複防止）
      if (session.deckState.deck.length === 0 && session.deckState.discardPile.length === 0) {
        this.gameEngine.endTurn(session);
        skipped++;
        continue;
      }

      // AIプレイヤーはカードを出せるなら出す、出せなければドロー
      try {
        const aiPlayer = session.gameState.players.find(p => p.id === aiPlayerId);
        let played = false;
        
        if (aiPlayCards && aiPlayer && aiPlayer.hand.length > 0) {
          // 出せるカードを探す
          const fieldCard = session.deckState.fieldCard;
          const effectiveSuit = session.deckState.selectedSuit || fieldCard.suit;
          const playableCard = aiPlayer.hand.find(c => 
            c.value === 8 || c.value === fieldCard.value || c.suit === effectiveSuit
          );
          
          if (playableCard) {
            const success = this.gameEngine.playCard(session, aiPlayerId, [playableCard]);
            if (success) {
              if (session.gameState.gamePhase === 'playing') {
                this.gameEngine.endTurn(session);
              } else if (session.gameState.gamePhase === 'suit-selection') {
                // AIが8を出した場合、ランダムにスートを選択
                const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
                this.gameEngine.selectSuit(session, suits[Math.floor(Math.random() * 4)]);
              }
              played = true;
              logger.info('Auto-skip: AI played card', { playerId: aiPlayerId, card: `${playableCard.value}${playableCard.suit}` });
            }
          }
        }
        
        if (!played) {
          // カードを出せない場合はドロー
          const card = this.gameEngine.drawCard(session, aiPlayerId);
          if (card) {
            // AIがドローした場合もlastPlayedPlayerを更新（ドボンのルール違反チェック用）
            const aiPlayer = session.gameState.players.find(p => p.id === aiPlayerId);
            if (aiPlayer) {
              session.gameState.lastPlayedPlayer = aiPlayer;
            }
            logger.info('Auto-skip: AI drew card', { playerId: aiPlayerId, card: `${card.value}${card.suit}` });
          } else {
            // ドローもできない場合（drawCard内でendTurn済み）
          }
        }
      } catch {
        // エラー時はターンを強制終了
        this.gameEngine.endTurn(session);
      }
      skipped++;
    }

    // 人間プレイヤーのターンに戻ったら、ドロー状態をリセット
    if (session.gameState.currentPlayer.id === humanPlayerId) {
      session.turnState.hasDrawnThisTurn = false;
      session.turnState.drawnCardThisTurn = null;
    }

    if (skipped > 0) {
      logger.info('Auto-skipped turns', { skipped, nextPlayer: session.gameState.currentPlayer.id });
    }

    // 最新のゲーム状態を送信
    const gameStateForPlayer = this.buildGameStateForClient(session, humanPlayerId);
    logger.info('Sending state to player', {
      humanPlayerId,
      currentPlayer: session.gameState.currentPlayer.id,
      handCounts: session.gameState.players.map(p => ({ id: p.id.substring(0, 8), count: p.hand.length })),
    });
    socket.emit('game:state-updated', gameStateForPlayer);
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

    const currentPlayerId = session.turnState.turnOrder[session.turnState.currentPlayerIndex];

    return {
      gameId: session.gameState.gameId,
      currentPlayer: this.simplifyPlayer(session.gameState.currentPlayer),
      fieldCard: session.deckState.fieldCard,
      players: session.gameState.players.map((p) => ({
        id: p.id,
        name: p.user.userName,
        handCount: p.hand.length,
        hand: p.id === playerId
          ? p.hand
          : p.hand.filter(c => c.isPublic).length > 0
            ? p.hand.filter(c => c.isPublic)
            : undefined,
        isCurrentPlayer: p.id === currentPlayerId,
      })),
      multiplier: session.multiplierState.totalMultiplier,
      gamePhase: session.gameState.gamePhase,
      lastPlayedPlayer: session.gameState.lastPlayedPlayer ? this.simplifyPlayer(session.gameState.lastPlayedPlayer) : null,
      turnOrder: session.turnState.turnOrder,
      turnDirection: session.turnState.turnDirection,
      deckRemaining: session.deckState.deck.length,
      selectedSuit: session.deckState.selectedSuit,
      // 特殊カード効果情報
      effects: {
        forcedDrawCount: session.turnState.forcedDrawCount,
        openHandPlayerIds: session.turnState.openHandPlayerIds,
        skippedPlayerIds: session.turnState.skippedPlayerIds,
      },
    };
  }

  /**
   * バーストによるゲーム終了処理
   */
  private handleBurstEnd(roomId: string, session: GameSession): void {
    const burstPlayer = session.gameState.players.find(p => p.hand.length >= 14);
    if (!burstPlayer) return;

    const multiplier = session.multiplierState.totalMultiplier;
    
    // 山札から支払いカードを引く
    let drawnCard = null;
    let cardValue = 1;
    try {
      if (session.deckState.deck.length === 0 && session.deckState.discardPile.length > 0) {
        this.deckManager.reshuffleDeck(session.deckState);
      }
      if (session.deckState.deck.length > 0) {
        drawnCard = this.deckManager.drawCard(session.deckState);
        cardValue = drawnCard.value;
      }
    } catch {
      // 山札が空の場合は1として計算
    }

    const amount = cardValue * session.baseRate * multiplier;

    const endData = {
      winnerId: '',
      winnerName: '全員',
      loserName: burstPlayer.user.userName,
      multiplier,
      baseRate: session.baseRate,
      payments: [{
        payer: this.simplifyPlayer(burstPlayer),
        payee: { id: '', name: '全員' },
        amount,
        reason: 'burst',
        drawnCard,
      }],
      doboFormula: '',
      returnCount: 0,
      isBurst: true,
    };

    for (const [socketId, info] of this.socketPlayerMap.entries()) {
      if (info.roomId === roomId && this.io) {
        this.io.to(socketId).emit('game:ended', endData);
      }
    }

    logger.info('Game ended by burst', { roomId, burstPlayer: burstPlayer.id, amount, cardValue });
  }

  /**
   * ルーム内の全プレイヤーにゲーム状態を送信（マルチプレイヤー用）
   */
  private broadcastGameStateToAll(roomId: string, session: GameSession): void {
    if (!this.io) return;
    
    for (const [socketId, info] of this.socketPlayerMap.entries()) {
      if (info.roomId === roomId) {
        const gameState = this.buildGameStateForClient(session, info.playerId);
        this.io.to(socketId).emit('game:state-updated', gameState);
      }
    }
  }

  /**
   * ルーム内の全プレイヤーにゲーム状態を送信
   *
   * @param roomId ルームID
   * @param session ゲームセッション
   */
  private broadcastGameState(roomId: string, session: GameSession): void {
    if (!this.io) {
      logger.warn('Socket.io instance not available');
      return;
    }
    
    // 各プレイヤーにカスタマイズされたゲーム状態を送信
    for (const player of session.gameState.players) {
      const gameState = this.buildGameStateForClient(session, player.id);
      
      // Find socket for this player
      for (const [socketId, info] of this.socketPlayerMap.entries()) {
        if (info.playerId === player.id && info.roomId === roomId) {
          this.io.to(socketId).emit('game:state-updated', gameState);
        }
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
    if (!this.io) {
      logger.warn('Socket.io instance not available');
      return;
    }
    
    this.io.to(roomId).emit(eventName, data);
    logger.debug('Broadcast to room', { roomId, eventName });
  }
}
