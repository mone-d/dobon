import { GameSession } from '../../types/domain';
import { SpecialCardHandler } from './ACardHandler';

/**
 * K（13）: オープン（スタッキング対応）
 * 次プレイヤーの手札を全員に公開する
 * 公開されたカードは場に出されるまでオープン状態が継続する（ターン終了でクローズしない）
 * 被害者が同じKを出した場合: 押し付けたプレイヤーの手札は公開されない
 */
export class KCardHandler implements SpecialCardHandler {
  handle(session: GameSession, _cardCount: number): void {
    const { turnState, gameState } = session;
    const totalPlayers = turnState.turnOrder.length;

    // 次プレイヤーのインデックスを計算
    const nextIndex =
      turnState.turnDirection === 'forward'
        ? (turnState.currentPlayerIndex + 1) % totalPlayers
        : (turnState.currentPlayerIndex - 1 + totalPlayers) % totalPlayers;

    const nextPlayerId = turnState.turnOrder[nextIndex];
    if (!nextPlayerId) return;

    // 次プレイヤーの全手札の isPublic を true に設定
    const nextPlayer = gameState.players.find((p) => p.id === nextPlayerId);
    if (nextPlayer) {
      nextPlayer.hand.forEach((card) => {
        card.isPublic = true;
      });
    }

    // openHandPlayerIds に追加（重複チェック）
    if (!turnState.openHandPlayerIds.includes(nextPlayerId)) {
      turnState.openHandPlayerIds.push(nextPlayerId);
    }

    // ターン終了でのクローズなし
    // カードが場に出されるまで isPublic = true を維持
    // playCard() 実行時に出されたカードの isPublic を管理
  }
}
