import type { Card, CardValue } from '../types/domain';

/**
 * Validate if a card can be played on the field card
 */
export function canPlayCard(card: Card, fieldCard: Card): boolean {
  // Same suit or same value
  return card.suit === fieldCard.suit || card.value === fieldCard.value;
}

/**
 * Validate if multiple cards can be played together
 */
export function canPlayCards(cards: Card[], fieldCard: Card): boolean {
  if (cards.length === 0) return false;
  
  // All cards must have the same value
  const firstValue = cards[0].value;
  const allSameValue = cards.every(c => c.value === firstValue);
  
  if (!allSameValue) return false;
  
  // At least one card must match the field card
  return cards.some(c => canPlayCard(c, fieldCard));
}

/**
 * Validate dobo formula
 * Valid formulas: "X + Y", "X - Y", "X * Y", "X / Y"
 * Result must equal 10
 */
export function validateDoboFormula(formula: string, cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  
  const [card1, card2] = cards;
  const value1 = card1.value;
  const value2 = card2.value;
  
  // Check all possible formulas
  const validFormulas = [
    { formula: `${value1} + ${value2}`, result: value1 + value2 },
    { formula: `${value1} - ${value2}`, result: value1 - value2 },
    { formula: `${value2} - ${value1}`, result: value2 - value1 },
    { formula: `${value1} * ${value2}`, result: value1 * value2 },
    { formula: `${value1} / ${value2}`, result: value2 > 0 ? value1 / value2 : -1 },
    { formula: `${value2} / ${value1}`, result: value1 > 0 ? value2 / value1 : -1 },
  ];
  
  // Check if formula matches and result is 10
  return validFormulas.some(f => 
    f.formula === formula.trim() && f.result === 10
  );
}

/**
 * Get all valid dobo formulas for given cards
 */
export function getValidDoboFormulas(cards: Card[]): string[] {
  if (cards.length !== 2) return [];
  
  const [card1, card2] = cards;
  const value1 = card1.value;
  const value2 = card2.value;
  
  const formulas: string[] = [];
  
  // Addition
  if (value1 + value2 === 10) {
    formulas.push(`${value1} + ${value2}`);
  }
  
  // Subtraction
  if (value1 - value2 === 10) {
    formulas.push(`${value1} - ${value2}`);
  }
  if (value2 - value1 === 10) {
    formulas.push(`${value2} - ${value1}`);
  }
  
  // Multiplication
  if (value1 * value2 === 10) {
    formulas.push(`${value1} * ${value2}`);
  }
  
  // Division
  if (value2 > 0 && value1 / value2 === 10) {
    formulas.push(`${value1} / ${value2}`);
  }
  if (value1 > 0 && value2 / value1 === 10) {
    formulas.push(`${value2} / ${value1}`);
  }
  
  return formulas;
}

/**
 * Check if a card value is a special card
 */
export function isSpecialCard(value: CardValue): boolean {
  // Special cards: A(1), 2, 8, J(11), K(13)
  return [1, 2, 8, 11, 13].includes(value);
}

/**
 * Get special card effect description
 */
export function getSpecialCardEffect(value: CardValue): string {
  switch (value) {
    case 1: // A
      return '倍率+1（初期配布時のみ）';
    case 2:
      return '次のプレイヤーは2枚引く（スタック可能）';
    case 8:
      return 'スキップ（次のプレイヤーの番を飛ばす）';
    case 11: // J
      return 'リバース（順番を逆転）';
    case 13: // K
      return '次のプレイヤーの手札を公開';
    default:
      return '';
  }
}
