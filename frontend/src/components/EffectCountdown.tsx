import { useEffect, useState } from 'react';

interface EffectCountdownProps {
  effectType: 'forced-draw' | 'open-hand';
  victimId: string;
  currentUserId: string;
  counterCard: number; // 2 or 13
  timeoutSeconds: number;
  effectCount?: number; // 強制ドロー枚数
  onAccept?: () => void; // 被害者が効果を受け入れる
}

export function EffectCountdown({
  effectType,
  victimId,
  currentUserId,
  counterCard,
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
  const counterCardName = counterCard === 2 ? '2' : 'K';

  const config = effectType === 'forced-draw'
    ? {
        icon: '⚡',
        title: `強制ドロー +${effectCount || 0}枚`,
        color: 'from-red-800 to-red-900',
        borderColor: 'border-red-500/60',
        barColor: 'from-red-400 to-orange-500',
        acceptLabel: `${effectCount || 2}枚引く`,
      }
    : {
        icon: '👁',
        title: '手札オープン',
        color: 'from-amber-800 to-orange-900',
        borderColor: 'border-amber-500/60',
        barColor: 'from-amber-400 to-yellow-500',
        acceptLabel: 'オープンする',
      };

  const subtitle = isVictim
    ? `${counterCardName}で押し付け / ドボン / 受け入れ`
    : '効果発動待ち...';

  return (
    <div className="absolute top-12 left-2 right-2 z-40">
      <div className={`bg-gradient-to-r ${config.color} border ${config.borderColor} rounded-xl px-4 py-3 shadow-2xl`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{config.icon}</span>
          <div className="flex-1">
            <div className="text-white font-black text-sm">{config.title}</div>
            <div className="text-white/70 text-xs">{subtitle}</div>
          </div>
          <div className="text-white font-black text-lg">{remaining}s</div>
        </div>
        <div className="bg-black/30 rounded-full h-1.5 overflow-hidden mb-2">
          <div
            className={`h-full bg-gradient-to-r ${config.barColor} transition-all duration-1000 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* 被害者のみ: 受け入れボタン */}
        {isVictim && onAccept && (
          <button
            onClick={onAccept}
            className="w-full mt-1 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-sm py-2 rounded-lg transition-colors"
          >
            {config.acceptLabel}
          </button>
        )}
      </div>
    </div>
  );
}
