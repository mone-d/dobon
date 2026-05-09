import { GameSession } from '../../types/domain';
import { SpecialCardHandler } from './ACardHandler';

/**
 * 9: リバース
 * ターン順を逆回りにする
 * 複数枚出し: 奇数枚ならリバース、偶数枚なら元に戻る
 */
export class JCardHandler implements SpecialCardHandler {
  handle(session: GameSession, cardCount: number): void {
    const { turnState } = session;
    // 奇数枚なら反転、偶数枚なら変化なし
    if (cardCount % 2 === 1) {
      turnState.turnDirection =
        turnState.turnDirection === 'forward' ? 'reverse' : 'forward';
    }
  }
}
