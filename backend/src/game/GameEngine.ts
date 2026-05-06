import {
  GameSession,
  Card,
  Player,
  GameState,
  DeckState,
  TurnState,
  MultiplierState,
  DoboPhaseState,
  Suit,
} from '../types/domain';
import { CardValidator } from './CardValidator';
import { DeckManager } from './DeckManager';
import { MultiplierCalculator } from './MultiplierCalculator';
import { ACardHandler } from './handlers/ACardHandler';
import { TwoCardHandler } from './handlers/TwoCardHandler';
import { EightCardHandler } from './handlers/EightCardHandler';
import { JCardHandler } from './handlers/JCardHandler';
import { KCardHandler } from './handlers/KCardHandler';
import { SpecialCardHandler } from './handlers/ACardHandler';
import { logger } from '../utils/logger';

/**
 * GameEngine - ゲーム全体を管理
 *
 * 責務:
 * - ゲーム初期化・状態管理
 * - ターン管理
 * - カード操作の実行
 * - 特殊カード効果の処理
 * - バースト判定
 */
export class GameEngine {
  private cardValidator = new CardValidator();
  private multiplierCalculator = new MultiplierCalculator();
  private deckManager = new DeckManager(this.multiplierCalculator);

  // 特殊カードハンドラーのマップ
  private specialCardHandlers: { [key: number]: SpecialCardHandler } = {
    1: new ACardHandler(),
    2: new TwoCardHandler(),
    8: new EightCardHandler(),
    9: new JCardHandler(),
    13: new KCardHandler(),
  };

  /**
   * ゲームを開始する
   *
   * @param players ゲームに参加するプレイヤー配列
   * @param baseRate ゲームの基本レート
   * @returns GameSession
   */
  startGame(players: Player[], baseRate: number): GameSession {
    logger.info('Starting game', { playerCount: players.length, baseRate });

    // デッキを初期化
    const deck = this.deckManager.initializeDeck();
    const deckState: DeckState = {
      deck,
      discardPile: [],
      fieldCard: null as any, // 後で設定
      reshuffleCount: 0,
      selectedSuit: null,
    };

    // 倍率状態を初期化
    const multiplierState: MultiplierState = {
      initialACount: 0,
      drawDoboCount: 0,
      openDoboCount: 0,
      returnDoboCount: 0,
      reshuffleCount: 0,
      totalMultiplier: 1,
    };

    // 初期場札を決定（TEST_FIXED_FIELD対応、Aの場合は繰り返す）
    // ※ 手札配布の前に場札を確保する（固定手札と場札が同じ値の場合の競合を防ぐ）
    const fieldCard = this.deckManager.determineInitialCard(deckState, multiplierState);

    logger.info('Initial field card determined', { fieldCard: `${fieldCard.value}${fieldCard.suit}`, fixedField: process.env.TEST_FIXED_FIELD || 'none' });

    // 各プレイヤーに5枚配布（TEST_FIXED_HAND対応）
    this.deckManager.dealCards(players, 5, deckState);

    // ターン状態を初期化（ランダムに最初のプレイヤーを決定）
    const randomPlayerIndex = Math.floor(Math.random() * players.length);
    const turnState: TurnState = {
      currentPlayerIndex: randomPlayerIndex,
      turnOrder: players.map((p) => p.id),
      turnDirection: 'forward',
      skippedPlayerIds: [],
      forcedDrawCount: 0,
      hasDrawnThisTurn: false,
      drawnCardThisTurn: null,
      openHandPlayerIds: [],
    };

    // ゲーム状態を初期化
    const gameState: GameState = {
      gameId: `game_${Date.now()}`,
      currentPlayer: players[randomPlayerIndex],
      fieldCard,
      players,
      multiplier: 1,
      gamePhase: 'playing',
      doboDeclarations: [],
      returnDoboDeclarations: [],
      lastPlayedPlayer: null,
      turnOrder: players,
      turnDirection: 'forward',
    };

    // ドボンフェーズ状態を初期化
    const doboPhaseState: DoboPhaseState = {
      isActive: false,
      firstDoboDeclaration: null as any,
      returnDeclarations: [],
      noReturnPlayerIds: [],
      pendingPlayerIds: [],
      timeoutAt: Date.now(),
      timeoutSeconds: 10,
    };

    // GameSession を生成
    const session: GameSession = {
      sessionId: `session_${Date.now()}`,
      roomId: '',
      gameState,
      deckState,
      turnState,
      multiplierState,
      doboPhaseState,
      baseRate,
      leaveNextPlayerIds: [],
      createdAt: Date.now(),
      startedAt: Date.now(),
      endedAt: null,
    };

    logger.info('Game started', {
      gameId: gameState.gameId,
      firstPlayer: gameState.currentPlayer.id,
      fieldCard: `${fieldCard.value}${fieldCard.suit}`,
    });

    return session;
  }

