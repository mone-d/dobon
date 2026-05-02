import { MultiplierState, Player, TurnState } from '../types/domain';

export class MultiplierCalculator {
  /**
   * 合計倍率を計算する: 2^n
   * n = 全条件の発生回数の合計
   */
  calculateTotalMultiplier(state: MultiplierState): number {
    const n =
      state.initialACount +
      state.drawDoboCount +
      state.openDoboCount +
      state.returnDoboCount +
      state.reshuffleCount;
    return Math.pow(2, n);
  }

  addInitialA(state: MultiplierState): MultiplierState {
    state.initialACount++;
    state.totalMultiplier = this.calculateTotalMultiplier(state);
    return state;
  }

  addDrawDobo(state: MultiplierState): MultiplierState {
    state.drawDoboCount++;
    state.totalMultiplier = this.calculateTotalMultiplier(state);
    return state;
  }

  addOpenDobo(state: MultiplierState): MultiplierState {
    state.openDoboCount++;
    state.totalMultiplier = this.calculateTotalMultiplier(state);
    return state;
  }

  addReturnDobo(state: MultiplierState): MultiplierState {
    state.returnDoboCount++;
    state.totalMultiplier = this.calculateTotalMultiplier(state);
    return state;
  }

  addReshuffle(state: MultiplierState): MultiplierState {
    state.reshuffleCount++;
    state.totalMultiplier = this.calculateTotalMultiplier(state);
    return state;
  }

  /**
   * 引きドボン判定: 今ターンに山札から引いたプレイヤーがドボン宣言した場合
   */
  isDrawDobo(turnState: TurnState): boolean {
    return turnState.hasDrawnThisTurn && turnState.drawnCardThisTurn !== null;
  }

  /**
   * オープンドボン判定: 手札の全カードが isPublic=true の場合のみ
   * 一部のみオープンの場合は対象外
   */
  isOpenDobo(playerId: string, players: Player[]): boolean {
    const player = players.find((p) => p.id === playerId);
    if (!player || player.hand.length === 0) {
      return false;
    }
    return player.hand.every((card) => card.isPublic === true);
  }

  /**
   * MultiplierState の初期化
   */
  static createInitialState(): MultiplierState {
    return {
      initialACount: 0,
      drawDoboCount: 0,
      openDoboCount: 0,
      returnDoboCount: 0,
      reshuffleCount: 0,
      totalMultiplier: 1,
    };
  }
}
