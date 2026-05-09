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
  onTap?: () => void;
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
      ? Math.max(12, Math.min(CARD_W - 2, (availableWidth - CARD_W) / (cards.length - 1)))
      : CARD_W;
  const useCornerOnly = step < 20;
  const totalWidth = Math.min(availableWidth, Math.ceil((cards.length - 1) * step + CARD_W));

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
function HiddenCardStack({ count, compact = false }: { count: number; compact?: boolean }) {
  if (count <= 0) return null;
  const maxVisible = compact ? 3 : 5;
  const spacing = compact ? 5 : 8;
  const visible = Math.min(count, maxVisible);
  const extra = count - visible;
  const width = 28 + (visible - 1) * spacing;

  return (
    <div className="relative shrink-0" style={{ width, height: 40 }}>
      {Array.from({ length: visible }).map((_, i) => (
        <div key={`hidden-${i}`} className="absolute bottom-0" style={{ left: i * spacing, zIndex: i }}>
          <PlayingCard faceDown size="xs" />
        </div>
      ))}
      {extra > 0 && (
        <div className="absolute -top-1 -right-1 bg-gray-700 border border-gray-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center z-10">
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
  onTap,
}: OpponentPlayerProps) {
  const hiddenCount = cardCount - revealedCards.length;

  const allRevealed = hiddenCount === 0 && revealedCards.length > 0;
  const allHidden = revealedCards.length === 0 && hiddenCount > 0;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onTap?.(); }}
      className={`
        rounded-xl p-2 border-2 transition-all duration-300 relative overflow-hidden cursor-pointer
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
            ドボン!
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
        {(() => {
          const CELL_W = 108;
          const CARD_W = 28;
          const MIN_STEP = 12; // 左上コーナーが見える最小ステップ
          const MAX_PER_ROW = Math.floor((CELL_W - CARD_W) / MIN_STEP) + 1; // 7枚

          // 全裏向き: スタック1個 + 枚数バッジ
          if (allHidden) {
            return <HiddenCardStack count={hiddenCount} />;
          }

          // 手札なし
          if (cardCount === 0) {
            return (
              <div className="text-white/20 text-[10px] italic h-10 flex items-center">
                手札なし
              </div>
            );
          }

          // 全公開: 7枚以下なら1行、8枚以上なら2行
          if (allRevealed) {
            if (revealedCards.length <= MAX_PER_ROW) {
              return <RevealedCardRow cards={revealedCards} availableWidth={CELL_W} />;
            }
            const mid = Math.ceil(revealedCards.length / 2);
            return (
              <>
                <RevealedCardRow cards={revealedCards.slice(0, mid)} availableWidth={CELL_W} />
                <RevealedCardRow cards={revealedCards.slice(mid)} availableWidth={CELL_W} />
              </>
            );
          }

          // 混合: 裏(コンパクト1枚+バッジ=32px) + 表を残り幅で配置
          // 裏スタックコンパクト幅: 32px、残り幅: 108-32-4(gap)=72px
          // 72pxで表示可能枚数: floor((72-28)/12)+1 = 4枚
          const HIDDEN_COMPACT_W = 32;
          const GAP = 4;
          const remainingW = CELL_W - HIDDEN_COMPACT_W - GAP;
          const maxRevealedInRow1 = Math.floor((remainingW - CARD_W) / MIN_STEP) + 1; // 4枚

          if (revealedCards.length <= maxRevealedInRow1) {
            // 1行に収まる: [裏コンパクト][表全部]
            return (
              <div className="flex items-end gap-1">
                <HiddenCardStack count={hiddenCount} compact />
                <RevealedCardRow cards={revealedCards} availableWidth={remainingW} />
              </div>
            );
          }

          // 2行必要: 1行目=[裏コンパクト]+[表の前半]、2行目=[表の後半]
          const row1Count = maxRevealedInRow1;
          const row1Cards = revealedCards.slice(0, row1Count);
          const row2Cards = revealedCards.slice(row1Count);

          return (
            <>
              <div className="flex items-end gap-1">
                <HiddenCardStack count={hiddenCount} compact />
                <RevealedCardRow cards={row1Cards} availableWidth={remainingW} />
              </div>
              <RevealedCardRow cards={row2Cards} availableWidth={CELL_W} />
            </>
          );
        })()}
      </div>
    </div>
  );
}