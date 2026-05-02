import { Card, CardValidationResult, TurnState } from '../types/domain';

export class CardValidator {
  /**
   * 出すカードが場札の条件を満たすか検証する
   * 条件: 同じ数字 OR 同じスート OR ワイルド（8）
   * 複数枚の場合: 全て同じ数字であること
   */
  validatePlayableCards(cards: Card[], fieldCard: Card): CardValidationResult {
    if (cards.length === 0) {
      return { isValid: false, reason: 'NO_CARDS' };
    }

    // 複数枚の場合: 全て同じ数字か確認
    if (cards.length > 1) {
      const firstValue = cards[0].value;
      const allSameValue = cards.every((card) => card.value === firstValue);
      if (!allSameValue) {
        return { isValid: false, reason: 'DIFFERENT_VALUES' };
      }
    }

    // 先頭カードが場札の条件を満たすか確認
    const card = cards[0];
    const isWild = card.value === 8;
    const isSameValue = card.value === fieldCard.value;
    const isSameSuit = card.suit === fieldCard.suit;

    if (!isWild && !isSameValue && !isSameSuit) {
      return { isValid: false, reason: 'INVALID_CARD' };
    }

    return { isValid: true };
  }

  /**
   * 山札から引いたカードを今ターンに出せないか確認する
   * 引いたターンに引いたカードは出せない
   */
  canPlayDrawnCard(card: Card, turnState: TurnState): boolean {
    if (turnState.drawnCardThisTurn === null) {
      return true;
    }
    const drawn = turnState.drawnCardThisTurn;
    // 引いたカードと一致する場合は出せない
    return !(card.suit === drawn.suit && card.value === drawn.value);
  }
}
