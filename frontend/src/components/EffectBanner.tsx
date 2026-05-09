/**
 * 特殊カード効果バナー
 * 画面最上部に表示。全特殊カード共通。
 * - A(スキップ), 9(リバース): 次のカードプレイまで表示
 * - 2(2ドロー), K(オープン): タイムアウトと同じ時間表示
 */

interface EffectBannerProps {
  /** 表示するエフェクト情報 */
  effect: {
    icon: string;
    text: string;
    color: string;
  } | null;
}

export function EffectBanner({ effect }: EffectBannerProps) {
  if (!effect) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-30 p-2">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-white text-xs font-bold shadow-lg ${effect.color}`}
      >
        <span>{effect.icon}</span>
        <span>{effect.text}</span>
      </div>
    </div>
  );
}
