import { GameSession } from '../../types/domain';
import { SpecialCardHandler } from './ACardHandler';

/**
 * K（13）: オープン（スタッキング対応）
 * 次プレイヤーの手札を全員に公開する
 * 被害者が同じKを出した場合: 押し付けて次の人に効果が移る
 * 被害者がKを出せない場合: 手札が公開される
 */
export class KCardHandler implements SpecialCardHandler {
  handle(session: GameSession, _cardCount: number): void {
    const { turnState } = session;
    const totalPlayers = turnState.turnOrder.length;

    // 次プレイヤーのインデックスを計算
    const nextIndex =
      turnState.turnDirection === 'forward'
        ? (turnState.currentPlayerIndex + 1) % totalPlayers
        : (turnState.currentPlayerIndex - 1 + totalPlayers) % totalPlayers;

    const nextPlayerId = turnState.turnOrder[nextIndex];
    if (!nextPlayerId) return;

    // 次プレイヤーをopenHandPlayerIdsに追加（保留状態）
    // 被害者がKを出せば自分は除外されて次の人に移る
    // 被害者がKを出せなければdrawCard時に手札が公開される
    if (!turnState.openHandPlayerIds.includes(nextPlayerId)) {
      turnState.openHandPlayerIds.push(nextPlayerId);
    }
  }
}
