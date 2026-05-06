import { Card, Player, User, CardValue, Suit } from '../../src/types/domain';

/**
 * テスト用カード生成ファクトリー
 */
export class CardFactory {
  /**
   * カードを生成
   *
   * @param value カードの数字（1-13: A=1, J=11, Q=12, K=13）
   * @param suit スート（hearts, diamonds, clubs, spades）
   * @param isPublic 公開状態
   * @returns テスト用カード
   */
  static create(
    value: CardValue = 5,
    suit: Suit = 'hearts',
    isPublic: boolean = false
  ): Card {
    return {
      suit,
      value,
      isPublic,
    };
  }

  /**
   * 複数のカードを生成
   *
   * @param count 生成数
   * @returns テスト用カード配列
   */
  static createMany(count: number): Card[] {
    const cards: Card[] = [];
    const values: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

    for (let i = 0; i < count; i++) {
      cards.push({
        suit: suits[i % 4],
        value: values[i % 13],
        isPublic: false,
      });
    }

    return cards;
  }

  /**
   * 特定の値を持つカード配列を生成（ドボン計算用）
   *
   * @param values カード値の配列（例: [1, 2, 3]）
   * @returns テスト用カード配列
   */
  static createWithValues(values: CardValue[]): Card[] {
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    return values.map((value, index) => ({
      suit: suits[index % 4],
      value,
      isPublic: false,
    }));
  }
}

/**
 * テスト用ユーザー生成ファクトリー
 */
export class UserFactory {
  /**
   * ユーザーを生成
   *
   * @param id ユーザーID
   * @param userName ユーザー名
   * @returns テスト用ユーザー
   */
  static create(id: string = `user_${Math.random()}`, userName: string = 'TestUser'): User {
    return {
      userId: id,
      userName,
      avatar: 'https://example.com/avatar.jpg',
      bio: 'Test user',
    };
  }
}

/**
 * テスト用プレイヤー生成ファクトリー
 */
export class PlayerFactory {
  /**
   * プレイヤーを生成
   *
   * @param id プレイヤーID
   * @param userName プレイヤー名
   * @param hand 手札（省略時は5枚ランダム）
   * @returns テスト用プレイヤー
   */
  static create(
    id: string = `player_${Math.random()}`,
    userName: string = 'TestPlayer',
    hand?: Card[]
  ): Player {
    return {
      id,
      user: UserFactory.create(id, userName),
      hand: hand || CardFactory.createMany(5),
      handCount: hand?.length || 5,
      isCurrentPlayer: false,
    };
  }

  /**
   * 複数のプレイヤーを生成
   *
   * @param count 生成数
   * @returns テスト用プレイヤー配列
   */
  static createMany(count: number): Player[] {
    const players: Player[] = [];
    for (let i = 0; i < count; i++) {
      players.push(this.create(`player_${i}`, `Player${i}`));
    }
    return players;
  }
}

/**
 * テスト用ゲーム状態生成ファクトリー
 */
export class GameStateFactory {
  /**
   * ゲーム状態を生成
   *
   * @param players ゲームに参加するプレイヤー配列
   * @param fieldCard 場札
   * @returns テスト用ゲーム状態
   */
  static create(players: Player[] = [], fieldCard: Card = CardFactory.create(5, 'hearts')): any {
    return {
      gameId: `game_${Date.now()}`,
      currentPlayer: players[0] || PlayerFactory.create(),
      fieldCard,
      players: players.length > 0 ? players : [PlayerFactory.create()],
      multiplier: 1,
      gamePhase: 'playing',
      deckState: {
        deck: CardFactory.createMany(40),
        discardPile: [],
        fieldCard,
        reshuffleCount: 0, selectedSuit: null,
      },
      doboDeclarations: [],
      returnDoboDeclarations: [],
      lastPlayedPlayer: players[0]?.id || 'player_0',
    };
  }
}

/**
 * テスト用ターン状態生成ファクトリー
 */
export class TurnStateFactory {
  /**
   * ターン状態を生成
   *
   * @param playerIds プレイヤーID配列
   * @param currentPlayerIndex 現在のプレイヤーインデックス
   * @returns テスト用ターン状態
   */
  static create(playerIds: string[] = ['player_0', 'player_1'], currentPlayerIndex: number = 0): any {
    return {
      currentPlayerIndex,
      turnOrder: playerIds,
      turnDirection: 'forward',
      skippedPlayerIds: [],
      forcedDrawCount: 0,
      hasDrawnThisTurn: false,
      drawnCardThisTurn: null,
      openHandPlayerIds: [],
    };
  }
}

/**
 * テスト用倍率状態生成ファクトリー
 */
export class MultiplierStateFactory {
  /**
   * 倍率状態を生成
   *
   * @returns テスト用倍率状態
   */
  static create(): any {
    return {
      initialACount: 0,
      drawDoboCount: 0,
      openDoboCount: 0,
      returnDoboCount: 0,
      reshuffleCount: 0, selectedSuit: null,
      totalMultiplier: 1,
    };
  }
}

/**
 * テスト用ドボンフェーズ状態生成ファクトリー
 */
export class DoboPhaseStateFactory {
  /**
   * ドボンフェーズ状態を生成
   *
   * @returns テスト用ドボンフェーズ状態
   */
  static create(): any {
    return {
      isActive: false,
      firstDoboDeclaration: null,
      returnDeclarations: [],
      pendingPlayerIds: [],
      timeoutAt: new Date(),
    };
  }
}