  /**
   * カードを出す
   *
   * @param session ゲームセッション
   * @param playerId プレイヤーID
   * @param cards 出すカード配列
   * @returns true=成功, false=失敗
   */
  playCard(session: GameSession, playerId: string, cards: Card[]): boolean {
    const { gameState, turnState, deckState } = session;

    // ターン確認：現在のプレイヤーが playerId か確認
    const currentPlayerId = turnState.turnOrder[turnState.currentPlayerIndex];
    if (currentPlayerId !== playerId) {
      logger.warn('Not current player', { playerId, currentPlayer: currentPlayerId });
      throw new Error('Not current player');
    }

    // 検証：出すカードが有効か確認
    const validationResult = this.cardValidator.validatePlayableCards(cards, deckState.fieldCard, deckState.selectedSuit);
    if (!validationResult.isValid) {
      logger.debug('Invalid cards', { playerId, cardCount: cards.length, reason: validationResult.reason, cards: cards.map(c => `${c.value}${c.suit}`), fieldCard: `${deckState.fieldCard.value}${deckState.fieldCard.suit}`, selectedSuit: deckState.selectedSuit });
      return false;
    }

    // 強制ドロー中やK効果保留中の制約はGameSocketHandlerで管理

    const player = gameState.players.find((p) => p.id === playerId);
    if (!player) {
      logger.error('Player not found', { playerId });
      return false;
    }

    // プレイヤーの手札から出すカードを除去
    for (const card of cards) {
      const index = player.hand.findIndex(
        (c) => c.suit === card.suit && c.value === card.value
      );
      if (index >= 0) {
        player.hand.splice(index, 1);
      }
    }

    // 捨札に場札を追加（公開状態をリセット）
    deckState.fieldCard.isPublic = false;
    deckState.discardPile.push(deckState.fieldCard);

    // 場札を最後に出したカードに更新
    deckState.fieldCard = cards[cards.length - 1];
    gameState.fieldCard = cards[cards.length - 1];
    deckState.selectedSuit = null; // スート指定をリセット

    // 最後に場札を出したプレイヤーを記録
    gameState.lastPlayedPlayer = player;

    logger.info('Card played', {
      playerId,
      cardCount: cards.length,
      fieldCard: `${deckState.fieldCard.value}${deckState.fieldCard.suit}`,
    });

    // 特殊カード効果を処理
    const lastCard = cards[cards.length - 1];
    
    // 2を出して押し付けた場合、自分は強制ドローを回避
    // （TwoCardHandlerがforcedDrawCountに加算するので、そのまま次のプレイヤーに持ち越し）
    
    // Kを出して押し付けた場合、自分はopenHandPlayerIdsから除外（公開は発生しない）
    if (lastCard.value === 13 && turnState.openHandPlayerIds.includes(playerId)) {
      turnState.openHandPlayerIds = turnState.openHandPlayerIds.filter(id => id !== playerId);
      logger.info('K stacking: player avoided open hand', { playerId });
    }
    // 注意: カードを出しても isPublic は変更しない
    // 公開されたカードは場に出されることで手札から消え、自然に解決される
    
    const handler = this.specialCardHandlers[lastCard.value];
    if (handler) {
      handler.handle(session, cards.length);
      logger.debug('Special card handler executed', { card: lastCard.value, cardCount: cards.length });
    }

    // バースト判定
    if (player.hand.length >= 14) {
      logger.info('Player burst', { playerId, handSize: player.hand.length });
      this.finalizeGame(session, playerId);
      return true;
    }

    // ターン終了（カードが出されたら）
    // ドボン宣言待機フェーズに移行する（WebSocket で待機）
    // GameSocketHandler が game:dobo リッスン
    turnState.hasDrawnThisTurn = false; // ドロー状態をリセット
    turnState.drawnCardThisTurn = null;

    return true;
  }

