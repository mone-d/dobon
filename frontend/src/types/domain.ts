// ============================================================
// フロントエンド用型定義（バックエンドと共通）
// ============================================================

// Figmaコンポーネントで使用している型（Unicode symbols）
export type SuitSymbol = '♠' | '♥' | '♦' | '♣';
export type RankSymbol = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

// バックエンドAPI用の型
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type GamePhase =
  | 'playing'
  | 'suit-selection'
  | 'dobo-declaration'
  | 'return-dobo'
  | 'payment'
  | 'ended';
export type TurnDirection = 'forward' | 'reverse';
export type RoomStatus = 'waiting' | 'playing' | 'ended';
export type PaymentReason = 'dobo' | 'burst' | 'invalid-formula' | 'rule-violation';

// 型変換ヘルパー
export const suitToSymbol: Record<Suit, SuitSymbol> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const symbolToSuit: Record<SuitSymbol, Suit> = {
  '♥': 'hearts',
  '♦': 'diamonds',
  '♣': 'clubs',
  '♠': 'spades',
};

export const valueToRank: Record<CardValue, RankSymbol> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
};

export const rankToValue: Record<RankSymbol, CardValue> = {
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

export interface User {
  userId: string;
  userName: string;
  avatar: string;
  bio: string;
}

export interface Card {
  suit: Suit;
  value: CardValue;
  isPublic: boolean;
}

// Figmaコンポーネント用のカード型
export interface CardDisplay {
  suit: SuitSymbol;
  rank: RankSymbol;
  revealed: boolean;
}

// Card → CardDisplay 変換
export function toCardDisplay(card: Card): CardDisplay {
  return {
    suit: suitToSymbol[card.suit],
    rank: valueToRank[card.value],
    revealed: card.isPublic,
  };
}

// CardDisplay → Card 変換
export function fromCardDisplay(cardDisplay: CardDisplay): Card {
  return {
    suit: symbolToSuit[cardDisplay.suit],
    value: rankToValue[cardDisplay.rank],
    isPublic: cardDisplay.revealed,
  };
}

export interface Player {
  id: string;
  user: User;
  hand: Card[];
  handCount: number;
  isCurrentPlayer: boolean;
}

export interface DoboDeclarationEntity {
  playerId: string;
  formula: string;
  cards: Card[];
  timestamp: number;
  isValid: boolean;
}

export interface ReturnDoboDeclaration {
  playerId: string;
  formula: string;
  cards: Card[];
  timestamp: number;
  isValid: boolean;
}

export interface GameState {
  gameId: string;
  currentPlayer: Player;
  fieldCard: Card;
  players: Player[];
  multiplier: number;
  gamePhase: GamePhase;
  doboDeclarations: DoboDeclarationEntity[];
  returnDoboDeclarations: ReturnDoboDeclaration[];
  lastPlayedPlayer: Player | null;
  turnOrder: Player[];
  turnDirection: TurnDirection;
}

export interface Room {
  roomId: string;
  roomCode: string;
  creator: User;
  players: User[];
  baseRate: number;
  status: RoomStatus;
  createdAt: Date;
}

export interface Payment {
  payer: User;
  payee?: User;
  amount: number;
  reason: PaymentReason;
  drawnCard?: Card;
}

export interface GameResult {
  gameId: string;
  date: Date;
  players: User[];
  winner: User;
  loser: User;
  payments: Payment[];
  multiplier: number;
  baseRate: number;
}

export interface Statistics {
  userId: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  totalEarnings: number;
  totalPayments: number;
  averageEarnings: number;
  maxMultiplier: number;
}

export interface Ranking {
  rank: number;
  user: User;
  totalEarnings: number;
}

// クライアント用のGameState（バックエンドから実際に返される形式）
export interface PlayerForClient {
  id: string;
  name: string; // Backend returns name directly, not user.userName
  handCount: number;
  hand?: Card[]; // Optional: 自分のみ手札が見える
  isCurrentPlayer?: boolean; // Optional: 現在のターンプレイヤーかどうか
}

export interface GameStateForClient {
  gameId: string;
  currentPlayer: { id: string; name: string }; // Simplified player
  fieldCard: Card;
  players: PlayerForClient[];
  multiplier: number;
  gamePhase: GamePhase;
  lastPlayedPlayer: { id: string; name: string } | null; // Simplified player
  turnOrder: string[];
  turnDirection: TurnDirection;
  deckRemaining: number; // 山札の残り枚数
  selectedSuit: Suit | null; // 8のワイルドカードで選択されたスート
  effects?: {
    forcedDrawCount: number;       // 2の効果: 強制ドロー枚数
    openHandPlayerIds: string[];   // Kの効果: 手札公開中のプレイヤー
    skippedPlayerIds: string[];    // Aの効果: スキップされるプレイヤー
  };
}
