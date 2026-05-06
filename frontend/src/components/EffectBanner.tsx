/**
 * 特殊カード効果バナー
 * ゲームフィールドの上に表示される一時的な通知
 */

interface EffectBannerProps {
  forcedDrawCount: number;
  skippedPlayerIds: string[];
  playerNames: Record<string, string>;
}

export function EffectBanner({
  forcedDrawCount,
  skippedPlayerIds,
  playerNames,
}: EffectBannerProps) {
  const effects: Array<{ icon: string; text: string; color: string }> = [];

  // 強制ドロー
  if (forcedDrawCount > 0) {
    effects.push({
      icon: '⚡',
      text: `強制ドロー +${forcedDrawCount}枚`,
      color: 'bg-red-600/80 border-red-400/50',
    });
  }

  // スキップ
  if (skippedPlayerIds.length > 0) {
    const names = skippedPlayerIds.map(id => playerNames[id] || id).join(', ');
    effects.push({
      icon: '⏭',
      text: `スキップ: ${names}`,
      color: 'bg-blue-600/80 border-blue-400/50',
    });
  }

  if (effects.length === 0) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-30 flex flex-col gap-1 p-2">
      {effects.map((effect, idx) => (
        <div
          key={idx}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-white text-xs font-bold shadow-lg ${effect.color}`}
        >
          <span>{effect.icon}</span>
          <span>{effect.text}</span>
        </div>
      ))}
    </div>
  );
}
