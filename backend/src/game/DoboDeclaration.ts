import { GameSession, DoboDeclaration as DoboDeclarationType, ReturnDoboDeclaration, Card } from '../types/domain';
import { Logger } from '../utils/logger';

/**
 * DoboDeclaration - ドボン宣言管理
 *
 * 責務:
 * - ドボン宣言の受付・検証
 * - 演算式の自動計算（4演算子を全試行）
 * - 返しドボン宣言フロー
 * - ドボンフェーズ終了判定・勝者決定
 */
export class DoboDeclarationService {
  private logger = new Logger('DoboDeclaration');

  /**
   * ドボン宣言（最初のドボン）
   *
   * @param session ゲームセッション
   * @param playerId 宣言者ID
   * @param lastPlayedPlayerId 場札を出した人ID
   * @returns true=成功, false=失敗（ペナルティ適用）
   */
  declareDobo(session: GameSession, playerId: string, lastPlayedPlayerId: string): boolean {
    const { gameState, doboPhaseState, multiplierCalculator } = session;
    const logger = this.logger;

    // ドボンフェーズが既に存在するか確認
    if (doboPhaseState.isActive) {
      logger.warn('Dobo phase already active', { playerId });
      return false;
    }

    // プレイヤー情報を取得
    const player = gameState.players.find((p) => p.id === playerId);
    if (!player) {
      logger.error('Player not found', { playerId });
      return false;
    }

    // ルール違反チェック: 自分のカードへのドボン宣言か？
    const isRuleViolation = playerId === lastPlayedPlayerId;

    // 演算式の自動計算を試行
    const formula = this.validateDoboFormula(player.hand, gameState.deckState.fieldCard.value);

    if (!formula) {
      // ペナルティ処理
      this.applyDoboPenalty(session, playerId);
      logger.info('Dobo failed - formula not valid', { playerId, ruleViolation: isRuleViolation });
      return false;
    }

    // ルール違反ドボン（自分のカードへのドボン）の場合
    if (isRuleViolation) {
      // ペナルティ処理を実行
      this.applyDoboPenalty(session, playerId);
      logger.info('Dobo failed - rule violation (dobo on own card)', { playerId });
      return false;
    }

    // ドボン宣言を生成
    const doboDeclation: DoboDeclarationType = {
      playerId,
      formula,
      cards: player.hand.map((card) => ({ ...card })),
      timestamp: new Date(),
      isValid: true,
    };

    // ドボンフェーズを有効化
    doboPhaseState.isActive = true;
    doboPhaseState.firstDoboDeclaration = doboDeclation;
    doboPhaseState.pendingPlayerIds = gameState.players
      .filter((p) => p.id !== playerId)
      .map((p) => p.id);
    doboPhaseState.returnDeclarations = [];
    doboPhaseState.timeoutAt = new Date(Date.now() + 10000); // 10秒

    // 倍率更新
    const isDrawDobo = session.turnState.drawnCardThisTurn !== null;
    if (isDrawDobo) {
      multiplierCalculator.addDrawDobo(session.multiplierState);
    }

    const isOpenDobo = player.hand.every((card) => card.isPublic === true);
    if (isOpenDobo && player.hand.length > 0) {
      multiplierCalculator.addOpenDobo(session.multiplierState);
    }

    logger.info('Dobo declared', {
      playerId,
      formula,
      pendingPlayers: doboPhaseState.pendingPlayerIds.length,
    });

    return true;
  }

