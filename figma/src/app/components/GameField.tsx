import { PlayingCard } from './PlayingCard';

type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  suit: Suit;
  rank: Rank;
}

interface DobonDeclaration {
  playerName: string;
  cards: Card[];
  formula: string;
  result: string;
}

interface GameFieldProps {
  deckCount: number;
  discardPile?: Card;
  discardedBy?: string;
  multiplier?: number;
  dobonDeclarations?: DobonDeclaration[];
  onDrawCard?: () => void;
}

export function GameField({
  deckCount,
  discardPile,
  discardedBy,
  multiplier = 1,
  dobonDeclarations = [],
  onDrawCard,
}: GameFieldProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 py-2 relative">

      {/* ドボン表示バナー */}
      {dobonDeclarations.length > 0 && (
        <div className="w-full flex flex-col gap-1.5">
          {dobonDeclarations.map((dobon, idx) => (
            <div
              key={idx}
              className="w-full bg-gradient-to-r from-red-700 to-red-600 border border-red-400/60 rounded-xl px-3 py-2 shadow-lg shadow-red-900/50"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-black text-sm">
                    DOBON! &nbsp;<span className="text-yellow-300">{dobon.playerName}</span>
                  </div>
                  <div className="text-red-200 text-xs">
                    {dobon.formula} = <span className="font-bold text-white">{dobon.result}</span>
                  </div>
                </div>
                {/* 使用カード */}
                <div className="flex gap-0.5 shrink-0">
                  {dobon.cards.map((card, cardIdx) => (
                    <PlayingCard key={cardIdx} suit={card.suit} rank={card.rank} size="xs" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 山札・場札エリア */}
      <div className="flex items-center justify-center gap-8">
        {/* 山札 */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`relative ${onDrawCard ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
            onClick={onDrawCard}
          >
            <PlayingCard faceDown size="lg" />
            {/* 枚数バッジ */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
              {deckCount}枚
            </div>
          </div>
          <span className="text-white/60 text-xs mt-3">山札</span>
        </div>

        {/* レートバッジ */}
        {multiplier > 1 && (() => {
          const style = getRateStyle(multiplier);
          return (
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex flex-col items-center px-3 py-1.5 rounded-2xl border${style.pulse ? ' rate-badge-pulse' : ''}`}
                style={{
                  background: style.bg,
                  boxShadow: style.pulse ? undefined : style.shadow,
                  borderColor: style.border,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                <span
                  className="text-white font-black tracking-tight"
                  style={{ fontSize: '2rem', lineHeight: 1, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
                >
                  ×{multiplier}
                </span>
              </div>
              <span
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: style.labelColor }}
              >
                レート
              </span>
            </div>
          );
        })()}

        {/* 場札 */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            {discardPile ? (
              <>
                <PlayingCard suit={discardPile.suit} rank={discardPile.rank} size="lg" />
                {discardedBy && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                    {discardedBy}
                  </div>
                )}
              </>
            ) : (
              <div className="w-16 h-24 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white/30 text-xs">空</span>
              </div>
            )}
          </div>
          <span className="text-white/60 text-xs mt-3">場札</span>
        </div>
      </div>
    </div>
  );
}

/** 倍率に応じたバッジスタイルを返す（倍率は2の倍数、10超は×10と同色） */
function getRateStyle(m: number): {
  bg: string;
  shadow: string;
  border: string;
  labelColor: string;
  pulse: boolean;
} {
  if (m >= 8) {
    // ×8 / ×10（以上も同色）: 深紅・グロー点滅
    return {
      bg: 'linear-gradient(160deg, #ff1a1a 0%, #991b1b 100%)',
      shadow: '0 0 28px rgba(255,50,50,0.85), 0 0 55px rgba(220,38,38,0.5)',
      border: 'rgba(255,120,120,0.6)',
      labelColor: '#fca5a5',
      pulse: true,
    };
  }
  if (m >= 6) {
    // ×6: オレンジ→レッド
    return {
      bg: 'linear-gradient(160deg, #f97316 0%, #b91c1c 100%)',
      shadow: '0 0 22px rgba(249,115,22,0.75), 0 0 40px rgba(185,28,28,0.4)',
      border: 'rgba(249,115,22,0.55)',
      labelColor: '#fdba74',
      pulse: false,
    };
  }
  if (m >= 4) {
    // ×4: ゴールド
    return {
      bg: 'linear-gradient(160deg, #fbbf24 0%, #d97706 100%)',
      shadow: '0 0 18px rgba(251,191,36,0.65)',
      border: 'rgba(251,191,36,0.5)',
      labelColor: '#fde68a',
      pulse: false,
    };
  }
  // ×2: ブルー
  return {
    bg: 'linear-gradient(160deg, #60a5fa 0%, #4f46e5 100%)',
    shadow: '0 0 10px rgba(96,165,250,0.45)',
    border: 'rgba(96,165,250,0.4)',
    labelColor: '#bfdbfe',
    pulse: false,
  };
}