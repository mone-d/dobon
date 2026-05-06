import { useRoomStore } from '../stores/roomStore';
import { useUserStore } from '../stores/userStore';
import { useGameStore } from '../stores/gameStore';

interface RoomScreenProps {
  onLeave: () => void;
  onGameStart: () => void;
}

export default function RoomScreen({ onLeave, onGameStart }: RoomScreenProps) {
  const { currentUser } = useUserStore();
  const { currentRoom, leaveRoom } = useRoomStore();
  const { startGame } = useGameStore();

  const handleStartGame = () => {
    if (!currentUser || !currentRoom) return;
    
    // Convert room players to game players format
    const players = currentRoom.players.map(p => ({
      id: p.userId,
      user: p,
    }));
    
    // Call backend to start game
    startGame(currentRoom.roomId, players, currentRoom.baseRate);
    
    // Navigate to game screen
    onGameStart();
  };

  const handleLeave = () => {
    leaveRoom();
    onLeave();
  };

  if (!currentRoom) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">読み込み中...</div>
      </div>
    );
  }

  const isCreator = currentRoom.creator.userId === currentUser?.userId;
  const canStart = currentRoom.players.length >= 2;

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
            <button
              onClick={handleLeave}
              className="text-white/60 hover:text-white text-xl transition-colors"
              aria-label="ルームを退出"
            >
              ←
            </button>
            <span className="text-green-400 text-xl">🃏</span>
            <span className="text-white/80 text-sm font-bold tracking-wider">ルーム</span>
          </div>
          <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 rounded-full px-2.5 py-0.5">
            <span className="text-amber-400/70 text-[10px]">BASE</span>
            <span className="text-amber-300 text-xs font-bold">¥{currentRoom.baseRate}</span>
          </div>
        </div>

        {/* Room Code Display */}
        <div className="shrink-0 p-4 bg-black/20 border-b border-white/5">
          <div className="text-center mb-3">
            <p className="text-white/60 text-xs mb-1">ルームコード</p>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-6 py-3">
              <span className="text-white font-mono font-black text-3xl tracking-[0.3em]">
                {currentRoom.roomCode}
              </span>
            </div>
            <p className="text-white/40 text-xs mt-2">
              このコードを友達に共有してください
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm">プレイヤー</span>
            <span className="text-white font-bold">{currentRoom.players.length}/6</span>
          </div>
          {!canStart && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-2 mt-2">
              <p className="text-yellow-300 text-xs text-center">
                最低2人のプレイヤーが必要です
              </p>
            </div>
          )}
        </div>

        {/* Player List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {currentRoom.players.map((player, idx) => {
            const isCurrentUser = player.userId === currentUser?.userId;
            const playerIsCreator = player.userId === currentRoom.creator.userId;

            return (
              <div
                key={player.userId}
                className={`bg-white/5 border rounded-xl p-3 ${
                  isCurrentUser ? 'border-green-400/50 bg-green-500/10' : 'border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                      <span className="text-white text-sm font-black">
                        {player.userName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{player.userName}</span>
                        {playerIsCreator && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            作成者
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                            あなた
                          </span>
                        )}
                      </div>
                      <span className="text-white/40 text-xs">プレイヤー #{idx + 1}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty Slots */}
          {Array.from({ length: 6 - currentRoom.players.length }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="bg-white/5 border border-dashed border-white/20 rounded-xl p-3"
            >
              <div className="flex items-center gap-3 opacity-40">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-white/40 text-xl">?</span>
                </div>
                <span className="text-white/40 text-sm">待機中...</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="shrink-0 p-4 bg-black/20 border-t border-white/5 space-y-2">
          {isCreator ? (
            <button
              onClick={handleStartGame}
              disabled={!canStart}
              className={`w-full font-black text-base py-3 rounded-xl shadow-lg border transition-all ${
                canStart
                  ? 'bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 active:from-green-700 active:to-green-900 text-white shadow-green-900/50 border-green-400/30 active:scale-95'
                  : 'bg-white/10 text-white/40 border-white/10 cursor-not-allowed'
              }`}
            >
              {canStart ? 'ゲーム開始' : `あと${2 - currentRoom.players.length}人必要`}
            </button>
          ) : (
            <div className="w-full text-center py-3 text-white/60 text-sm">
              作成者がゲームを開始するのを待っています...
            </div>
          )}

          <button
            onClick={handleLeave}
            className="w-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white font-bold py-2 rounded-lg transition-colors"
          >
            ルームを退出
          </button>
        </div>
      </div>
    </div>
  );
}
