import { useState, useEffect } from 'react';
import type { Card } from '../types/domain';
import { toCardDisplay } from '../types/domain';
import { PlayingCard } from '../components/PlayingCard';
import { useGameStore } from '../stores/gameStore';

interface Payment {
  payer: { id: string; name: string };
  payee: { id: string; name: string };
  amount: number;
  reason: string;
  drawnCard: Card | null;
}

export interface GameEndData {
  winnerId: string;
  winnerName: string;
  loserId?: string;
  loserName: string;
  multiplier: number;
  baseRate: number;
  payments: Payment[];
  doboFormula: string;
  doboCards?: Card[];
  fieldCard?: Card;
  returnCount: number;
  isBurst?: boolean;
  isPenalty?: boolean;
  isTenho?: boolean;
  penaltyReason?: 'rule_violation' | 'invalid_formula';
  paymentAceCount?: number;
}

interface GameResultScreenProps {
  data: GameEndData;
  currentUserId: string;
  onPlayAgain: () => void;
  onExit: () => void;
}

export default function GameResultScreen({ data, currentUserId, onPlayAgain, onExit }: GameResultScreenProps) {
  const isWinner = data.winnerId === currentUserId;
  const isLoser = data.loserId === currentUserId;
  
  const payment = data.payments[0];
  const isMultiPayee = data.payments.length > 1;
  const totalPaymentAmount = data.payments.reduce((sum, p) => sum + p.amount, 0);

  const [isReady, setIsReady] = useState(false);
  const [readyCount, setReadyCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [countdown, setCountdown] = useState(15);

  // 15秒カウントダウン（最初の人が押してからサーバー側で管理されるが、UIでも表示）
  useEffect(() => {
    const { socket } = useGameStore.getState();
    if (!socket) return;

    const handleReadyUpdate = (data: any) => {
      setReadyCount(data.readyCount);
      setTotalPlayers(data.totalPlayers);
      // 最初の人が押した時からカウントダウン開始
      if (data.readyCount === 1 && !isReady) {
        // 他の人が先に押した
        setCountdown(15);
      }
    };

    socket.on('game:next-round-ready', handleReadyUpdate);
    return () => { socket.off('game:next-round-ready', handleReadyUpdate); };
  }, [isReady]);

  // カウントダウンタイマー（readyCountが1以上になったら開始）
  useEffect(() => {
    if (readyCount === 0) return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [readyCount > 0]); // readyCountが0→1になった時のみ開始

  const handleNextRound = () => {
    if (isReady) return; // 二重押し防止
    setIsReady(true);

    const { socket, currentRoomId } = useGameStore.getState();
    if (!socket || !currentRoomId) {
      onPlayAgain();
      return;
    }
    
    socket.emit('game:next-round', { roomId: currentRoomId }, (response: any) => {
      if (response.success) {
        if (response.roomEnded) {
          onExit();
        }
        // waiting: true → game:started イベントで遷移
      } else {
        console.error('❌ Next round failed:', response.error);
        setIsReady(false);
      }
    });
  };

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
        {/* スクロール可能なコンテンツエリア */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start px-4 py-4">
        {/* 結果ヘッダー */}
        <div className="text-center mb-4">
          <div className="text-6xl mb-4">{data.isTenho ? '🀄' : isWinner ? '🎉' : isLoser ? '😢' : '👀'}</div>
          <h1 className={`text-4xl font-black mb-2 ${data.isTenho ? 'text-red-400' : isWinner ? 'text-yellow-300' : isLoser ? 'text-red-400' : 'text-white/70'}`}>
            {data.isTenho ? '天鳳！！' : isWinner ? 'WIN!' : isLoser ? 'LOSE...' : 'ゲーム終了'}
          </h1>
          <p className="text-white/70 text-sm">
            {data.isTenho
              ? `${data.winnerName} が初手ドボン！全員から徴収！`
              : data.isBurst
              ? `${data.loserName} がバースト（手札14枚）`
              : data.isPenalty
              ? `${data.loserName} がチョボン（${data.penaltyReason === 'rule_violation' ? '自札ドボン' : '計算不一致'}）`
              : isWinner
              ? 'ドボン成功！'
              : isLoser
              ? 'ドボンされました...'
              : `${data.winnerName} がドボン成功`}
          </p>
        </div>

        {/* ドボン情報 / バースト情報 */}
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
          {data.isBurst ? (
            <div className="text-center">
              <div className="text-3xl mb-2">💥</div>
              <div className="text-red-400 text-xs font-bold tracking-wider">BURST</div>
              <div className="text-white font-black text-lg mt-1">
                {data.loserName} がバースト
              </div>
              <div className="text-white/60 text-sm mt-1">手札が14枚になり敗北</div>
            </div>
          ) : data.isPenalty ? (
            <div className="text-center">
              <div className="text-3xl mb-2">⚠️</div>
              <div className="text-orange-400 text-xs font-bold tracking-wider">チョボン</div>
              <div className="text-white font-black text-lg mt-1">
                {data.loserName} がドボン失敗
              </div>
              <div className="text-white/60 text-sm mt-1">
                {data.penaltyReason === 'rule_violation'
                  ? '自分が出したカードにはドボンできません'
                  : '手札で場札の数字を作れず敗北'}
              </div>
              {/* 失敗者の手札と場札を表示 */}
              {data.doboCards && data.doboCards.length > 0 && data.fieldCard && (
                <div className="bg-black/30 rounded-lg p-3 mt-3">
                  <div className="text-white/50 text-xs mb-2">宣言者の手札 → 場札</div>
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    {data.doboCards.map((card, i) => {
                      const display = toCardDisplay(card);
                      return <PlayingCard key={i} suit={display.suit} rank={display.rank} size="xs" />;
                    })}
                    <span className="text-white/40 mx-1">→</span>
                    {(() => {
                      const fc = toCardDisplay(data.fieldCard);
                      return <PlayingCard suit={fc.suit} rank={fc.rank} size="xs" />;
                    })()}
                  </div>
                  <div className="text-white/40 text-xs mt-1">場札: {data.fieldCard.value}</div>
                </div>
              )}
            </div>
          ) : (
          <>
          <div className="text-center mb-3">
            <span className="text-green-400 text-xs font-bold tracking-wider">ドボン</span>
            <div className="text-white font-black text-lg mt-1">
              🎯 {data.winnerName} のドボン！
            </div>
            {data.returnCount > 0 && (
              <div className="text-orange-400 text-xs mt-1">
                ドボン返し: {data.returnCount}回
              </div>
            )}
          </div>

          {/* ドボンに使った手札と場札 */}
          {data.doboCards && data.doboCards.length > 0 && data.fieldCard && (
            <div className="bg-black/30 rounded-lg p-3 mt-2">
              <div className="text-white/50 text-xs mb-2 text-center">ドボンの内訳</div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {data.doboCards.map((card, i) => {
                  const display = toCardDisplay(card);
                  return <PlayingCard key={i} suit={display.suit} rank={display.rank} size="sm" />;
                })}
                <span className="text-white/60 text-sm font-bold mx-1">
                  {data.doboFormula ? `(${data.doboFormula})` : ''}
                </span>
                <span className="text-yellow-300 font-black">=</span>
                {(() => {
                  const fc = toCardDisplay(data.fieldCard);
                  return <PlayingCard suit={fc.suit} rank={fc.rank} size="sm" />;
                })()}
              </div>
              <div className="text-center mt-2 text-white/40 text-xs">
                場札: {data.fieldCard.value}
              </div>
            </div>
          )}
          </>
          )}
        </div>

        {/* 支払い情報 */}
        {payment && (
          <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
            <div className="text-center mb-3">
              <span className="text-amber-400 text-xs font-bold tracking-wider">PAYMENT</span>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="text-center">
                <div className="text-white/60 text-xs">敗者</div>
                <div className="text-red-400 font-bold">{payment.payer.name}</div>
              </div>
              <div className="text-white/40 text-xl">→</div>
              <div className="text-center">
                <div className="text-white/60 text-xs">勝者</div>
                <div className="text-green-400 font-bold">
                  {isMultiPayee ? '全員' : payment.payee.name}
                </div>
              </div>
            </div>

            {/* 支払いカード */}
            {payment.drawnCard && (
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="text-white/60 text-xs">支払いカード:</span>
                {(() => {
                  const display = toCardDisplay(payment.drawnCard);
                  return <PlayingCard suit={display.suit} rank={display.rank} size="sm" />;
                })()}
              </div>
            )}

            {/* 計算式 */}
            <div className="bg-black/30 rounded-lg p-3 text-center">
              <div className="text-white/50 text-xs mb-1">支払い額</div>
              {data.paymentAceCount && data.paymentAceCount > 0 && (
                <div className="text-red-400 text-xs font-bold mb-1 animate-pulse">
                  🃏 支払いカードでAが{data.paymentAceCount}枚！×{Math.pow(2, data.paymentAceCount)}
                </div>
              )}
              <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
                {payment.drawnCard && (
                  <>
                    <span>{payment.drawnCard.value}</span>
                    <span className="text-white/40">×</span>
                  </>
                )}
                <span>¥{data.baseRate}</span>
                <span className="text-white/40">×</span>
                <span className="text-amber-400">×{data.multiplier}</span>
                {data.paymentAceCount && data.paymentAceCount > 0 && (
                  <>
                    <span className="text-white/40">×</span>
                    <span className="text-red-400">A×{Math.pow(2, data.paymentAceCount)}</span>
                  </>
                )}
              </div>
              <div className="text-yellow-300 font-black text-2xl mt-2">
                ¥{payment.amount.toLocaleString()}
                {isMultiPayee && <span className="text-white/50 text-sm font-normal"> × {data.payments.length}人</span>}
              </div>
              {isMultiPayee && (
                <div className="text-white/50 text-xs mt-1">
                  合計: ¥{totalPaymentAmount.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 倍率情報 */}
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">最終倍率</span>
            <span className="text-amber-300 font-black text-lg">×{data.multiplier}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-white/60 text-sm">基本レート</span>
            <span className="text-white font-bold">¥{data.baseRate}</span>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="w-full max-w-sm space-y-3 mt-auto pt-4 pb-2 shrink-0">
          <button
            onClick={handleNextRound}
            disabled={isReady}
            className={`w-full font-black text-base py-3 rounded-xl shadow-lg border transition-all active:scale-95 ${
              isReady
                ? 'bg-gray-600 text-gray-300 border-gray-500/30 shadow-none'
                : 'bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 active:from-green-700 active:to-green-900 text-white shadow-green-900/50 border-green-400/30'
            }`}
          >
            {isReady
              ? `待機中... ${readyCount}/${totalPlayers} (残り${countdown}秒)`
              : readyCount > 0
              ? `もう一度プレイ (${readyCount}/${totalPlayers} 残り${countdown}秒)`
              : 'もう一度プレイ'}
          </button>
          <button
            onClick={onExit}
            className="w-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white font-bold py-2 rounded-lg transition-colors"
          >
            ロビーに戻る
          </button>
        </div>
        </div>{/* end scrollable content */}
      </div>
    </div>
  );
}
