/**
 * 2/K効果のタイムアウトゲージ + 受け入れボタン
 * EffectBannerの下に表示される。タイトルや補足説明なし。
 */

import { useEffect, useState } from 'react';

interface EffectCountdownProps {
  effectType: 'forced-draw' | 'open-hand';
  victimId: string;
  currentUserId: string;
  timeoutSeconds: number;
  effectCount?: number;
  onAccept?: () => void;
}

export function EffectCountdown({
  effectType,
  victimId,
  currentUserId,
  timeoutSeconds,
  effectCount,
  onAccept,
}: EffectCountdownProps) {
  const [remaining, setRemaining] = useState(timeoutSeconds);
  const isVictim = victimId === currentUserId;

  useEffect(() => {
    setRemaining(timeoutSeconds);
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeoutSeconds, victimId, effectCount]);

  const progress = (remaining / timeoutSeconds) * 100;

  const config = effectType === 'forced-draw'
    ? {
        barColor: 'from-red-400 to-orange-500',
        bgColor: 'bg-red-900/80',
        borderColor: 'border-red-500/40',
        acceptLabel: `${effectCount || 2}枚引く`,
      }
    : {
        barColor: 'from-amber-400 to-yellow-500',
        bgColor: 'bg-amber-900/80',
        borderColor: 'border-amber-500/40',
        acceptLabel: 'オープンする',
      };

  return (
    <div className="absolute top-10 left-2 right-2 z-40">
      <div className={`${config.bgColor} border ${config.borderColor} rounded-xl px-4 py-2.5 shadow-2xl`}>
        {/* タイムゲージ */}
        <div className="flex items-center gap-3 mb-1.5">
          <div className="flex-1 bg-black/30 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${config.barColor} transition-all duration-1000 ease-linear`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-white font-black text-sm">{remaining}s</div>
        </div>
        {/* 被害者のみ: 受け入れボタン */}
        {isVictim && onAccept && (
          <button
            onClick={onAccept}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-sm py-2 rounded-lg transition-colors"
          >
            {config.acceptLabel}
          </button>
        )}
      </div>
    </div>
  );
}
