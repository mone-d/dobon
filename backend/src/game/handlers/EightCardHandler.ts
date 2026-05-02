import { GameSession } from '../../types/domain';
import { SpecialCardHandler } from './ACardHandler';

/**
 * 8: ワイルド
 * 任意のカードに対して出せる
 * 出したプレイヤーがスートを指定するまで次のターンに進まない
 */
export class EightCardHandler implements SpecialCardHandler {
  handle(session: GameSession, _cardCount: number): void {
    // gamePhase を 'suit-selection' に変更
    // スート指定は GameSocketHandler の game:select-suit イベントで処理
    session.gameState.gamePhase = 'suit-selection';
  }
}
