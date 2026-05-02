import { GameSession } from '../../types/domain';
import { SpecialCardHandler } from './ACardHandler';

/**
 * 2: 2枚ドロー（スタッキング対応）
 * 次プレイヤーは山札から2枚引く
 * 被害者が同じ2を出した場合: 効果を上乗せして次の人に押し付け
 * 押し付けたプレイヤーはドローしない（効果を完全に回避）
 */
export class TwoCardHandler implements SpecialCardHandler {
  handle(session: GameSession, cardCount: number): void {
    const { turnState } = session;
    // forcedDrawCount に加算（スタッキング対応）
    // 複数枚出し時: 2 を n 枚出した場合、forcedDrawCount に 2n を加算
    turnState.forcedDrawCount += 2 * cardCount;
  }
}
