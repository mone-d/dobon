import { CardValidator } from '../../src/game/CardValidator';
import { CardFactory } from '../factories';

describe('CardValidator', () => {
  let validator: CardValidator;

  beforeEach(() => {
    validator = new CardValidator();
  });

  describe('validatePlayableCards', () => {
    it('同じ数字のカードは有効', () => {
      const cards = [CardFactory.create('5', 'hearts')];
      const fieldCard = CardFactory.create('5', 'diamonds');

      const result = validator.validatePlayableCards(cards, fieldCard);
      expect(result).toBe(true);
    });

    it('同じスートのカードは有効', () => {
      const cards = [CardFactory.create('3', 'hearts')];
      const fieldCard = CardFactory.create('5', 'hearts');

      const result = validator.validatePlayableCards(cards, fieldCard);
      expect(result).toBe(true);
    });

    it('ワイルド（8）は常に有効', () => {
      const cards = [CardFactory.create('8', 'spades')];
      const fieldCard = CardFactory.create('5', 'hearts');

      const result = validator.validatePlayableCards(cards, fieldCard);
      expect(result).toBe(true);
    });

    it('異なる数字とスートのカードは無効', () => {
      const cards = [CardFactory.create('3', 'diamonds')];
      const fieldCard = CardFactory.create('5', 'hearts');

      const result = validator.validatePlayableCards(cards, fieldCard);
      expect(result).toBe(false);
    });

    it('複数枚の場合、全て同じ数字なら有効', () => {
      const cards = [
        CardFactory.create('7', 'hearts'),
        CardFactory.create('7', 'diamonds'),
        CardFactory.create('7', 'clubs'),
      ];
      const fieldCard = CardFactory.create('5', 'hearts');

      const result = validator.validatePlayableCards(cards, fieldCard);
      expect(result).toBe(true);
    });

    it('複数枚の場合、異なる数字なら無効', () => {
      const cards = [
        CardFactory.create('7', 'hearts'),
        CardFactory.create('8', 'diamonds'),
      ];
      const fieldCard = CardFactory.create('5', 'hearts');

      const result = validator.validatePlayableCards(cards, fieldCard);
      expect(result).toBe(false);
    });
  });
});
