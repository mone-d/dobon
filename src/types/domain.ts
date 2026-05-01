/**
 * Domain Entities for Dobon Game
 * 
 * This file contains all domain entities as specified in:
 * aidlc-docs/construction/unit1-frontend/functional-design/domain-entities.md
 */

// ============================================================================
// 1. User (ユーザー)
// ============================================================================

export interface User {
  userId: string;           // ゲストID
  userName: string;         // ユーザー名
  avatar: string;          // アバター画像URL
  bio: string;             // 自己紹介
}

// ============================================================================
// 2. Card (カード)
// ============================================================================

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  suit: Suit;              // スート
  value: CardValue;        // 数字（A=1, J=11, Q=12, K=13）
  isPublic: boolean;       // このカードが公開されているか（K効果で公開されたカードのみ true）
}

// ============================================================================
// 3. Player (プレイヤー)
// ============================================================================

export interface Player {
  id: string;              // プレイヤーID
  user: User;              // ユーザー情報
  hand: Card[];            // 手札
  handCount: number;       // 手札枚数（表示用）
  isCurrentPlayer: boolean; // 現在のターンか
}

// ============================================================================
// 4. GameState (ゲーム状態)
// ============================================================================

export type GamePhase = 'playing' | 'dobo-declaration' | 'return-dobo' | 'payment' | 'ended';
export type TurnDirection = 'forward' | 'reverse';

export interface GameState {
  gameId: string;                                    // ゲームID
  currentPlayer: Player;                             // 現在のプレイヤー
  fieldCard: Card;                                   // 場札
  players: Player[];                                 // プレイヤー一覧
  multiplier: number;                               // 倍率
  gamePhase: GamePhase;                             // ゲームフェーズ
  doboDeclarations: DoboDeclaration[];              // ドボン宣言一覧
  returnDoboDeclarations: ReturnDoboDeclaration[];  // 返しドボン宣言一覧
  lastPlayedPlayer: Player | null;                  // 最後にカードを出したプレイヤー
  turnOrder: Player[];                              // ターン順序
  turnDirection: TurnDirection;                     // ターン方向
}

// ============================================================================
// 5. DoboDeclaration (ドボン宣言)
// ============================================================================

export interface DoboDeclaration {
  playerId: string;        // プレイヤーID
  formula: string;         // 演算式（例: "3+4+5"）
  cards: Card[];          // 使用したカード
  timestamp: number;      // 宣言時刻
  isValid: boolean;       // 有効か
}

// ============================================================================
// 6. ReturnDoboDeclaration (返しドボン宣言)
// ============================================================================

export interface ReturnDoboDeclaration {
  playerId: string;        // プレイヤーID
  formula: string;         // 演算式
  cards: Card[];          // 使用したカード
  timestamp: number;      // 宣言時刻
  isValid: boolean;       // 有効か
}

// ============================================================================
// 7. Room (ルーム)
// ============================================================================

export type RoomStatus = 'waiting' | 'playing' | 'ended';

export interface Room {
  roomId: string;          // ルームID
  roomCode: string;        // ルームコード（表示用）
  creator: User;           // ルーム作成者
  players: User[];         // プレイヤー一覧
  baseRate: number;        // 基本レート（掛け金）
  status: RoomStatus;      // ルームステータス
  createdAt: Date;         // 作成日時
}

// ============================================================================
// 8. GameResult (ゲーム結果)
// ============================================================================

export type PaymentReason = 'dobo' | 'burst' | 'invalid-formula';

export interface Payment {
  payer: User;             // 支払い者
  amount: number;          // 支払い金額
  reason: PaymentReason;   // 支払い理由
}

export interface GameResult {
  gameId: string;          // ゲームID
  date: Date;              // ゲーム日時
  players: User[];         // 参加プレイヤー
  winner: User;            // 勝者（ドボン宣言者）
  loser: User;             // 敗者（支払い者）
  payments: Payment[];     // 支払い情報（複数の支払い者がいる場合）
  multiplier: number;      // 倍率
  baseRate: number;        // 基本レート
}

// ============================================================================
// 9. Statistics (統計情報)
// ============================================================================

export interface Statistics {
  userId: string;          // ユーザーID
  totalGames: number;      // 総ゲーム数
  wins: number;            // 勝利数
  losses: number;          // 敗北数
  winRate: number;         // 勝率（%）
  totalEarnings: number;   // 総獲得金額
  totalPayments: number;   // 総支払金額
  averageEarnings: number; // 平均獲得金額
  maxMultiplier: number;   // 最高倍率
}

// ============================================================================
// 10. Ranking (ランキング)
// ============================================================================

export interface Ranking {
  rank: number;            // ランキング順位
  user: User;              // ユーザー
  totalEarnings: number;   // 総獲得金額
}

// ============================================================================
// Validation Rules
// ============================================================================

export const ValidationRules = {
  user: {
    userNameMinLength: 1,
    userNameMaxLength: 20,
    bioMaxLength: 100,
  },
  card: {
    validSuits: ['hearts', 'diamonds', 'clubs', 'spades'] as const,
    minValue: 1,
    maxValue: 13,
  },
  room: {
    minPlayers: 2,
    maxPlayers: 8,
    minBaseRate: 1,
  },
  gameState: {
    minMultiplier: 1,
  },
} as const;
