import { useState, useEffect } from 'react';
import { useUserStore } from '../stores/userStore';

export default function HomeScreen() {
  const { createGuestUser, setUser } = useUserStore();
  const [userName, setUserName] = useState('');
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [existingId, setExistingId] = useState('');
  const [savedGuestId, setSavedGuestId] = useState<string | null>(null);

  useEffect(() => {
    // Check for previously saved guest ID in localStorage
    try {
      const stored = localStorage.getItem('dobon-user-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.currentUser?.userId) {
          setSavedGuestId(parsed.state.currentUser.userId);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const handleStart = () => {
    const name = userName.trim() || `ゲスト${Math.floor(Math.random() * 10000)}`;
    createGuestUser(name);
  };

  const handleResumeWithId = () => {
    const id = existingId.trim();
    if (!id) return;
    
    // Validate format: should start with "guest_"
    if (!id.startsWith('guest_')) {
      alert('無効なゲストIDです。"guest_" で始まるIDを入力してください。');
      return;
    }
    
    // Create user with the specified ID
    const user = {
      userId: id,
      userName: `ゲスト${id.slice(-4)}`,
      avatar: '👤',
      bio: 'Guest player',
    };
    setUser(user);
  };

  const handleUseSavedId = () => {
    if (savedGuestId) {
      setExistingId(savedGuestId);
      setMode('existing');
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen w-full"
      style={{ background: 'linear-gradient(135deg, #0a3d1f 0%, #0d2e17 50%, #061a0e 100%)' }}
    >
      <div
        className="relative flex flex-col items-center justify-center overflow-hidden p-8"
        style={{
          width: '100%',
          maxWidth: '430px',
          height: '100dvh',
          background: 'linear-gradient(180deg, #0d3520 0%, #0a2818 40%, #081e12 100%)' ,
        }}
      >
        {/* Logo */}
        <div className="mb-10">
          <div className="text-6xl mb-4 text-center">🃏</div>
          <h1 className="text-5xl font-black text-white tracking-wider text-center mb-2">
            DOBON
          </h1>
          <p className="text-green-400/70 text-sm text-center tracking-wide">
            オンライン対戦カードゲーム
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="w-full max-w-sm mb-4">
          <div className="flex rounded-lg overflow-hidden border border-white/20">
            <button
              onClick={() => setMode('new')}
              className={`flex-1 py-2 text-sm font-bold transition-colors ${
                mode === 'new'
                  ? 'bg-green-600 text-white'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              新規ゲスト
            </button>
            <button
              onClick={() => setMode('existing')}
              className={`flex-1 py-2 text-sm font-bold transition-colors ${
                mode === 'existing'
                  ? 'bg-green-600 text-white'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              既存IDで再開
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="w-full max-w-sm space-y-4">
          {mode === 'new' ? (
            <>
              <div>
                <label className="block text-white/70 text-sm font-bold mb-2">
                  プレイヤー名
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="名前を入力（省略可）"
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/50 transition-all"
                  maxLength={20}
                />
                <p className="text-white/40 text-xs mt-1">
                  省略するとランダムな名前が付きます
                </p>
              </div>

              <button
                onClick={handleStart}
                className="w-full bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 active:from-green-700 active:to-green-900 text-white font-black text-lg py-4 rounded-xl shadow-lg shadow-green-900/50 border border-green-400/30 transition-all active:scale-95"
              >
                ゲームを始める
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-white/70 text-sm font-bold mb-2">
                  ゲストID
                </label>
                <input
                  type="text"
                  value={existingId}
                  onChange={(e) => setExistingId(e.target.value)}
                  placeholder="guest_1234567890_abcdefg"
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/50 transition-all font-mono text-sm"
                />
                <p className="text-white/40 text-xs mt-1">
                  以前使用したゲストIDを入力してください
                </p>
              </div>

              {savedGuestId && (
                <button
                  onClick={handleUseSavedId}
                  className="w-full bg-white/10 hover:bg-white/20 text-white/80 font-bold py-2 rounded-lg transition-colors text-sm border border-white/20"
                >
                  💾 前回のID: {savedGuestId.slice(0, 20)}...
                </button>
              )}

              <button
                onClick={handleResumeWithId}
                disabled={!existingId.trim()}
                className={`w-full font-black text-lg py-4 rounded-xl shadow-lg border transition-all active:scale-95 ${
                  existingId.trim()
                    ? 'bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 active:from-green-700 active:to-green-900 text-white shadow-green-900/50 border-green-400/30'
                    : 'bg-white/10 text-white/40 border-white/10 cursor-not-allowed'
                }`}
              >
                IDで再開
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 text-center">
          <p className="text-white/30 text-xs">
            ゲストとしてプレイ
          </p>
        </div>
      </div>
    </div>
  );
}