  /**
   * 山札からカードを引く
   *
   * @param session ゲームセッション
   * @param playerId プレイヤーID
   * @returns 引いたカード、または null（失敗）
   */
  drawCard(session: GameSession, playerId: string): Card | null {
    const { gameState, deckState, turnState } = session;

    // ターン確認
    const currentPlayerId = turnState.turnOrder[turnState.currentPlayerIndex];
    if (currentPlayerId !== playerId) {
      logger.warn('Not current player', { playerId, currentPlayer: currentPlayerId });
      throw new Error('Not current player');
    }

    // 既にドロー済みか確認
    if (turnState.hasDrawnThisTurn) {
      logger.debug('Already drawn this turn', { playerId });
      return null;
    }

    const player = gameState.players.find((p) => p.id === playerId);
    if (!player) {
      logger.error('Player not found', { playerId });
      return null;
    }

    // 山札が空の場合はドロー不可
    if (deckState.deck.length === 0) {
      logger.warn('Deck empty, cannot draw');
      this.endTurn(session);
      return null;
    }

    const card = this.deckManager.drawCard(deckState);

    // プレイヤーの手札に追加
    player.hand.push(card);

    // ドロー状態を記録
    turnState.hasDrawnThisTurn = true;
    turnState.drawnCardThisTurn = card;

    logger.info('Card drawn', { playerId, cardValue: card.value });

    // 山札が0枚になったらリシャッフル + 倍率アップ
    if (deckState.deck.length === 0 && deckState.discardPile.length > 0) {
      this.deckManager.reshuffleDeck(deckState);
      this.multiplierCalculator.addReshuffle(session.multiplierState);
      deckState.reshuffleCount++;
      logger.info('Deck reshuffled (became empty)', { newDeckSize: deckState.deck.length, multiplier: session.multiplierState.totalMultiplier });
    }

    // バースト判定
    if (player.hand.length >= 14) {
      logger.info('Player burst', { playerId, handSize: player.hand.length });
      this.finalizeGame(session, playerId);
      return card;
    }

    // ターン終了（山札から引いたらターン終了）
    this.endTurn(session);

    return card;
  }

  /**
   * スートを選択（8のワイルド用）
   *
   * @param session ゲームセッション
   * @param suit 選択したスート
   */
  selectSuit(session: GameSession, suit: string): void {
    if (session.gameState.gamePhase !== 'suit-selection') {
      logger.warn('Not in suit selection phase');
      return;
    }

    session.deckState.selectedSuit = suit as Suit;
    session.gameState.gamePhase = 'playing';

    logger.info('Suit selected', { suit });

    // ターン終了
    this.endTurn(session);
  }

