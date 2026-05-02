import { MultiplierCalculator } from '../../src/game/MultiplierCalculator';
import { MultiplierStateFactory } from '../factories';

describe('MultiplierCalculator', () => {
  let calculator: MultiplierCalculator;

  beforeEach(() => {
    calculator = new MultiplierCalculator();
  });

  describe('calculateTotalMultiplier', () => {
    it('初期倍率は1（n=0, 2^0=1）', () => {
      const state = MultiplierStateFactory.create();
      const multiplier = calculator.calculateTotalMultiplier(state);

      expect(multiplier).toBe(1);
    });

    it('初期A1枚: n=1, 2^1=2', () => {
      const state = MultiplierStateFactory.create();
      state.initialACount = 1;

      const multiplier = calculator.calculateTotalMultiplier(state);
      expect(multiplier).toBe(2);
    });

    it('初期A2枚、引きドボン1回: n=3, 2^3=8', () => {
      const state = MultiplierStateFactory.create();
      state.initialACount = 2;
      state.drawDoboCount = 1;

      const multiplier = calculator.calculateTotalMultiplier(state);
      expect(multiplier).toBe(8);
    });

    it('全てのイベントが発生: n=5, 2^5=32', () => {
      const state = MultiplierStateFactory.create();
      state.initialACount = 1;
      state.drawDoboCount = 1;
      state.openDoboCount = 1;
      state.returnDoboCount = 1;
      state.reshuffleCount = 1;

      const multiplier = calculator.calculateTotalMultiplier(state);
      expect(multiplier).toBe(32);
    });
  });

  describe('addInitialA', () => {
    it('初期Aカウントをインクリメント', () => {
      const state = MultiplierStateFactory.create();
      calculator.addInitialA(state);

      expect(state.initialACount).toBe(1);
      expect(state.totalMultiplier).toBe(2);
    });

    it('複数回呼び出し時に累積', () => {
      const state = MultiplierStateFactory.create();
      calculator.addInitialA(state);
      calculator.addInitialA(state);
      calculator.addInitialA(state);

      expect(state.initialACount).toBe(3);
      expect(state.totalMultiplier).toBe(8);
    });
  });

  describe('addDrawDobo', () => {
    it('引きドボンカウントをインクリメント', () => {
      const state = MultiplierStateFactory.create();
      calculator.addDrawDobo(state);

      expect(state.drawDoboCount).toBe(1);
      expect(state.totalMultiplier).toBe(2);
    });
  });

  describe('addOpenDobo', () => {
    it('オープンドボンカウントをインクリメント', () => {
      const state = MultiplierStateFactory.create();
      calculator.addOpenDobo(state);

      expect(state.openDoboCount).toBe(1);
      expect(state.totalMultiplier).toBe(2);
    });
  });

  describe('addReturnDobo', () => {
    it('返しドボンカウントをインクリメント', () => {
      const state = MultiplierStateFactory.create();
      calculator.addReturnDobo(state);

      expect(state.returnDoboCount).toBe(1);
      expect(state.totalMultiplier).toBe(2);
    });
  });

  describe('addReshuffle', () => {
    it('山札再生成カウントをインクリメント', () => {
      const state = MultiplierStateFactory.create();
      calculator.addReshuffle(state);

      expect(state.reshuffleCount).toBe(1);
      expect(state.totalMultiplier).toBe(2);
    });
  });
});
