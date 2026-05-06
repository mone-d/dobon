import { useState, useCallback, useEffect } from 'react';
import { OpponentPlayer } from './components/OpponentPlayer';
import { GameField } from './components/GameField';
import { PlayerHand } from './components/PlayerHand';
import { DobonEffectOverlay, type DobonInfo } from './components/DobonEffectOverlay';

type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  suit: Suit;
  rank: Rank;
  revealed: boolean;
}

export default function App() {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // 相手ドボン（パターンD固定）
  const [opponentDobonActive, setOpponentDobonActive] = useState(true);
  const [opponentPopupVisible, setOpponentPopupVisible] = useState(true);
  const [opponentShowKey, setOpponentShowKey] = useState(0);

  // 自分ドボン（パターンZ固定）
  const [selfDobonActive, setSelfDobonActive] = useState(false);
  const [selfPopupVisible, setSelfPopupVisible] = useState(false);
  const [selfShowKey, setSelfShowKey] = useState(0);

  // デモ用倍率
  const [multiplier, setMultiplier] = useState(2);

  // ── ドボン情報モック ──
  const opponentDobonInfo: DobonInfo = {
    playerName: 'みか',
    cards: [
      { suit: '♠' as Suit, rank: '5' as Rank },
      { suit: '♥' as Suit, rank: '5' as Rank },
    ],
    formula: '5 + 5',
    result: '10',
    isSelf: false,
  };

  const selfDobonInfo: DobonInfo = {
    playerName: 'あなた',
    cards: [
      { suit: '♠' as Suit, rank: 'A' as Rank },
      { suit: '♥' as Suit, rank: '9' as Rank },
    ],
    formula: '1 + 9',
    result: '10',
    isSelf: true,
  };

  // ── 対戦相手データ ──
  const opponents = [
    {
      name: 'さくら',
      cardCount: 5,
      revealedCards: [
        { suit: '♥' as Suit, rank: '7' as Rank },
        { suit: '♦' as Suit, rank: 'J' as Rank },
      ],
      isCurrentTurn: false,
      dobonDeclared: false,
    },
    {
      name: 'たろう',
      cardCount: 13,
      revealedCards: [
        { suit: '♠' as Suit, rank: 'A'  as Rank },
        { suit: '♥' as Suit, rank: '2'  as Rank },
        { suit: '♦' as Suit, rank: '3'  as Rank },
        { suit: '♣' as Suit, rank: '4'  as Rank },
        { suit: '♠' as Suit, rank: '5'  as Rank },
        { suit: '♥' as Suit, rank: '6'  as Rank },
        { suit: '♦' as Suit, rank: '7'  as Rank },
        { suit: '♣' as Suit, rank: '8'  as Rank },
        { suit: '♠' as Suit, rank: '9'  as Rank },
        { suit: '♥' as Suit, rank: '10' as Rank },
        { suit: '♦' as Suit, rank: 'J'  as Rank },
        { suit: '♣' as Suit, rank: 'Q'  as Rank },
        { suit: '♠' as Suit, rank: 'K'  as Rank },
      ],
      isCurrentTurn: true,
      dobonDeclared: false,
    },
    {
      name: 'はな',
      cardCount: 5,
      revealedCards: [
        { suit: '♣' as Suit, rank: 'K' as Rank },
        { suit: '♦' as Suit, rank: '2' as Rank },
      ],
      isCurrentTurn: false,
      dobonDeclared: false,
    },
    {
      name: 'けん',
      cardCount: 8,
      revealedCards: [],
      isCurrentTurn: false,
      dobonDeclared: false,
    },
    {
      name: 'みか',
      cardCount: 2,
      revealedCards: [{ suit: '♠' as Suit, rank: 'A' as Rank }],
      isCurrentTurn: false,
      dobonDeclared: opponentDobonActive,
    },
  ];

  // ── 自分の手札 ──
  const playerHand: Card[] = [
    { suit: '♠', rank: 'A',  revealed: true },
    { suit: '♥', rank: '5',  revealed: true },
    { suit: '♦', rank: '5',  revealed: true },
    { suit: '♣', rank: '5',  revealed: true },
    { suit: '♦', rank: 'J',  revealed: true },
    { suit: '♠', rank: '9',  revealed: true },
    { suit: '♥', rank: 'K',  revealed: true },
    { suit: '♣', rank: 'K',  revealed: true },
    { suit: '♦', rank: '7',  revealed: true },
    { suit: '♣', rank: '2',  revealed: true },
    { suit: '♠', rank: '4',  revealed: true },
    { suit: '♥', rank: '10', revealed: true },
    { suit: '♠', rank: '8',  revealed: true },
  ];

  // ── ハンドラ ──
  const handleCardClick = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else {
      const clickedCard = playerHand[index];
      if (selectedIndices.length > 0) {
        const firstSelected = playerHand[selectedIndices[0]];
        if (clickedCard.rank !== firstSelected.rank) {
          setSelectedIndices([index]);
        } else {
          setSelectedIndices([...selectedIndices, index]);
        }
      } else {
        setSelectedIndices([index]);
      }
    }
  };

  const handlePlayCards = () => setSelectedIndices([]);
  const handleDrawCard = () => console.log('Draw card');

  // DOBONボタン → 自分ドボン発動
  const handleDobon = () => {
    setSelfDobonActive(true);
    setSelfPopupVisible(true);
    setSelfShowKey(prev => prev + 1);
  };

  const handleOpponentDismiss = useCallback(() => {
    setOpponentPopupVisible(false);
  }, []);

  const handleSelfDismiss = useCallback(() => {
    setSelfPopupVisible(false);
  }, []);

  // 相手ドボンポップアップを 1500ms 後に自動消去
  // deps を opponentShowKey のみにすることで、倍率ボタン等の再レンダリングに影響されない
  useEffect(() => {
    if (!opponentPopupVisible) return;
    const id = setTimeout(() => setOpponentPopupVisible(false), 1500);
    return () => clearTimeout(id);
  }, [opponentShowKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentTurnPlayer = opponents.find(o => o.isCurrentTurn);

  return (
    <div
      className="flex items-center justify-center min-h-screen w-full"
      style={{ background: 'linear-gradient(135deg, #0a3d1f 0%, #0d2e17 50%, #061a0e 100%)' }}
    >
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: '100%',
          maxWidth: '430px',
          height: '100dvh',
          background: 'linear-gradient(180deg, #0d3520 0%, #0a2818 40%, #081e12 100%)',
        }}
      >

        {/* ══════════ デモコントロールバー ══════════ */}
        <div className="shrink-0 bg-black/60 border-b border-white/10 px-3 py-1.5 flex flex-col gap-1.5">
          {/* 行1: DOBONトグル */}
          <div className="flex items-center gap-2">
            <span className="text-white/25 text-[9px] font-bold tracking-wider shrink-0">DEMO</span>
            <div className="w-px h-3 bg-white/10" />
            <button
              onClick={() => {
                const next = !opponentDobonActive;
                setOpponentDobonActive(next);
                setOpponentPopupVisible(next);
                setOpponentShowKey(prev => prev + 1);
              }}
              className={`text-[9px] font-bold px-2 py-0.5 rounded transition-colors shrink-0 border
                ${opponentDobonActive
                  ? 'bg-red-800/70 text-red-200 border-red-600/40'
                  : 'bg-white/5 text-white/30 border-white/10'
                }`}
            >
              相手DOBON {opponentDobonActive ? '● ON' : '○ OFF'}
            </button>
            <button
              onClick={() => {
                const next = !selfDobonActive;
                setSelfDobonActive(next);
                setSelfPopupVisible(next);
                setSelfShowKey(prev => prev + 1);
              }}
              className={`text-[9px] font-bold px-2 py-0.5 rounded transition-colors shrink-0 border
                ${selfDobonActive
                  ? 'bg-blue-800/70 text-blue-200 border-blue-600/40'
                  : 'bg-white/5 text-white/30 border-white/10'
                }`}
            >
              自分DOBON {selfDobonActive ? '● ON' : '○ OFF'}
            </button>
          </div>
          {/* 行2: 倍率セレクター */}
          <div className="flex items-center gap-1.5">
            <span className="text-white/25 text-[9px] font-bold tracking-wider shrink-0">レート</span>
            <div className="w-px h-3 bg-white/10" />
            {[2, 4, 6, 8, 10].map(m => (
              <button
                key={m}
                onClick={() => setMultiplier(m)}
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors shrink-0 border
                  ${multiplier === m
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-white/5 text-white/30 border-white/10'
                  }`}
              >
                ×{m}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════ ヘッダー ══════════ */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-black/30 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-base">🃏</span>
            <span className="text-white/80 text-xs font-bold tracking-wider">DOBON</span>
          </div>
          {currentTurnPlayer && (
            <div className="flex items-center gap-1.5 bg-yellow-900/40 border border-yellow-500/40 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-yellow-300 text-xs font-semibold">{currentTurnPlayer.name}のターン</span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 rounded-full px-2.5 py-0.5">
            <span className="text-amber-400/70 text-[10px]">BASE</span>
            <span className="text-amber-300 text-xs font-bold">¥100</span>
          </div>
        </div>

        {/* ══════════ 対戦相手エリア ══════════ */}
        <div className="shrink-0 p-2 pb-1">
          <div className="grid grid-cols-3 gap-1.5">
            {opponents.map((opponent, idx) => (
              <OpponentPlayer key={idx} {...opponent} />
            ))}
          </div>
        </div>

        <div className="mx-3 border-t border-white/10" />

        {/* ══════════ ゲームフィールド（中央） ══════════ */}
        <GameField
          deckCount={28}
          discardPile={{ suit: '♦', rank: '10' }}
          discardedBy="さくら"
          multiplier={multiplier}
          dobonDeclarations={[]}
          onDrawCard={handleDrawCard}
        />

        {/* ══════════ 手札エリア（下部） ══════════ */}
        <div className="shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20 border-t border-white/5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shrink-0">
              <span className="text-white text-[9px] font-black">自</span>
            </div>
            <span className="text-white/80 text-xs font-bold">あなた</span>
            <span className="text-white/40 text-xs">—</span>
            <span className="text-white/50 text-xs">自分のターン待ち</span>
          </div>

          <PlayerHand
            cards={playerHand}
            selectedIndices={selectedIndices}
            onCardClick={handleCardClick}
            onPlayCards={handlePlayCards}
          />

          <div className="bg-gray-950/60 px-4 pb-4 pt-2">
            <button
              onClick={handleDobon}
              className="w-full bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 active:from-red-700 active:to-red-900 text-white font-black text-base py-3 rounded-xl shadow-lg shadow-red-900/50 border border-red-400/30 transition-all active:scale-95"
            >
              🎯 DOBON！
            </button>
          </div>
        </div>

        {/* ══════════ ドボンエフェクトオーバーレイ（相手：パターンD） ══════════ */}
        <DobonEffectOverlay
          key={`opponent-${opponentShowKey}`}
          pattern="D"
          info={opponentDobonInfo}
          visible={opponentPopupVisible}
          onDismiss={handleOpponentDismiss}
        />

        {/* ══════════ ドボンエフェクトオーバーレイ（自分：パターンZ） ══════════ */}
        <DobonEffectOverlay
          key={`self-${selfShowKey}`}
          pattern="Z"
          info={selfDobonInfo}
          visible={selfPopupVisible}
          onDismiss={handleSelfDismiss}
        />
      </div>
    </div>
  );
}