  /**
   * ターンを終了する
   *
   * @param session ゲームセッション
   */
  endTurn(session: GameSession): void {
    const { turnState, gameState, deckState } = session;

    // A効果: スキップ処理
    while (turnState.skippedPlayerIds.length > 0) {
      const skipPlayerId = turnState.skippedPlayerIds.shift();
      logger.debug('Player skipped', { playerId: skipPlayerId });
    }

    // 2効果: 次のプレイヤーのターンのdrawCardで適用
    // （endTurnでは何もしない。GameSocketHandlerが管理）
    if (turnState.forcedDrawCount > 0) {
      turnState.currentPlayerIndex = this.getNextPlayerIndex(session);
      turnState.hasDrawnThisTurn = false;
      turnState.drawnCardThisTurn = null;

      const nextPlayerId = turnState.turnOrder[turnState.currentPlayerIndex];
      gameState.currentPlayer = gameState.players.find((p) => p.id === nextPlayerId) || gameState.currentPlayer;
      logger.debug('Turn ended with pending forced draw', { nextPlayer: nextPlayerId, forcedDrawCount: turnState.forcedDrawCount });
      return;
    }

    // 次のプレイヤーに移行
    turnState.currentPlayerIndex = this.getNextPlayerIndex(session);
    turnState.hasDrawnThisTurn = false;
    turnState.drawnCardThisTurn = null;

    const nextPlayerId = turnState.turnOrder[turnState.currentPlayerIndex];
    gameState.currentPlayer = gameState.players.find((p) => p.id === nextPlayerId) || gameState.currentPlayer;

    logger.debug('Turn ended', { nextPlayer: nextPlayerId });
  }

  /**
   * 次のプレイヤーのインデックスを取得する
   *
   * @param session ゲームセッション
   * @returns 次のプレイヤーのインデックス
   */
  private getNextPlayerIndex(session: GameSession): number {
    const { turnState } = session;
    const activePlayers = session.gameState.players;

    if (activePlayers.length === 0) {
      return turnState.currentPlayerIndex;
    }

    const currentPlayerIndex = turnState.currentPlayerIndex;
    const totalPlayers = activePlayers.length;

    if (turnState.turnDirection === 'forward') {
      return (currentPlayerIndex + 1) % totalPlayers;
    } else {
      return (currentPlayerIndex - 1 + totalPlayers) % totalPlayers;
    }
  }

  /**
   * 強制ドローを適用する（2の効果）
   */
  applyForcedDraw(session: GameSession, playerId: string): void {
    const { turnState, deckState, gameState } = session;
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;

    const drawCount = turnState.forcedDrawCount;
    for (let i = 0; i < drawCount; i++) {
      if (deckState.deck.length === 0) break;
      const card = this.deckManager.drawCard(deckState);
      player.hand.push(card);
      
      // 山札が0枚になったらリシャッフル + 倍率アップ
      if (deckState.deck.length === 0 && deckState.discardPile.length > 0) {
        this.deckManager.reshuffleDeck(deckState);
        this.multiplierCalculator.addReshuffle(session.multiplierState);
        deckState.reshuffleCount++;
        logger.info('Deck reshuffled during forced draw', { newDeckSize: deckState.deck.length, multiplier: session.multiplierState.totalMultiplier });
      }
    }
    logger.info('Forced draw applied', { playerId, count: drawCount });
    turnState.forcedDrawCount = 0;

    if (player.hand.length >= 14) {
      this.finalizeGame(session, playerId);
      return;
    }
    this.endTurn(session);
  }

  /**
   * 手札公開を適用する（Kの効果）
   * 現在の手札を公開する。新たに引くカードは非公開のまま。
   */
  applyOpenHand(session: GameSession, playerId: string): void {
    const player = session.gameState.players.find(p => p.id === playerId);
    if (!player) return;
    // 現在の手札を公開（新たに引くカードはデフォルトでisPublic=false）
    player.hand.forEach(card => { card.isPublic = true; });
    // 保留状態を解除
    session.turnState.openHandPlayerIds = session.turnState.openHandPlayerIds.filter(id => id !== playerId);
    logger.info('Open hand applied', { playerId, cardCount: player.hand.length });
  }

  /**
   * ゲームを終了する（勝者決定）
   */
  private finalizeGame(session: GameSession, loserId: string): void {
    logger.info('Game finalized', { loser: loserId });

    // GameSocketHandler が game:game-ended イベントを送信
    session.gameState.gamePhase = 'ended';
  }
}
