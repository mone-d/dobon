import { Card, CardValue, DeckState, MultiplierState, Player, Suit } from '../types/domain';
import { MultiplierCalculator } from './MultiplierCalculator';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export class DeckManager {
  private multiplierCalculator: MultiplierCalculator;

  constructor(multiplierCalculator: MultiplierCalculator) {
    this.multiplierCalculator = multiplierCalculator;
  }

  /**
   * デッキを初期化してシャッフルする（定数配列から生成）
   */
  initializeDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of SUITS) {
      for (const value of VALUES) {
        deck.push({ suit, value, isPublic: false });
      }
    }
    return this.shuffle(deck);
  }

  /**
   * 各プレイヤーに cardsPerPlayer 枚ずつ配布する
   * GameEngine が DeckManager からカードを取得して配布
   */
  dealCards(players: Player[], cardsPerPlayer: number, deckState: DeckState): void {
    // テスト用: 環境変数で固定手札を設定
    const fixedHand = process.env.TEST_FIXED_HAND;
    
    for (const player of players) {
      player.hand = [];
      
      // 最初のプレイヤー（人間）のみ固定手札を使用
      if (fixedHand && player === players[0]) {
        const fixedCards = fixedHand.split(',').map(v => parseInt(v.trim(), 10));
        for (const value of fixedCards) {
          if (value >= 1 && value <= 13) {
            // デッキから該当するカードを探して配る
            const cardIndex = deckState.deck.findIndex(c => c.value === value);
            if (cardIndex >= 0) {
              const card = deckState.deck.splice(cardIndex, 1)[0];
              player.hand.push(card);
            } else {
              // 見つからない場合は通常通り引く
              const card = this.drawCard(deckState);
              player.hand.push(card);
            }
          }
        }
        // 残りは通常通り引く
        while (player.hand.length < cardsPerPlayer) {
          const card = this.drawCard(deckState);
          player.hand.push(card);
        }
      } else {
        // 通常の配布
        for (let i = 0; i < cardsPerPlayer; i++) {
          const card = this.drawCard(deckState);
          player.hand.push(card);
        }
      }
      player.handCount = player.hand.length;
    }
  }

  /**
   * 初期場札を決定する
   * A が出た場合: MultiplierCalculator.addInitialA() を呼び出し、再度引く
   */
  determineInitialCard(deckState: DeckState, multiplierState: MultiplierState): Card {
    // テスト用: 環境変数で場札を固定
    const fixedField = process.env.TEST_FIXED_FIELD;
    if (fixedField) {
      const value = parseInt(fixedField.trim(), 10);
      if (value >= 1 && value <= 13) {
        const cardIndex = deckState.deck.findIndex(c => c.value === value);
        if (cardIndex >= 0) {
          const card = deckState.deck.splice(cardIndex, 1)[0];
          deckState.fieldCard = card;
          return card;
        }
      }
    }
    
    // 通常の処理
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const card = this.drawCard(deckState);
      if (card.value === 1) {
        // A が出た場合: 倍率を加算して再度引く
        this.multiplierCalculator.addInitialA(multiplierState);
        continue;
      }
      deckState.fieldCard = card;
      return card;
    }
  }

  /**
   * 山札からカードを1枚引く
   */
  drawCard(deckState: DeckState): Card {
    if (deckState.deck.length === 0) {
      throw new Error('Deck is empty. Call reshuffleDeck first.');
    }
    const card = deckState.deck.pop()!;
    return card;
  }

  /**
   * 山札が空かどうか確認する
   */
  isDeckEmpty(deckState: DeckState): boolean {
    return deckState.deck.length === 0;
  }

  /**
   * 山札を再生成する
   * 場の最後の1枚（現在の場札）を除いた捨て札をシャッフルして山札に戻す
   */
  reshuffleDeck(deckState: DeckState): void {
    // 捨て札から場の最後の1枚（fieldCard）を除いて山札に戻す
    if (deckState.discardPile.length > 0) {
      const newDeck = deckState.discardPile.slice(0, -1);
      // 全カードの公開状態をリセット
      newDeck.forEach(card => { card.isPublic = false; });
      deckState.discardPile = [];
      deckState.deck = this.shuffle(newDeck);
    }
  }

  /**
   * ランダムソートによるシャッフル
   */
  private shuffle<T>(array: T[]): T[] {
    return [...array].sort(() => Math.random() - 0.5);
  }

  /**
   * DeckState の初期化
   */
  static createInitialState(): DeckState {
    return {
      deck: [],
      discardPile: [],
      fieldCard: { suit: 'hearts', value: 1, isPublic: false }, // 仮の初期値
      reshuffleCount: 0,
      selectedSuit: null,
    };
  }
}
