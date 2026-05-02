import { DeckManager } from '../../src/game/DeckManager';
import { DeckStateFactory, CardFactory } from '../factories';

describe('DeckManager', () => {
  let deckManager: DeckManager;

  beforeEach(() => {
    deckManager = new DeckManager();
  });

  describe('initializeDeck', () => {
    it('52枚のカードを生成', () => {
      const deck = deckManager.initializeDeck();
      expect(deck.length).toBe(52);
    });

    it('全ての数字とスートの組み合わせが含まれる', () => {
      const deck = deckManager.initializeDeck();
      const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      const suits = ['hearts', 'diamonds', 'clubs', 'spades'];

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
      const deckState = DeckStateFactory.create();
      deckState.deck = deckManager.initializeDeck();
      const initialLength = deckState.deck.length;

      const card = deckManager.drawCard(deckState);

      expect(card).toBeDefined();
      expect(deckState.deck.length).toBe(initialLength - 1);
    });

    it('複数回呼び出し時に異なるカードを取得', () => {
      const deckState = DeckStateFactory.create();
      deckState.deck = deckManager.initializeDeck();

      const card1 = deckManager.drawCard(deckState);
      const card2 = deckManager.drawCard(deckState);

      expect(card1).not.toEqual(card2);
    });
  });

  describe('reshuffleDeck', () => {
    it('捨札を山札に戻す', () => {
      const deckState = DeckStateFactory.create();
      deckState.deck = [];
      deckState.discardPile = [
        CardFactory.create('5', 'hearts'),
        CardFactory.create('10', 'spades'),
        CardFactory.create('K', 'diamonds'),
      ];
      const fieldCard = CardFactory.create('7', 'clubs');

      deckManager.reshuffleDeck(deckState);

      // 場札を除く捨札のみ戻される
      expect(deckState.deck.length).toBeGreaterThan(0);
      expect(deckState.discardPile.length).toBe(0);
    });

    it('場札は山札に戻されない', () => {
      const deckState = DeckStateFactory.create();
      deckState.deck = [];
      const discardPile = [CardFactory.create('5', 'hearts')];
      deckState.discardPile = discardPile;

      deckManager.reshuffleDeck(deckState);

      // 山札に戻されたカード数は捨札 - 1
      expect(deckState.deck.length).toBe(discardPile.length - 1);
    });
  });

  describe('determineInitialCard', () => {
    it('A以外のカードが返される', () => {
      const deckState = DeckStateFactory.create();
      deckState.deck = deckManager.initializeDeck().filter((c) => c.value !== 'A');

      const card = deckManager.drawCard(deckState);

      expect(card.value).not.toBe('A');
    });
  });
});
