import type { Payment, PaymentReason } from '../types/domain';

/**
 * Calculate payment amount with multiplier
 */
export function calculatePayment(baseRate: number, multiplier: number): number {
  return baseRate * multiplier;
}

/**
 * Calculate total earnings from payments
 */
export function calculateTotalEarnings(payments: Payment[]): number {
  return payments.reduce((total, payment) => {
    // If user is payee, add to earnings
    // If user is payer, subtract from earnings
    return total + payment.amount;
  }, 0);
}

/**
 * Calculate win rate
 */
export function calculateWinRate(wins: number, totalGames: number): number {
  if (totalGames === 0) return 0;
  return Math.round((wins / totalGames) * 100);
}

/**
 * Calculate average earnings per game
 */
export function calculateAverageEarnings(totalEarnings: number, totalGames: number): number {
  if (totalGames === 0) return 0;
  return Math.round(totalEarnings / totalGames);
}

/**
 * Calculate multiplier breakdown
 * Returns object with each multiplier source
 */
export interface MultiplierBreakdown {
  initialAces: number;
  drawDobo: number;
  openDobo: number;
  returnDobo: number;
  reshuffle: number;
  total: number;
}

export function calculateMultiplierBreakdown(
  initialACount: number,
  drawDoboCount: number,
  openDoboCount: number,
  returnDoboCount: number,
  reshuffleCount: number
): MultiplierBreakdown {
  const initialAces = initialACount;
  const drawDobo = drawDoboCount * 2;
  const openDobo = openDoboCount * 2;
  const returnDobo = returnDoboCount * 2;
  const reshuffle = reshuffleCount;
  
  const total = 1 + initialAces + drawDobo + openDobo + returnDobo + reshuffle;
  
  return {
    initialAces,
    drawDobo,
    openDobo,
    returnDobo,
    reshuffle,
    total,
  };
}

/**
 * Format multiplier breakdown for display
 */
export function formatMultiplierBreakdown(breakdown: MultiplierBreakdown): string[] {
  const lines: string[] = ['基本: ×1'];
  
  if (breakdown.initialAces > 0) {
    lines.push(`初期A: +${breakdown.initialAces}`);
  }
  if (breakdown.drawDobo > 0) {
    lines.push(`引きドボン: +${breakdown.drawDobo}`);
  }
  if (breakdown.openDobo > 0) {
    lines.push(`オープンドボン: +${breakdown.openDobo}`);
  }
  if (breakdown.returnDobo > 0) {
    lines.push(`返しドボン: +${breakdown.returnDobo}`);
  }
  if (breakdown.reshuffle > 0) {
    lines.push(`リシャッフル: +${breakdown.reshuffle}`);
  }
  
  lines.push(`合計: ×${breakdown.total}`);
  
  return lines;
}

/**
 * Get payment reason in Japanese
 */
export function getPaymentReasonText(reason: PaymentReason): string {
  switch (reason) {
    case 'dobo':
      return 'ドボン';
    case 'burst':
      return 'バースト';
    case 'invalid-formula':
      return '無効な式';
    case 'rule-violation':
      return 'ルール違反';
    default:
      return reason;
  }
}
