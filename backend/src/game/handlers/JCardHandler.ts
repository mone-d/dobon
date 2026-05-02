import { GameSession } from '../../types/domain';
import { SpecialCardHandler } from './ACardHandler';

/**
 * J（11）: リバース
 * ターン順を逆回りにする
 */
export class JCardHandler implements SpecialCardHandler {
  handle(session: GameSession, _cardCount: number): void {
    const { turnState } = session;
    turnState.turnDirection =
      turnState.turnDirection === 'forward' ? 'reverse' : 'forward';
  }
}
