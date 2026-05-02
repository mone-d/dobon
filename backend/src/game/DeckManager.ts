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
    for (const player of players) {
      for (let i = 0; i < cardsPerPlayer; i++) {
        const card = this.drawCard(deckState);
        player.hand.push(card);
      }
      player.handCount = player.hand.length;
    }
  }

  /**
   * 初期場札を決定する
   * A が出た場合: MultiplierCalculator.addInitialA() を呼び出し、再度引く
   */
  determineInitialCard(deckState: DeckState, multiplierState: MultiplierState): Card {
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
    if (deckState.drawPile.length === 0) {
      throw new Error('Draw pile is empty. Call reshuffleDeck first.');
    }
    const card = deckState.drawPile.pop()!;
    return card;
  }

  /**
   * 山札が空かどうか確認する
   */
  isDeckEmpty(deckState: DeckState): boolean {
    return deckState.drawPile.length === 0;
  }

  /**
   * 山札を再生成する
   * 場の最後の1枚（現在の場札）を除いた捨て札をシャッフルして山札に戻す
   */
  reshuffleDeck(deckState: DeckState): void {
    // 捨て札を全て山札に移す（場の最後の1枚=現在の場札は除く）
    const newDrawPile = [...deckState.discardPile];
    deckState.discardPile = [];
    deckState.drawPile = this.shuffle(newDrawPile);
    // fieldCard はそのまま維持
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
      drawPile: [],
      discardPile: [],
      fieldCard: { suit: 'hearts', value: 1, isPublic: false }, // 仮の初期値
      reshuffleCount: 0,
    };
  }
}