  /**
   * 返しドボン宣言
   *
   * @param session ゲームセッション
   * @param playerId 返し宣言者ID
   * @param lastPlayedPlayerId 場札を出した人ID
   * @returns true=成功, false=失敗（ペナルティ適用）
   */
  declareReturn(session: GameSession, playerId: string, lastPlayedPlayerId: string): boolean {
    const { gameState, doboPhaseState, multiplierCalculator } = session;
    const logger = this.logger;

    // ドボンフェーズが有効か確認
    if (!doboPhaseState.isActive) {
      logger.warn('Dobo phase not active', { playerId });
      return false;
    }

    // 返し待ちプレイヤー一覧に含まれるか確認
    if (!doboPhaseState.pendingPlayerIds.includes(playerId)) {
      logger.warn('Player not in pending list', { playerId });
      return false;
    }

    // プレイヤー情報を取得
    const player = gameState.players.find((p) => p.id === playerId);
    if (!player) {
      logger.error('Player not found', { playerId });
      return false;
    }

    // ルール違反チェック: 自分のカードへの返しドボン宣言か？
    const isRuleViolation = playerId === lastPlayedPlayerId;

    // 演算式の自動計算を試行
    const formula = this.validateDoboFormula(player.hand, gameState.deckState.fieldCard.value);

    if (!formula) {
      // ペナルティ処理
      this.applyDoboPenalty(session, playerId);
      logger.info('Return dobo failed - formula not valid', { playerId, ruleViolation: isRuleViolation });
      return false;
    }

    // ルール違反返しドボンの場合
    if (isRuleViolation) {
      // ペナルティ処理を実行
      this.applyDoboPenalty(session, playerId);
      logger.info('Return dobo failed - rule violation', { playerId });
      return false;
    }

    // 返しドボン宣言を生成
    const returnDeclaration: ReturnDoboDeclaration = {
      playerId,
      formula,
      cards: player.hand.map((card) => ({ ...card })),
      timestamp: new Date(),
      isValid: true,
    };

    // returnDeclarations に追加（配列末尾）
    doboPhaseState.returnDeclarations.push(returnDeclaration);

    // pendingPlayerIds から除去
    doboPhaseState.pendingPlayerIds = doboPhaseState.pendingPlayerIds.filter((id) => id !== playerId);

    // 倍率更新
    multiplierCalculator.addReturnDobo(session.multiplierState);

    logger.info('Return dobo declared', {
      playerId,
      formula,
      pendingRemaining: doboPhaseState.pendingPlayerIds.length,
    });

    // ドボンフェーズ終了判定
    this.checkDoboPhaseEnd(session);

    return true;
  }

  /**
   * 返さない宣言
   *
   * @param session ゲームセッション
   * @param playerId 宣言者ID
   */
  declareNoReturn(session: GameSession, playerId: string): void {
    const { doboPhaseState } = session;
    const logger = this.logger;

    // ドボンフェーズが有効か確認
    if (!doboPhaseState.isActive) {
      logger.warn('Dobo phase not active', { playerId });
      return;
    }

    // pendingPlayerIds から除去
    doboPhaseState.pendingPlayerIds = doboPhaseState.pendingPlayerIds.filter((id) => id !== playerId);

    logger.info('No return declared', {
      playerId,
      pendingRemaining: doboPhaseState.pendingPlayerIds.length,
    });

    // ドボンフェーズ終了判定
    this.checkDoboPhaseEnd(session);
  }

  /**
   * ドボンフェーズ終了判定
   *
   * @param session ゲームセッション
   */
  checkDoboPhaseEnd(session: GameSession): void {
    const { doboPhaseState } = session;

    // pendingPlayerIds が空または タイムアウト時に終了
    if (doboPhaseState.pendingPlayerIds.length === 0 || new Date() >= doboPhaseState.timeoutAt) {
      this.determineWinner(session);
    }
  }

  /**
   * ドボンフェーズタイムアウト処理
   *
   * @param session ゲームセッション
   */
  handleDoboTimeout(session: GameSession): void {
    const { doboPhaseState } = session;
    const logger = this.logger;

    if (!doboPhaseState.isActive) {
      return;
    }

    if (new Date() < doboPhaseState.timeoutAt) {
      return; // まだタイムアウト時刻に達していない
    }

    logger.info('Dobo timeout', {
      pendingPlayers: doboPhaseState.pendingPlayerIds.length,
    });

    // 待機中のプレイヤーを全て「返さない」として処理
    const pendingPlayers = [...doboPhaseState.pendingPlayerIds];
    for (const playerId of pendingPlayers) {
      this.declareNoReturn(session, playerId);
    }
  }

