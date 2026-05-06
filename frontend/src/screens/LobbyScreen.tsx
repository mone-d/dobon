import { useState } from 'react';
import { useRoomStore } from '../stores/roomStore';
import { useUserStore } from '../stores/userStore';

export default function LobbyScreen() {
  const { currentUser } = useUserStore();
  const { createRoom, joinRoom } = useRoomStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [baseRate, setBaseRate] = useState(100);
  const [roomCode, setRoomCode] = useState('');

  const handleCreateRoom = () => {
    if (!currentUser) return;
    createRoom(currentUser, baseRate);
    setShowCreateModal(false);
  };

  const handleJoinByCode = () => {
    if (!currentUser || !roomCode.trim()) return;
    joinRoom(roomCode.trim().toUpperCase(), currentUser);
    setRoomCode('');
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
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/30 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-xl">🃏</span>
            <span className="text-white/80 text-sm font-bold tracking-wider">DOBON ロビー</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
              <span className="text-white text-xs font-black">自</span>
            </div>
            <span className="text-white/90 text-sm font-bold">{currentUser?.userName}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Join by Room Code */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h2 className="text-white font-bold text-lg mb-3">ルームコードで参加</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABCD"
                maxLength={4}
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/50 transition-all text-center font-mono text-xl tracking-widest uppercase"
              />
              <button
                onClick={handleJoinByCode}
                disabled={roomCode.trim().length !== 4}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  roomCode.trim().length === 4
                    ? 'bg-green-600 hover:bg-green-500 active:bg-green-700 text-white'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                参加
              </button>
            </div>
            <p className="text-white/40 text-xs mt-2">
              4文字のルームコードを入力してください
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h2 className="text-white font-bold text-lg mb-3">遊び方</h2>
            <div className="space-y-2 text-white/60 text-sm">
              <p>1. 「ルームを作成」でルームを作ります</p>
              <p>2. ルームコードを友達に共有します</p>
              <p>3. 2〜6人揃ったらゲーム開始！</p>
            </div>
          </div>
        </div>

        {/* Create Room Button */}
        <div className="shrink-0 p-4 bg-black/20 border-t border-white/5">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 active:from-green-700 active:to-green-900 text-white font-black text-base py-3 rounded-xl shadow-lg shadow-green-900/50 border border-green-400/30 transition-all active:scale-95"
          >
            ＋ ルームを作成
          </button>
        </div>

        {/* Create Room Modal */}
        {showCreateModal && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-6 w-full max-w-sm border border-white/10">
              <h2 className="text-white text-xl font-bold mb-4">ルームを作成</h2>
              
              <div className="mb-6">
                <label className="block text-white/70 text-sm font-bold mb-2">
                  基本レート（円）
                </label>
                <input
                  type="number"
                  value={baseRate}
                  onChange={(e) => setBaseRate(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/50"
                  min={10}
                  max={10000}
                  step={10}
                />
                <p className="text-white/40 text-xs mt-1">
                  10円〜10,000円
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-lg transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleCreateRoom}
                  className="flex-1 bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white font-bold py-2 rounded-lg transition-colors"
                >
                  作成
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
