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
  onCardClick: (index: number) => void;
  onPlayCards?: () => void;
}

export function PlayerHand({ cards, selectedIndices, onCardClick, onPlayCards }: PlayerHandProps) {
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
            const leftPos = idx * overlapStep;

            return (
              <div
                key={`${card.suit}-${card.rank}-${idx}`}
                className="absolute bottom-0 transition-all duration-200"
                style={{
                  left: `${leftPos}px`,
                  zIndex: idx + 1,
                  transform: isSelected ? 'translateY(-10px)' : 'translateY(0)',
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}