import { useEffect, useState } from 'react';

interface ReturnDoboUIProps {
  timeoutSeconds: number;
  onDeclareReturn: () => void;
  onDeclareNoReturn: () => void;
}

export function ReturnDoboUI({ timeoutSeconds, onDeclareReturn, onDeclareNoReturn }: ReturnDoboUIProps) {
  const [remainingTime, setRemainingTime] = useState(timeoutSeconds);

  useEffect(() => {
    setRemainingTime(timeoutSeconds);
    
    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeoutSeconds]);

  const progress = (remainingTime / timeoutSeconds) * 100;

  return (
    <div className="absolute top-12 left-2 right-2 z-40">
      <div className="bg-gradient-to-r from-orange-900 to-red-900 border border-orange-500/60 rounded-xl px-4 py-3 shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">⚡</span>
          <div className="flex-1">
            <div className="text-white font-black text-sm">返しドボンチャンス</div>
            <div className="text-orange-200/70 text-xs">手札でドボンできるなら返せます</div>
          </div>
          <div className="text-white font-black text-lg">{remainingTime}s</div>
        </div>
        
        <div className="bg-black/30 rounded-full h-1.5 overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onDeclareReturn}
            className="flex-1 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white font-black text-sm py-2.5 rounded-lg border border-red-400/30 transition-all active:scale-95"
          >
            🔄 返しドボン！
          </button>
          <button
            onClick={onDeclareNoReturn}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white/80 font-bold text-sm py-2.5 rounded-lg border border-white/20 transition-colors"
          >
            返さない
          </button>
        </div>
      </div>
    </div>
  );
}
