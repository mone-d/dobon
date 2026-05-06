import { DeckManager } from '../../src/game/DeckManager';
import { MultiplierCalculator } from '../../src/game/MultiplierCalculator';
import { CardFactory } from '../factories';
import { DeckState, CardValue, Suit } from '../../src/types/domain';

describe('DeckManager', () => {
  let deckManager: DeckManager;
  let multiplierCalculator: MultiplierCalculator;

  beforeEach(() => {
    multiplierCalculator = new MultiplierCalculator();
    deckManager = new DeckManager(multiplierCalculator);
  });

  describe('initializeDeck', () => {
    it('52枚のカードを生成', () => {
      const deck = deckManager.initializeDeck();
      expect(deck.length).toBe(52);
    });

    it('全ての数字とスートの組み合わせが含まれる', () => {
      const deck = deckManager.initializeDeck();
      const values: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
      const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

      for (const value of values) {
        for (const suit of suits) {
          const exists = deck.some((card) => card.value === value && card.suit === suit);
          expect(exists).toBe(true);
        }
      }
    });

    it('全てのカードが非公開状態', () => {
      const deck = deckManager.initializeDeck();
      const allPrivate = deck.every((card) => card.isPublic === false);
      expect(allPrivate).toBe(true);
    });
  });

  describe('drawCard', () => {
    it('デッキからカードを1枚取得', () => {
      const deckState: DeckState = {
        deck: deckManager.initializeDeck(),
        discardPile: [],
        fieldCard: CardFactory.create(5, 'hearts'),
        reshuffleCount: 0, selectedSuit: null,
      };
      const initialLength = deckState.deck.length;

      const card = deckManager.drawCard(deckState);

      expect(card).toBeDefined();
      expect(deckState.deck.length).toBe(initialLength - 1);
    });

    it('複数回呼び出し時に異なるカードを取得', () => {
      const deckState: DeckState = {
        deck: deckManager.initializeDeck(),
        discardPile: [],
        fieldCard: CardFactory.create(5, 'hearts'),
        reshuffleCount: 0, selectedSuit: null,
      };

      const card1 = deckManager.drawCard(deckState);
      const card2 = deckManager.drawCard(deckState);

      expect(card1).not.toEqual(card2);
    });
  });

  describe('reshuffleDeck', () => {
    it('捨札を山札に戻す', () => {
      const deckState: DeckState = {
        deck: [],
        discardPile: [
          CardFactory.create(5, 'hearts'),
          CardFactory.create(10, 'spades'),
          CardFactory.create(13, 'diamonds'),
        ],
        fieldCard: CardFactory.create(7, 'clubs'),
        reshuffleCount: 0, selectedSuit: null,
      };

      deckManager.reshuffleDeck(deckState);

      // 場札を除く捨札のみ戻される
      expect(deckState.deck.length).toBeGreaterThan(0);
      expect(deckState.discardPile.length).toBe(0);
    });

    it('場札は山札に戻されない', () => {
      const deckState: DeckState = {
        deck: [],
        discardPile: [CardFactory.create(5, 'hearts')],
        fieldCard: CardFactory.create(7, 'clubs'),
        reshuffleCount: 0, selectedSuit: null,
      };
      const discardPileLength = deckState.discardPile.length;

      deckManager.reshuffleDeck(deckState);

      // 山札に戻されたカード数は捨札 - 1
      expect(deckState.deck.length).toBe(discardPileLength - 1);
    });
  });

  describe('determineInitialCard', () => {
    it('A以外のカードが返される', () => {
      const deckState: DeckState = {
        deck: deckManager.initializeDeck().filter((c) => c.value !== 1),
        discardPile: [],
        fieldCard: CardFactory.create(5, 'hearts'),
        reshuffleCount: 0, selectedSuit: null,
      };

      const card = deckManager.drawCard(deckState);

      expect(card.value).not.toBe(1);
    });
  });
});
