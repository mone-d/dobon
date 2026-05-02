import { Card, DeckState, MultiplierState, Payment, Player } from '../types/domain';
import { DeckManager } from './DeckManager';

export class PaymentCalculator {
  private deckManager: DeckManager;

  constructor(deckManager: DeckManager) {
    this.deckManager = deckManager;
  }

  /**
   * ドボン時の支払い計算
   * 場札を出したプレイヤー（lastPlayedPlayer）が勝者に支払う
   * payment = drawnCard.value × baseRate × totalMultiplier
   */
  calculateDoboPayment(
    baseRate: number,
    multiplierState: MultiplierState,
    deckState: DeckState,
    lastPlayedPlayer: Player,
    winner: Player
  ): Payment {
    const drawnCard = this.deckManager.drawCard(deckState);
    const amount = drawnCard.value * baseRate * multiplierState.totalMultiplier;
    return {
      payer: lastPlayedPlayer.user,
      payee: winner.user,
      amount,
      reason: 'dobo',
      drawnCard,
    };
  }

  /**
   * バースト時の支払い計算
   * 敗者が自分以外の全プレイヤーに支払う
   * burst_payment = drawnCard.value × baseRate × totalMultiplier（各プレイヤーに同額）
   */
  calculateBurstPayment(
    baseRate: number,
    multiplierState: MultiplierState,
    deckState: DeckState,
    burstPlayer: Player,
    allPlayers: Player[]
  ): Payment[] {
    const drawnCard = this.deckManager.drawCard(deckState);
    const amount = drawnCard.value * baseRate * multiplierState.totalMultiplier;
    return allPlayers
      .filter((p) => p.id !== burstPlayer.id)
      .map((p) => ({
        payer: burstPlayer.user,
        payee: p.user,
        amount,
        reason: 'burst' as const,
        drawnCard,
      }));
  }

  /**
   * ペナルティ支払い計算（無効ドボン・ルール違反ドボン）
   * バースト時と同じ支払いロジック（敗者が全員に支払い）
   */
  calculatePenaltyPayment(
    baseRate: number,
    multiplierState: MultiplierState,
    deckState: DeckState,
    penaltyPlayer: Player,
    allPlayers: Player[],
    reason: 'invalid-formula' | 'rule-violation'
  ): Payment[] {
    const drawnCard = this.deckManager.drawCard(deckState);
    const amount = drawnCard.value * baseRate * multiplierState.totalMultiplier;
    return allPlayers
      .filter((p) => p.id !== penaltyPlayer.id)
      .map((p) => ({
        payer: penaltyPlayer.user,
        payee: p.user,
        amount,
        reason,
        drawnCard,
      }));
  }

  /**
   * 支払いカードを山札から引く（支払い計算用）
   * 山札が空の場合は再生成が必要
   */
  drawPaymentCard(deckState: DeckState): Card {
    return this.deckManager.drawCard(deckState);
  }
}
