import { PaymentCalculator } from '../../src/game/PaymentCalculator';
import { PlayerFactory, CardFactory, MultiplierStateFactory } from '../factories';

describe('PaymentCalculator', () => {
  let calculator: PaymentCalculator;

  beforeEach(() => {
    calculator = new PaymentCalculator();
  });

  describe('calculatePayments', () => {
    it('1対1の場合、支払い額は baseRate × 倍率', () => {
      const winner = PlayerFactory.create('winner');
      const loser = PlayerFactory.create('loser');
      const multiplier = 2;
      const baseRate = 100;

      const payments = calculator.calculatePayments([winner, loser], loser, baseRate, multiplier);

      expect(payments.length).toBe(1);
      expect(payments[0].payer).toBe('loser');
      expect(payments[0].amount).toBe(baseRate * multiplier);
    });

    it('複数人の場合、各プレイヤーから支払い', () => {
      const winner = PlayerFactory.create('winner');
      const loser1 = PlayerFactory.create('loser1');
      const loser2 = PlayerFactory.create('loser2');
      const multiplier = 1;
      const baseRate = 100;

      const payments = calculator.calculatePayments(
        [winner, loser1, loser2],
        loser1,
        baseRate,
        multiplier
      );

      // 敗者のみから支払い
      const hasLoser1 = payments.some((p) => p.payer === 'loser1');
      expect(hasLoser1).toBe(true);
    });

    it('高倍率時の支払い額計算', () => {
      const winner = PlayerFactory.create('winner');
      const loser = PlayerFactory.create('loser');
      const multiplier = 8;
      const baseRate = 100;

      const payments = calculator.calculatePayments([winner, loser], loser, baseRate, multiplier);

      expect(payments[0].amount).toBe(baseRate * multiplier); // 100 * 8 = 800
    });
  });

  describe('getPaymentReason', () => {
    it('ドボン敗北の理由を返す', () => {
      const reason = calculator.getPaymentReason('dobo');
      expect(reason).toBe('ドボン敗北');
    });

    it('バースト敗北の理由を返す', () => {
      const reason = calculator.getPaymentReason('burst');
      expect(reason).toBe('バースト敗北');
    });

    it('ペナルティの理由を返す', () => {
      const reason = calculator.getPaymentReason('penalty');
      expect(reason).toBe('ペナルティ');
    });
  });
});
