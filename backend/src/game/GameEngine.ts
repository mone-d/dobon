import {
  GameSession,
  Card,
  Player,
  GameState,
  DeckState,
  TurnState,
  MultiplierState,
  DoboPhaseState,
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
import { Logger } from '../utils/logger';

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
  private deckManager = new DeckManager();
  private multiplierCalculator = new MultiplierCalculator();
  private logger = new Logger('GameEngine');

  // 特殊カードハンドラーのマップ
  private specialCardHandlers: { [key: string]: SpecialCardHandler } = {
    'A': new ACardHandler(),
    '2': new TwoCardHandler(),
    '8': new EightCardHandler(),
    'J': new JCardHandler(),
    'K': new KCardHandler(),
  };

  /**
   * ゲームを開始する
   *
   * @param players ゲームに参加するプレイヤー配列
   * @param baseRate ゲームの基本レート
   * @returns GameSession
   */
  startGame(players: Player[], baseRate: number): GameSession {
    const logger = this.logger;
    logger.info('Starting game', { playerCount: players.length, baseRate });

    // デッキを初期化
    const deck = this.deckManager.initializeDeck();
    const deckState: DeckState = {
      deck,
      discardPile: [],
      fieldCard: null as any, // 後で設定
      reshuffleCount: 0,
    };

    // 各プレイヤーに5枚配布
    for (const player of players) {
      player.hand = [];
      for (let i = 0; i < 5; i++) {
        const card = this.deckManager.drawCard(deckState);
        player.hand.push(card);
      }
    }

    // 倍率状態を初期化
    const multiplierState: MultiplierState = {
      initialACount: 0,
      drawDoboCount: 0,
      openDoboCount: 0,
      returnDoboCount: 0,
      reshuffleCount: 0,
      totalMultiplier: 1,
    };

    // 初期場札を決定（A の場合は繰り返す）
    let fieldCard: Card;
    while (true) {
      fieldCard = this.deckManager.drawCard(deckState);
      if (fieldCard.value === 'A') {
        // A が出た場合は初期倍率を加算
        this.multiplierCalculator.addInitialA(multiplierState);
        logger.info('Initial A drawn, reshuffling');
        // 再度引く
      } else {
        break;
      }
    }

    deckState.fieldCard = fieldCard;

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
      deckState,
      doboDeclarations: [],
      returnDoboDeclarations: [],
      lastPlayedPlayer: null,
    };

    // ドボンフェーズ状態を初期化
    const doboPhaseState: DoboPhaseState = {
      isActive: false,
      firstDoboDeclaration: null as any,
      returnDeclarations: [],
      pendingPlayerIds: [],
      timeoutAt: new Date(),
    };

    // GameSession を生成
    const session: GameSession = {
      gameState,
      deckState,
      turnState,
      multiplierState,
      doboPhaseState,
      multiplierCalculator: this.multiplierCalculator,
      baseRate,
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
    const { gameState, turnState } = session;
    const logger = this.logger;

    // ターン確認：現在のプレイヤーが playerId か確認
    const currentPlayerId = turnState.turnOrder[turnState.currentPlayerIndex];
    if (currentPlayerId !== playerId) {
      logger.warn('Not current player', { playerId, currentPlayer: currentPlayerId });
      throw new Error('Not current player');
    }

    // 検証：出すカードが有効か確認
    if (!this.cardValidator.validatePlayableCards(cards, gameState.deckState.fieldCard)) {
      logger.debug('Invalid cards', { playerId, cardCount: cards.length });
      return false;
    }

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

    // 捨札に場札を追加
    gameState.deckState.discardPile.push(gameState.deckState.fieldCard);

    // 場札を最後に出したカードに更新
    gameState.deckState.fieldCard = cards[cards.length - 1];

    // 最後に場札を出したプレイヤーを記録
    gameState.lastPlayedPlayer = playerId;

    logger.info('Card played', {
      playerId,
      cardCount: cards.length,
      fieldCard: `${gameState.deckState.fieldCard.value}${gameState.deckState.fieldCard.suit}`,
    });

    // 特殊カード効果を処理
    const lastCard = cards[cards.length - 1];
    const handler = this.specialCardHandlers[lastCard.value as string];
    if (handler) {
      handler.handle(session, cards.length);
      logger.debug('Special card handler executed', { card: lastCard.value, cardCount: cards.length });
    }

    // バースト判定
    if (player.hand.length >= 14) {
      player.isBurst = true;
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
    const logger = this.logger;

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

    // 山札からカードを引く（山札が空の場合は再生成）
    let card: Card | null = null;
    while (!card) {
      if (deckState.deck.length === 0) {
        // 山札を再生成（場の最後の1枚を除く）
        this.deckManager.reshuffleDeck(deckState);
        turnState.openHandPlayerIds = [];
        this.multiplierCalculator.addReshuffle(session.multiplierState);
        logger.info('Deck reshuffled');
      }
      card = this.deckManager.drawCard(deckState);
    }

    // プレイヤーの手札に追加
    player.hand.push(card);

    // ドロー状態を記録
    turnState.hasDrawnThisTurn = true;
    turnState.drawnCardThisTurn = card;

    logger.info('Card drawn', { playerId, cardValue: card.value });

    // バースト判定
    if (player.hand.length >= 14) {
      player.isBurst = true;
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
    const logger = this.logger;

    if (session.gameState.gamePhase !== 'suit-selection') {
      logger.warn('Not in suit selection phase');
      return;
    }

    session.gameState.deckState.fieldCard.suit = suit;
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
    const { turnState, gameState } = session;
    const logger = this.logger;

    // A効果: スキップ処理
    while (turnState.skippedPlayerIds.length > 0) {
      const skipPlayerId = turnState.skippedPlayerIds.shift();
      logger.debug('Player skipped', { playerId: skipPlayerId });
    }

    // 2効果: 強制ドロー処理
    if (turnState.forcedDrawCount > 0) {
      const currentPlayerId = turnState.turnOrder[turnState.currentPlayerIndex];
      const nextPlayerIndex = this.getNextPlayerIndex(session);
      const nextPlayerId = turnState.turnOrder[nextPlayerIndex];
      const nextPlayer = gameState.players.find((p) => p.id === nextPlayerId);

      if (nextPlayer) {
        const drawCount = turnState.forcedDrawCount;
        for (let i = 0; i < drawCount; i++) {
          if (gameState.deckState.deck.length === 0) {
            this.deckManager.reshuffleDeck(gameState.deckState);
            turnState.openHandPlayerIds = [];
            this.multiplierCalculator.addReshuffle(session.multiplierState);
          }
          const card = this.deckManager.drawCard(gameState.deckState);
          nextPlayer.hand.push(card);
        }

        logger.info('Forced draw', { playerId: nextPlayerId, count: drawCount });

        // バースト判定
        if (nextPlayer.hand.length >= 14) {
          nextPlayer.isBurst = true;
          this.finalizeGame(session, nextPlayerId);
          return;
        }
      }

      turnState.forcedDrawCount = 0;
      turnState.hasDrawnThisTurn = true; // 強制ドロー後はターン終了
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
    const activePlayers = session.gameState.players.filter((p) => !p.isBurst);

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
   * ゲームを終了する（勝者決定）
   *
   * @param session ゲームセッション
   * @param loserId 敗北したプレイヤーID（バースト）
   */
  private finalizeGame(session: GameSession, loserId: string): void {
    const logger = this.logger;
    logger.info('Game finalized', { loser: loserId });

    // GameSocketHandler が game:game-ended イベントを送信
    session.gameState.gamePhase = 'ended';
  }
}
