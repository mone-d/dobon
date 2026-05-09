import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';

interface PlayerStats {
  playerId: string;
  playerName: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  totalEarned: number;
  totalPaid: number;
  netBalance: number;
  maxMultiplier: number;
}

interface PlayerStatsModalProps {
  playerId: string;
  playerName: string;
  onClose: () => void;
}

export function PlayerStatsModal({ playerId, playerName, onClose }: PlayerStatsModalProps) {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { socket } = useGameStore.getState();
    if (!socket) return;

    socket.emit('stats:get-player', { playerId }, (response: any) => {
      if (response.success) {
        setStats(response.stats);
      }
      setLoading(false);
    });
  }, [playerId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-white/20 rounded-2xl p-5 w-[85%] max-w-[320px] shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <span className="text-white font-bold text-sm">{playerName} の成績</span>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white text-lg">✕</button>
        </div>

        {loading ? (
          <div className="text-center text-white/50 py-6">読み込み中...</div>
        ) : !stats || stats.totalGames === 0 ? (
          <div className="text-center text-white/50 py-6">まだ記録がありません</div>
        ) : (
          <div className="space-y-3">
            {/* 勝敗 */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/60 text-xs">総ゲーム数</span>
                <span className="text-white font-bold">{stats.totalGames}</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/60 text-xs">勝利 / 敗北</span>
                <span className="text-white font-bold">
                  <span className="text-green-400">{stats.wins}</span>
                  {' / '}
                  <span className="text-red-400">{stats.losses}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-xs">勝率</span>
                <span className="text-white font-bold">{stats.winRate}%</span>
              </div>
            </div>

            {/* 収支 */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/60 text-xs">総獲得</span>
                <span className="text-green-400 font-bold">¥{stats.totalEarned.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/60 text-xs">総支払</span>
                <span className="text-red-400 font-bold">¥{stats.totalPaid.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-1 mt-1">
                <span className="text-white/60 text-xs">収支</span>
                <span className={`font-black text-lg ${stats.netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.netBalance >= 0 ? '+' : ''}¥{stats.netBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 最高倍率 */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-xs">最高倍率</span>
                <span className="text-amber-400 font-bold">×{stats.maxMultiplier}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
