import { GameSession } from '../../types/domain';

export interface SpecialCardHandler {
  handle(session: GameSession, cardCount: number): void;
}

/**
 * A（1）: スキップ
 * 次プレイヤーのターンを飛ばす
 * 複数枚出し時: A を n 枚出した場合、次の n プレイヤーがスキップされる
 */
export class ACardHandler implements SpecialCardHandler {
  handle(session: GameSession, cardCount: number): void {
    const { turnState } = session;
    const activePlayers = session.gameState.players.filter((p) => !('isBurst' in p));
    const totalPlayers = activePlayers.length;

    for (let i = 1; i <= cardCount; i++) {
      const skipIndex =
        turnState.turnDirection === 'forward'
          ? (turnState.currentPlayerIndex + i) % totalPlayers
          : (turnState.currentPlayerIndex - i + totalPlayers) % totalPlayers;
      const skipPlayerId = turnState.turnOrder[skipIndex];
      if (skipPlayerId && !turnState.skippedPlayerIds.includes(skipPlayerId)) {
        turnState.skippedPlayerIds.push(skipPlayerId);
      }
    }
  }
}
