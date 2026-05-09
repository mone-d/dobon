import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';

interface RoomBalanceEntry {
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  totalAmount: number;
}

interface RoomBalanceModalProps {
  roomId: string;
  onClose: () => void;
}

export function RoomBalanceModal({ roomId, onClose }: RoomBalanceModalProps) {
  const [balance, setBalance] = useState<RoomBalanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { socket } = useGameStore.getState();
    if (!socket) return;

    socket.emit('stats:get-room-balance', { roomId }, (response: any) => {
      if (response.success) {
        setBalance(response.balance);
      }
      setLoading(false);
    });
  }, [roomId]);

  // ネット収支を計算
  const netBalances = new Map<string, { name: string; net: number }>();
  for (const entry of balance) {
    // 支払い側
    const from = netBalances.get(entry.fromPlayerId) || { name: entry.fromPlayerName, net: 0 };
    from.net -= entry.totalAmount;
    from.name = entry.fromPlayerName;
    netBalances.set(entry.fromPlayerId, from);
    // 受取側
    const to = netBalances.get(entry.toPlayerId) || { name: entry.toPlayerName, net: 0 };
    to.net += entry.totalAmount;
    to.name = entry.toPlayerName;
    netBalances.set(entry.toPlayerId, to);
  }
  const netList = Array.from(netBalances.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.net - a.net);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-white/20 rounded-2xl p-5 w-[85%] max-w-[340px] shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <span className="text-white font-bold text-sm">ルーム収支</span>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white text-lg">✕</button>
        </div>

        {loading ? (
          <div className="text-center text-white/50 py-6">読み込み中...</div>
        ) : balance.length === 0 ? (
          <div className="text-center text-white/50 py-6">まだ記録がありません</div>
        ) : (
          <div className="space-y-4">
            {/* ネット収支 */}
            <div>
              <div className="text-white/50 text-xs mb-2 font-bold">差引収支</div>
              <div className="space-y-1.5">
                {netList.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-white text-sm font-bold">{entry.name}</span>
                    <span className={`font-black text-sm ${entry.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.net >= 0 ? '+' : ''}¥{entry.net.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 詳細 */}
            <div>
              <div className="text-white/50 text-xs mb-2 font-bold">支払い詳細</div>
              <div className="space-y-1">
                {balance.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-white/5 rounded px-2 py-1.5">
                    <span className="text-white/80">
                      {entry.fromPlayerName} → {entry.toPlayerName}
                    </span>
                    <span className="text-amber-300 font-bold">¥{entry.totalAmount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
