import { PlayingCard } from './PlayingCard';

type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  suit: Suit;
  rank: Rank;
  revealed: boolean;
}

interface PlayerHandProps {
  cards: Card[];
  selectedIndices: number[];
  highlightIndices?: number[];
  onCardClick: (index: number) => void;
  onPlayCards?: () => void;
}

export function PlayerHand({ cards, selectedIndices, highlightIndices = [], onCardClick, onPlayCards }: PlayerHandProps) {
  const cardCount = cards.length;

  // カード幅 56px (w-14)
  // コンテナ有効幅: 画面幅 - パディング = 約350px (max-w-[430px] - 2*16px padding)
  const CARD_WIDTH = 56;
  const CONTAINER_WIDTH = 350;

  // 重なり量を計算: 全カードがコンテナに収まるように
  // total = (N-1)*overlap + CARD_WIDTH <= CONTAINER_WIDTH
  // overlap = (CONTAINER_WIDTH - CARD_WIDTH) / (N-1)
  const isOverlapping = cardCount > 5;
  const rawOverlap = cardCount > 1 ? (CONTAINER_WIDTH - CARD_WIDTH) / (cardCount - 1) : CARD_WIDTH + 8;
  // カード幅未満 & 最低18px (左上コーナーが見える分) を確保
  const overlapStep = isOverlapping
    ? Math.max(18, Math.min(CARD_WIDTH - 2, rawOverlap))
    : CARD_WIDTH + 8; // 8px間隔

  // 全体の横幅
  const totalWidth = cardCount > 0 ? (cardCount - 1) * overlapStep + CARD_WIDTH : 0;

  return (
    <div className="bg-gray-900/70 border-t-2 border-gray-700/80 px-4 py-3">
      {/* ヘッダー行 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-white/90 text-sm font-bold">手札</span>
          <span className="bg-white/10 text-white/70 text-xs px-1.5 py-0.5 rounded-full">{cardCount}枚</span>
        </div>
        {selectedIndices.length > 0 && (
          <button
            onClick={onPlayCards}
            className="bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold text-sm px-4 py-1.5 rounded-lg shadow transition-colors"
          >
            {selectedIndices.length}枚出す
          </button>
        )}
      </div>

      {/* カードエリア */}
      <div className="flex items-end justify-center" style={{ height: '84px' }}>
        <div
          className="relative flex items-end"
          style={{ width: `${totalWidth}px`, height: '76px' }}
        >
          {cards.map((card, idx) => {
            const isSelected = selectedIndices.includes(idx);
            const isHighlighted = highlightIndices.includes(idx);
            const selectionOrder = isSelected ? selectedIndices.indexOf(idx) + 1 : 0;
            const leftPos = idx * overlapStep;

            return (
              <div
                key={`${card.suit}-${card.rank}-${idx}`}
                className={`absolute bottom-0 transition-all duration-200 ${isHighlighted ? 'animate-pulse' : ''}`}
                style={{
                  left: `${leftPos}px`,
                  zIndex: idx + 1,
                  transform: isSelected ? 'translateY(-10px)' : isHighlighted ? 'translateY(-5px)' : 'translateY(0)',
                  filter: isHighlighted ? 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.8))' : undefined,
                }}
              >
                <PlayingCard
                  suit={card.suit}
                  rank={card.rank}
                  revealed={card.revealed}
                  selected={isSelected}
                  onClick={() => onCardClick(idx)}
                  size="md"
                  cornerOnly={isOverlapping && idx < cardCount - 1}
                />
                {/* 選択順序バッジ（複数選択時） */}
                {isSelected && selectedIndices.length > 1 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center z-50">
                    <span className="text-white text-[10px] font-black">{selectionOrder}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}