type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

type CardSize = 'xs' | 'sm' | 'md' | 'lg';

interface PlayingCardProps {
  suit?: Suit;
  rank?: Rank;
  faceDown?: boolean;
  selected?: boolean;
  revealed?: boolean;
  onClick?: () => void;
  size?: CardSize;
  /** 横に重なって表示されるとき、左端（コーナー）のみ表示するか */
  cornerOnly?: boolean;
}

const sizeConfig: Record<CardSize, { card: string; corner: string; suit: string; center: string }> = {
  xs: { card: 'w-7 h-10',   corner: 'text-[9px]',  suit: 'text-[8px]',  center: 'text-sm' },
  sm: { card: 'w-10 h-14',  corner: 'text-[10px]', suit: 'text-[10px]', center: 'text-base' },
  md: { card: 'w-14 h-[76px]', corner: 'text-xs',  suit: 'text-xs',     center: 'text-2xl' },
  lg: { card: 'w-16 h-24',  corner: 'text-sm',     suit: 'text-sm',     center: 'text-3xl' },
};

export function PlayingCard({
  suit,
  rank,
  faceDown = false,
  selected = false,
  revealed = false,
  onClick,
  size = 'md',
  cornerOnly = false,
}: PlayingCardProps) {
  const isRed = suit === '♥' || suit === '♦';
  const cfg = sizeConfig[size];

  if (faceDown) {
    return (
      <div
        className={`
          ${cfg.card} rounded-lg flex items-center justify-center shrink-0
          bg-gradient-to-br from-blue-800 to-blue-950
          border border-blue-600/60
          ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}
        `}
        onClick={onClick}
      >
        {/* カード裏面パターン */}
        <div className="w-[80%] h-[80%] border border-blue-500/40 rounded-sm
          bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.04)_0px,rgba(255,255,255,0.04)_2px,transparent_2px,transparent_6px)]" />
      </div>
    );
  }

  return (
    <div
      className={`
        ${cfg.card} rounded-lg bg-white shrink-0 relative
        border-2 ${selected ? 'border-yellow-400 shadow-md shadow-yellow-400/60 -translate-y-3' : revealed ? 'border-red-400 shadow-sm shadow-red-400/30' : 'border-gray-200'}
        ${onClick ? 'cursor-pointer active:scale-95 transition-all duration-150' : ''}
        overflow-hidden
      `}
      onClick={onClick}
    >
      {/* 左上コーナー */}
      <div className={`absolute top-0.5 left-0.5 flex flex-col items-center leading-tight ${cfg.corner} font-black ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        <span>{rank}</span>
        <span className={cfg.suit}>{suit}</span>
      </div>

      {!cornerOnly && (
        <>
          {/* 中央スート */}
          <div className={`absolute inset-0 flex items-center justify-center ${cfg.center} ${isRed ? 'text-red-500' : 'text-gray-800'} select-none`}>
            {suit}
          </div>

          {/* 右下コーナー（逆向き） */}
          <div className={`absolute bottom-0.5 right-0.5 flex flex-col items-center leading-tight ${cfg.corner} font-black ${isRed ? 'text-red-600' : 'text-gray-900'} rotate-180`}>
            <span>{rank}</span>
            <span className={cfg.suit}>{suit}</span>
          </div>
        </>
      )}
    </div>
  );
}
