import { Card, CardValue, DeckState, MultiplierState, Payment, Player } from '../types/domain';
import { DeckManager } from './DeckManager';
import { MultiplierCalculator } from './MultiplierCalculator';
import { logger } from '../utils/logger';

export interface PaymentCardResult {
  drawnCards: Card[];    // 引いたカード全て（A含む）
  finalCard: Card;      // 最終的な支払いカード（A以外）
  cardValue: number;    // 最終カードの値
  aceMultiplier: number; // Aで倍になった回数（2^n）
}

export class PaymentCalculator {
  private deckManager: DeckManager;

  constructor(deckManager: DeckManager) {
    this.deckManager = deckManager;
  }

  /**
   * 支払いカードを引く（A連続ルール対応）
   * Aが出たらレートを倍にしてさらに引く。連続Aなら倍々。
   */
  drawPaymentCardWithAceRule(deckState: DeckState, multiplierState: MultiplierState): PaymentCardResult {
    const drawnCards: Card[] = [];
    let aceMultiplier = 1;

    while (true) {
      if (deckState.deck.length === 0 && deckState.discardPile.length > 0) {
        this.deckManager.reshuffleDeck(deckState);
      }
      if (deckState.deck.length === 0) {
        // 山札が完全に空の場合はデフォルト値1
        logger.warn('Deck empty during payment card draw');
        return {
          drawnCards,
          finalCard: { suit: 'hearts', value: 1, isPublic: false } as Card,
          cardValue: 1,
          aceMultiplier,
        };
      }

      const card = this.deckManager.drawCard(deckState);
      drawnCards.push(card);

      if (card.value === 1) {
        // Aが出た: 倍率を倍にしてさらに引く
        aceMultiplier *= 2;
        logger.info('Payment card A drawn - multiplier doubled', { aceMultiplier });
        continue;
      }

      // A以外: これが最終支払いカード
      return {
        drawnCards,
        finalCard: card,
        cardValue: card.value,
        aceMultiplier,
      };
    }
  }

  /**
   * ドボン時の支払い計算
   */
  calculateDoboPayment(
    baseRate: number,
    multiplierState: MultiplierState,
    deckState: DeckState,
    lastPlayedPlayer: Player,
    winner: Player
  ): Payment {
    const result = this.drawPaymentCardWithAceRule(deckState, multiplierState);
    const amount = result.cardValue * baseRate * multiplierState.totalMultiplier * result.aceMultiplier;
    return {
      payer: lastPlayedPlayer.user,
      payee: winner.user,
      amount,
      reason: 'dobo',
      drawnCard: result.finalCard,
    };
  }

  /**
   * バースト時の支払い計算
   */
  calculateBurstPayment(
    baseRate: number,
    multiplierState: MultiplierState,
    deckState: DeckState,
    burstPlayer: Player,
    allPlayers: Player[]
  ): Payment[] {
    const result = this.drawPaymentCardWithAceRule(deckState, multiplierState);
    const amount = result.cardValue * baseRate * multiplierState.totalMultiplier * result.aceMultiplier;
    return allPlayers
      .filter((p) => p.id !== burstPlayer.id)
      .map((p) => ({
        payer: burstPlayer.user,
        payee: p.user,
        amount,
        reason: 'burst' as const,
        drawnCard: result.finalCard,
      }));
  }

  /**
   * ペナルティ支払い計算（無効ドボン・ルール違反ドボン）
   */
  calculatePenaltyPayment(
    baseRate: number,
    multiplierState: MultiplierState,
    deckState: DeckState,
    penaltyPlayer: Player,
    allPlayers: Player[],
    reason: 'invalid-formula' | 'rule-violation'
  ): Payment[] {
    const result = this.drawPaymentCardWithAceRule(deckState, multiplierState);
    const amount = result.cardValue * baseRate * multiplierState.totalMultiplier * result.aceMultiplier;
    return allPlayers
      .filter((p) => p.id !== penaltyPlayer.id)
      .map((p) => ({
        payer: penaltyPlayer.user,
        payee: p.user,
        amount,
        reason,
        drawnCard: result.finalCard,
      }));
  }

  /**
   * 支払いカードを山札から引く（支払い計算用）- レガシー
   */
  drawPaymentCard(deckState: DeckState): Card {
    return this.deckManager.drawCard(deckState);
  }
}
