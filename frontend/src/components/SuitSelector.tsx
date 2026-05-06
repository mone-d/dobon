interface SuitSelectorProps {
  onSelectSuit: (suit: '♠' | '♥' | '♦' | '♣') => void;
}

export function SuitSelector({ onSelectSuit }: SuitSelectorProps) {
  const suits: Array<{ suit: '♠' | '♥' | '♦' | '♣'; color: string; name: string }> = [
    { suit: '♠', color: 'text-gray-900', name: 'スペード' },
    { suit: '♥', color: 'text-red-500', name: 'ハート' },
    { suit: '♦', color: 'text-red-500', name: 'ダイヤ' },
    { suit: '♣', color: 'text-gray-900', name: 'クラブ' },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent pt-8 pb-4 px-4">
      <div className="text-center mb-3">
        <div className="text-yellow-400 text-xs font-bold tracking-widest uppercase">ワイルドカード</div>
        <div className="text-white font-black text-base">スートを選択</div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {suits.map(({ suit, color, name }) => (
          <button
            key={suit}
            onClick={() => onSelectSuit(suit)}
            className="bg-white hover:bg-gray-100 active:scale-90 border-2 border-gray-300 rounded-xl py-3 transition-all shadow-lg"
          >
            <div className={`text-3xl ${color} mb-0.5`}>{suit}</div>
            <div className="text-gray-700 text-[10px] font-semibold">{name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
