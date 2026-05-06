// ============================================================
// Unit 1 (Frontend) と共通のエンティティ
// ============================================================

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

// ============================================================
// バックエンド専用エンティティ
// ============================================================

export interface DeckState {
  deck: Card[];
  discardPile: Card[];
  fieldCard: Card;
  reshuffleCount: number;
  selectedSuit: Suit | null; // 8のワイルドカードで選択されたスート
}

export interface TurnState {
  currentPlayerIndex: number;
  turnOrder: string[]; // プレイヤーIDの配列
  turnDirection: TurnDirection;
  hasDrawnThisTurn: boolean;
  drawnCardThisTurn: Card | null;
  skippedPlayerIds: string[];
  forcedDrawCount: number; // 2効果スタッキング対応（累積枚数）
  openHandPlayerIds: string[]; // K効果で手札公開中のプレイヤーID
  // ※ openHandExpiresAtTurnEnd は削除: カードが場に出されるまでオープン継続
}

export interface MultiplierState {
  initialACount: number;
  drawDoboCount: number;
  openDoboCount: number;
  returnDoboCount: number;
  reshuffleCount: number;
  totalMultiplier: number;
}

export interface DoboPhaseState {
  isActive: boolean;
  firstDoboDeclaration: DoboDeclarationEntity | null;
  returnDeclarations: ReturnDoboDeclaration[];
  noReturnPlayerIds: string[];
  pendingPlayerIds: string[];
  timeoutAt: number;
  timeoutSeconds: number; // デフォルト 10秒
}

export interface GameSession {
  sessionId: string;
  roomId: string;
  gameState: GameState;
  deckState: DeckState;
  turnState: TurnState;
  multiplierState: MultiplierState;
  doboPhaseState: DoboPhaseState;
  baseRate: number;
  leaveNextPlayerIds: string[];
  createdAt: number;
  startedAt: number | null;
  endedAt: number | null;
}

export interface CardValidationResult {
  isValid: boolean;
  reason?: string;
}

export interface DoboValidationResult {
  isValid: boolean;
  isRuleViolation: boolean;
  matchedFormula: string | null;
  penalty: boolean;
  reason?: string;
}

// クライアントに送信する GameState（手札情報をプレイヤーごとにカスタマイズ）
export interface PlayerForClient {
  id: string;
  name: string; // Simplified: user.userName only
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
}
