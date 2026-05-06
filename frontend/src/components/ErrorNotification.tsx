import { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';

export function ErrorNotification() {
  const { error, clearError } = useGameStore();

  useEffect(() => {
    if (error) {
      // エラーは5秒後に自動的にクリアされる（gameStoreで設定済み）
      // ここでは追加のクリーンアップは不要
    }
  }, [error]);

  if (!error) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
      <div className="bg-red-500/90 backdrop-blur-sm border border-red-400/50 rounded-lg shadow-lg px-4 py-3 max-w-md">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
