import type { Card, Suit, CardValue, SuitSymbol } from '../types/domain';
import { suitToSymbol, valueToRank } from '../types/domain';

/**
 * Format card for display
 */
export function formatCard(card: Card): string {
  const suit = suitToSymbol[card.suit];
  const rank = valueToRank[card.value];
  return `${suit}${rank}`;
}

/**
 * Format multiple cards for display
 */
export function formatCards(cards: Card[]): string {
  return cards.map(formatCard).join(', ');
}

/**
 * Format suit symbol with color
 */
export function getSuitColor(suit: Suit | SuitSymbol): 'red' | 'black' {
  if (suit === 'hearts' || suit === 'diamonds' || suit === '♥' || suit === '♦') {
    return 'red';
  }
  return 'black';
}

/**
 * Format card value to display name
 */
export function formatCardValue(value: CardValue): string {
  const rank = valueToRank[value];
  switch (rank) {
    case 'A':
      return 'エース';
    case 'J':
      return 'ジャック';
    case 'Q':
      return 'クイーン';
    case 'K':
      return 'キング';
    default:
      return rank;
  }
}

/**
 * Format suit to Japanese name
 */
export function formatSuit(suit: Suit): string {
  switch (suit) {
    case 'hearts':
      return 'ハート';
    case 'diamonds':
      return 'ダイヤ';
    case 'clubs':
      return 'クラブ';
    case 'spades':
      return 'スペード';
  }
}

/**
 * Format currency (Japanese Yen)
 */
export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}

/**
 * Format multiplier
 */
export function formatMultiplier(multiplier: number): string {
  return `×${multiplier}`;
}

/**
 * Format payment amount with multiplier breakdown
 */
export function formatPaymentBreakdown(baseRate: number, multiplier: number): string {
  const total = baseRate * multiplier;
  return `${formatCurrency(baseRate)} × ${multiplier} = ${formatCurrency(total)}`;
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}日前`;
  if (hours > 0) return `${hours}時間前`;
  if (minutes > 0) return `${minutes}分前`;
  return `${seconds}秒前`;
}

/**
 * Format date to Japanese format
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format player count
 */
export function formatPlayerCount(current: number, max: number): string {
  return `${current}/${max}人`;
}

/**
 * Format game phase to Japanese
 */
export function formatGamePhase(phase: string): string {
  switch (phase) {
    case 'playing':
      return 'プレイ中';
    case 'suit-selection':
      return 'スート選択';
    case 'dobo-declaration':
      return 'ドボン宣言';
    case 'return-dobo':
      return '返しドボン';
    case 'payment':
      return '支払い';
    case 'ended':
      return '終了';
    default:
      return phase;
  }
}