  /**
   * 勝者決定
   *
   * @param session ゲームセッション
   * @returns 勝者プレイヤーID
   */
  determineWinner(session: GameSession): string {
    const { doboPhaseState } = session;
    const logger = this.logger;

    let winner: string;

    if (doboPhaseState.returnDeclarations.length > 0) {
      // 返しドボンがある場合: 配列末尾（最後に宣言したプレイヤー）が勝者
      winner = doboPhaseState.returnDeclarations[doboPhaseState.returnDeclarations.length - 1].playerId;
    } else {
      // 返しドボンがない場合: 最初のドボン宣言者が勝者
      winner = doboPhaseState.firstDoboDeclaration.playerId;
    }

    // ドボンフェーズを終了
    doboPhaseState.isActive = false;

    logger.info('Dobo phase ended - winner determined', {
      winner,
      returnDoboCount: doboPhaseState.returnDeclarations.length,
    });

    return winner;
  }

  /**
   * 演算式の自動計算と検証
   *
   * @param hand プレイヤーの手札
   * @param targetValue 場札の数字（目標値）
   * @returns 式を満たす演算子（+, -, *, /）、または null
   */
  private validateDoboFormula(hand: Card[], targetValue: number): string | null {
    const logger = this.logger;

    if (hand.length === 0) {
      return null;
    }

    // 手札の数値を取得（A=1, ..., K=13）
    const values = hand.map((card) => this.cardValueToNumber(card));

    // 4つの演算子を試行
    const operators = ['+', '-', '*', '/'];

    for (const operator of operators) {
      try {
        const result = this.applyOperator(values, operator);

        // 結果が整数で、目標値と一致するか確認
        if (Number.isInteger(result) && result === targetValue) {
          const formula = this.buildFormulaString(hand, operator);
          logger.debug('Formula valid', { formula, operator, result });
          return operator;
        }
      } catch (error) {
        // 0除算などのエラーは無視
        logger.debug('Operator failed', { operator, error: (error as Error).message });
      }
    }

    logger.debug('No valid formula found', { targetValue, handSize: hand.length });
    return null;
  }

  /**
   * 演算子を適用して計算
   *
   * @param values 数値配列
   * @param operator 演算子（+, -, *, /）
   * @returns 計算結果
   */
  private applyOperator(values: number[], operator: string): number {
    if (values.length === 0) {
      throw new Error('Empty values array');
    }

    switch (operator) {
      case '+':
        return values.reduce((a, b) => a + b);
      case '-':
        return values.reduce((a, b) => a - b);
      case '*':
        return values.reduce((a, b) => a * b);
      case '/':
        // 0除算チェック
        for (const value of values) {
          if (value === 0) {
            throw new Error('Division by zero');
          }
        }
        let result = values[0];
        for (let i = 1; i < values.length; i++) {
          result = result / values[i];
        }
        return result;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  /**
   * カードの数値に変換
   *
   * @param card カード
   * @returns 数値（1-13）
   */
  private cardValueToNumber(card: Card): number {
    const valueMap: { [key: string]: number } = {
      'A': 1,
      '2': 2,
      '3': 3,
      '4': 4,
      '5': 5,
      '6': 6,
      '7': 7,
      '8': 8,
      '9': 9,
      '10': 10,
      'J': 11,
      'Q': 12,
      'K': 13,
    };
    return valueMap[card.value] || 0;
  }

  /**
   * 演算式文字列を構築
   *
   * @param hand 手札
   * @param operator 演算子
   * @returns 演算式文字列（例: "1 + 2 + 3"）
   */
  private buildFormulaString(hand: Card[], operator: string): string {
    return hand.map((card) => card.value).join(` ${operator} `);
  }

  /**
   * ドボンペナルティ処理
   *
   * @param session ゲームセッション
   * @param playerId ペナルティ対象プレイヤーID
   */
  private applyDoboPenalty(session: GameSession, playerId: string): void {
    // PaymentCalculator に委譲
    // ここではペナルティの存在をログするのみ
    this.logger.info('Dobo penalty applied', { playerId });
  }
}
