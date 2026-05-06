import { PaymentCalculator } from '../../src/game/PaymentCalculator';
import { DeckManager } from '../../src/game/DeckManager';
import { MultiplierCalculator } from '../../src/game/MultiplierCalculator';
import { PlayerFactory, CardFactory } from '../factories';
import { DeckState, MultiplierState } from '../../src/types/domain';

describe('PaymentCalculator', () => {
  let calculator: PaymentCalculator;
  let deckManager: DeckManager;
  let multiplierCalculator: MultiplierCalculator;

  beforeEach(() => {
    multiplierCalculator = new MultiplierCalculator();
    deckManager = new DeckManager(multiplierCalculator);
    calculator = new PaymentCalculator(deckManager);
  });

  describe('calculateDoboPayment', () => {
    it('ドボン時の支払い額は drawnCard.value × baseRate × 倍率', () => {
      const winner = PlayerFactory.create('winner');
      const lastPlayedPlayer = PlayerFactory.create('loser');
      const baseRate = 100;
      const multiplierState: MultiplierState = {
        initialACount: 0,
        drawDoboCount: 0,
        openDoboCount: 0,
        returnDoboCount: 0,
        reshuffleCount: 0,
        totalMultiplier: 2,
      };
      const deckState: DeckState = {
        deck: deckManager.initializeDeck(),
        discardPile: [],
        fieldCard: CardFactory.create(5, 'hearts'),
        reshuffleCount: 0, selectedSuit: null,
      };

      const payment = calculator.calculateDoboPayment(
        baseRate,
        multiplierState,
        deckState,
        lastPlayedPlayer,
        winner
      );

      expect(payment.payer.userId).toBe('loser');
      expect(payment.payee?.userId).toBe('winner');
      expect(payment.reason).toBe('dobo');
      expect(payment.drawnCard).toBeDefined();
      expect(payment.amount).toBe(payment.drawnCard!.value * baseRate * multiplierState.totalMultiplier);
    });
  });

  describe('calculateBurstPayment', () => {
    it('バースト時は敗者が全員に支払う', () => {
      const burstPlayer = PlayerFactory.create('burst');
      const player1 = PlayerFactory.create('player1');
      const player2 = PlayerFactory.create('player2');
      const allPlayers = [burstPlayer, player1, player2];
      const baseRate = 100;
      const multiplierState: MultiplierState = {
        initialACount: 0,
        drawDoboCount: 0,
        openDoboCount: 0,
        returnDoboCount: 0,
        reshuffleCount: 0,
        totalMultiplier: 1,
      };
      const deckState: DeckState = {
        deck: deckManager.initializeDeck(),
        discardPile: [],
        fieldCard: CardFactory.create(5, 'hearts'),
        reshuffleCount: 0, selectedSuit: null,
      };

      const payments = calculator.calculateBurstPayment(
        baseRate,
        multiplierState,
        deckState,
        burstPlayer,
        allPlayers
      );

      expect(payments.length).toBe(2); // 自分以外の2人に支払い
      expect(payments.every((p) => p.payer.userId === 'burst')).toBe(true);
      expect(payments.every((p) => p.reason === 'burst')).toBe(true);
    });
  });

  describe('calculatePenaltyPayment', () => {
    it('ペナルティ時は敗者が全員に支払う', () => {
      const penaltyPlayer = PlayerFactory.create('penalty');
      const player1 = PlayerFactory.create('player1');
      const allPlayers = [penaltyPlayer, player1];
      const baseRate = 100;
      const multiplierState: MultiplierState = {
        initialACount: 0,
        drawDoboCount: 0,
        openDoboCount: 0,
        returnDoboCount: 0,
        reshuffleCount: 0,
        totalMultiplier: 1,
      };
      const deckState: DeckState = {
        deck: deckManager.initializeDeck(),
        discardPile: [],
        fieldCard: CardFactory.create(5, 'hearts'),
        reshuffleCount: 0, selectedSuit: null,
      };

      const payments = calculator.calculatePenaltyPayment(
        baseRate,
        multiplierState,
        deckState,
        penaltyPlayer,
        allPlayers,
        'invalid-formula'
      );

      expect(payments.length).toBe(1);
      expect(payments[0].payer.userId).toBe('penalty');
      expect(payments[0].reason).toBe('invalid-formula');
    });
  });
});
