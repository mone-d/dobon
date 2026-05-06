import { PlayingCard } from './PlayingCard';

type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  suit: Suit;
  rank: Rank;
}

interface OpponentPlayerProps {
  name: string;
  cardCount: number;
  revealedCards?: Card[];
  isCurrentTurn: boolean;
  dobonDeclared?: boolean;
}

// ---------- 公開カード行 ----------
function RevealedCardRow({
  cards,
  availableWidth,
}: {
  cards: Card[];
  availableWidth: number;
}) {
  if (cards.length === 0) return null;
  const CARD_W = 28;
  const CARD_H = 40;
  const step =
    cards.length > 1
      ? Math.min(CARD_W - 2, (availableWidth - CARD_W) / (cards.length - 1))
      : CARD_W;
  const useCornerOnly = step < 15;
  const totalWidth = Math.ceil((cards.length - 1) * step + CARD_W);

  return (
    <div className="relative shrink-0" style={{ width: totalWidth, height: CARD_H }}>
      {cards.map((card, idx) => (
        <div
          key={`${card.suit}-${card.rank}-${idx}`}
          className="absolute bottom-0"
          style={{ left: Math.round(idx * step), zIndex: idx + 1 }}
        >
          <PlayingCard
            suit={card.suit}
            rank={card.rank}
            size="xs"
            cornerOnly={useCornerOnly && idx < cards.length - 1}
          />
        </div>
      ))}
    </div>
  );
}

// ---------- 裏向きカードスタック ----------
function HiddenCardStack({ count }: { count: number }) {
  if (count <= 0) return null;
  const visible = Math.min(count, 5);
  const extra = count - visible;
  const width = 28 + (visible - 1) * 8;

  return (
    <div className="relative shrink-0" style={{ width, height: 40 }}>
      {Array.from({ length: visible }).map((_, i) => (
        <div key={`hidden-${i}`} className="absolute bottom-0" style={{ left: i * 8, zIndex: i }}>
          <PlayingCard faceDown size="xs" />
        </div>
      ))}
      {extra > 0 && (
        <div className="absolute -top-1 -right-1 bg-gray-700 border border-gray-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center z-10">
          +{extra}
        </div>
      )}
    </div>
  );
}

// ---------- メインコンポーネント ----------
export function OpponentPlayer({
  name,
  cardCount,
  revealedCards = [],
  isCurrentTurn,
  dobonDeclared = false,
}: OpponentPlayerProps) {
  const hiddenCount = cardCount - revealedCards.length;

  // セル内カード表示幅の目安:
  // max-w-[430px] ÷ 3列 − padding(p-2=8px×2) − gap考慮 ≈ 108px
  const CELL_CARD_WIDTH = 108;

  const allRevealed = hiddenCount === 0 && revealedCards.length > 0;
  const allHidden = revealedCards.length === 0 && hiddenCount > 0;

  // 全公開かつ8枚以上は2行に分割
  const rows: Card[][] = [];
  if (allRevealed && revealedCards.length > 7) {
    const mid = Math.ceil(revealedCards.length / 2);
    rows.push(revealedCards.slice(0, mid));
    rows.push(revealedCards.slice(mid));
  } else if (revealedCards.length > 0) {
    rows.push(revealedCards);
  }

  // 混合時の公開カードに使える幅（裏スタック分を引く）
  const hiddenStackWidth = hiddenCount > 0
    ? 28 + (Math.min(hiddenCount, 5) - 1) * 8 + 6  // +6 は gap-1.5
    : 0;
  const revealedWidthInMixed = CELL_CARD_WIDTH - hiddenStackWidth;

  return (
    <div
      className={`
        rounded-xl p-2 border-2 transition-all duration-300 relative overflow-hidden
        ${dobonDeclared
          ? 'border-red-400 bg-red-950/50 shadow-lg shadow-red-500/40 animate-pulse'
          : isCurrentTurn
            ? 'border-yellow-400 bg-yellow-950/40 shadow-md shadow-yellow-400/30'
            : 'border-white/10 bg-white/5'}
      `}
    >
      {/* ドボン宣言エフェクト：赤い光彩 */}
      {dobonDeclared && (
        <div className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ boxShadow: 'inset 0 0 12px rgba(239,68,68,0.4)' }} />
      )}

      {/* 名前 + ターン表示 + 枚数バッジ */}
      <div className="flex items-center gap-1 mb-1.5">
        {dobonDeclared && (
          <span className="text-red-400 text-[10px] animate-bounce shrink-0">🎯</span>
        )}
        {!dobonDeclared && isCurrentTurn && (
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
        )}
        <span className={`text-xs font-bold truncate flex-1 ${
          dobonDeclared ? 'text-red-300' : isCurrentTurn ? 'text-yellow-300' : 'text-white/80'
        }`}>
          {name}
        </span>
        {dobonDeclared ? (
          <span className="text-[10px] font-black px-1 py-0.5 rounded shrink-0 bg-red-500 text-white">
            DOBON!
          </span>
        ) : (
          <span className={`text-[10px] font-semibold px-1 py-0.5 rounded shrink-0 ${
            isCurrentTurn ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60'
          }`}>
            {cardCount}枚
          </span>
        )}
      </div>

      {/* カードエリア */}
      <div className="flex flex-col gap-1 overflow-hidden">

        {/* ── 全公開 ── */}
        {allRevealed && rows.map((row, rowIdx) => (
          <RevealedCardRow key={rowIdx} cards={row} availableWidth={CELL_CARD_WIDTH} />
        ))}

        {/* ── 全裏向き ── */}
        {allHidden && (
          <HiddenCardStack count={hiddenCount} />
        )}

        {/* ── 混合（裏あり + 公開あり） ── */}
        {!allRevealed && !allHidden && (
          <div className="flex items-end gap-1.5">
            <HiddenCardStack count={hiddenCount} />
            <RevealedCardRow cards={revealedCards} availableWidth={revealedWidthInMixed} />
          </div>
        )}

        {/* 手札なし */}
        {cardCount === 0 && (
          <div className="text-white/20 text-[10px] italic h-10 flex items-center">
            手札なし
          </div>
        )}
      </div>
    </div>
  );
}