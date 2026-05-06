import { useEffect, useState } from 'react';
import { PlayingCard } from './PlayingCard';

type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export type DobonPattern = 'A' | 'B' | 'C' | 'D' | 'X' | 'Y' | 'Z';

export interface DobonInfo {
  playerName: string;
  cards: Array<{ suit: Suit; rank: Rank }>;
  formula: string;
  result: string;
  isSelf: boolean;
}

// ── カード＋計算式の共通パーツ ──
function CardFormula({
  cards,
  formula,
  result,
  size = 'sm',
}: {
  cards: DobonInfo['cards'];
  formula: string;
  result: string;
  size?: 'xs' | 'sm';
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {cards.map((c, i) => (
          <PlayingCard key={i} suit={c.suit} rank={c.rank} size={size} />
        ))}
      </div>
      <div className="text-white">
        <div className="text-xs font-mono text-white/50">{formula}</div>
        <div className="text-yellow-300 font-black text-xl leading-none">= {result}</div>
      </div>
    </div>
  );
}

interface Props {
  pattern: DobonPattern;
  info: DobonInfo;
  visible: boolean;
  onDismiss: () => void;
}

export function DobonEffectOverlay({ pattern, info, visible, onDismiss }: Props) {
  const [show, setShow] = useState(false);
  const [flash, setFlash] = useState(false);

  // mount → enter アニメーション
  useEffect(() => {
    if (visible) {
      const id = setTimeout(() => setShow(true), 20);
      return () => clearTimeout(id);
    } else {
      setShow(false);
    }
  }, [visible, pattern]);

  // Pattern X: 画面フラッシュ
  useEffect(() => {
    if (visible && pattern === 'X') {
      setFlash(true);
      const id = setTimeout(() => setFlash(false), 500);
      return () => clearTimeout(id);
    }
  }, [visible, pattern]);

  // Pattern C: 4秒後に自動消去
  useEffect(() => {
    if (visible && show && pattern === 'C') {
      const id = setTimeout(onDismiss, 4000);
      return () => clearTimeout(id);
    }
  }, [visible, show, pattern, onDismiss]);

  // Pattern D の自動消去タイマーは App.tsx 側で管理（ステートのオーナーに置く）

  if (!visible || pattern === 'A') return null; // A はパネル+GameField側で処理

  // ════════════════════════════════════════════
  // B: 吹き出し（ゲームフィールド上部に浮かぶ）
  // 相手パネルを隠さない位置 & 返しドボン時も両方見える
  // ════════════════════════════════════════════
  if (pattern === 'B') {
    return (
      <div
        className={`absolute left-3 right-3 z-30 transition-all duration-300 ease-out
          ${show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}
        style={{ top: '43%' }}
      >
        {/* 上向き吹き出しの尾 */}
        <div
          className="ml-10"
          style={{
            width: 0, height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderBottom: '11px solid rgba(110,10,10,0.97)',
          }}
        />
        <div className="bg-red-950/97 backdrop-blur-sm border-2 border-red-600/50 rounded-2xl p-3 shadow-2xl shadow-black/70">
          <div className="flex items-start gap-2 mb-2.5">
            <span className="text-2xl shrink-0">🎯</span>
            <div className="flex-1">
              <div className="text-red-400/80 text-[9px] font-bold tracking-widest uppercase">Dobon 宣言！</div>
              <div className="text-white font-black text-base leading-tight">{info.playerName}</div>
            </div>
            <button
              onClick={onDismiss}
              className="text-white/30 hover:text-white/80 text-xl leading-none transition-colors"
            >×</button>
          </div>
          <CardFormula cards={info.cards} formula={info.formula} result={info.result} />
          <p className="mt-2 text-white/25 text-[9px] text-right">タップして閉じる</p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // C: トースト（上部スライドイン、4秒で自動消去）
  // 上部だけ一時的に覆うが、相手パネルはすぐ見える
  // ════════════════════════════════════════════
  if (pattern === 'C') {
    return (
      <div
        className={`absolute top-0 left-0 right-0 z-40 cursor-pointer transition-all duration-300 ease-out
          ${show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
        onClick={onDismiss}
      >
        <div className="bg-red-900/96 backdrop-blur-sm border-b-2 border-red-500/40 px-3 py-2 shadow-lg shadow-red-900/50">
          <div className="flex items-center gap-2">
            <span className="text-lg shrink-0">🎯</span>
            <div className="flex-1 min-w-0">
              <span className="text-white font-black text-sm">{info.playerName}</span>
              <span className="text-white/70 text-sm"> が DOBON！ </span>
              <span className="text-yellow-300 text-sm font-bold">{info.formula} = {info.result}</span>
            </div>
            <div className="flex gap-0.5 shrink-0">
              {info.cards.map((c, i) => (
                <PlayingCard key={i} suit={c.suit} rank={c.rank} size="xs" />
              ))}
            </div>
          </div>
          {/* 残り時間プログレスバー */}
          <div className="mt-1.5 h-0.5 rounded-full overflow-hidden bg-red-950/60">
            <div
              className="h-full bg-red-300/70 rounded-full"
              style={{
                width: show ? '0%' : '100%',
                transition: show ? 'width 4s linear' : 'none',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // X: 画面フラッシュ → 上部バナー固定（自分DOBON）
  // フラッシュは一時的、バナーは閉じるまで残る
  // ════════════════════════════════════════════
  if (pattern === 'X') {
    return (
      <>
        {/* 一瞬の赤フラッシュ */}
        <div
          className="absolute inset-0 z-50 pointer-events-none bg-red-500 transition-opacity duration-500"
          style={{ opacity: flash ? 0.38 : 0 }}
        />
        {/* スライドダウンバナー */}
        <div
          className={`absolute top-0 left-0 right-0 z-40 transition-all duration-500 ease-out
            ${show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
        >
          <div className="bg-gradient-to-b from-red-500 to-red-800 border-b-2 border-red-400/50 px-4 pt-3 pb-3 shadow-2xl shadow-red-900/60">
            <div className="text-white/60 text-[9px] font-bold tracking-widest text-center uppercase mb-0.5">
              あなたが宣言
            </div>
            <div className="text-white font-black text-2xl text-center tracking-wide mb-2.5">
              🎯 DOBON！
            </div>
            <div className="flex justify-center mb-2">
              <CardFormula cards={info.cards} formula={info.formula} result={info.result} />
            </div>
            <button
              onClick={onDismiss}
              className="w-full text-red-100/50 hover:text-white/80 text-xs text-center transition-colors pt-1"
            >
              タップして閉じる
            </button>
          </div>
        </div>
      </>
    );
  }

  // ════════════════════════════════════════════
  // Y: 中央モーダル（自分DOBON）
  // 半透明バックドロップ、タップで即閉じ可
  // 相手パネルは完全には見えないが短時間で閉じられる
  // ════════════════════════════════════════════
  if (pattern === 'Y') {
    return (
      <div
        className={`absolute inset-0 z-40 flex items-center justify-center transition-opacity duration-300
          ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onDismiss}
      >
        {/* 半透明バックドロップ */}
        <div className="absolute inset-0 bg-black/58" />
        {/* モーダル本体 */}
        <div
          className={`relative w-[84%] bg-gray-900/95 border-2 border-red-500/50 rounded-3xl p-5
            shadow-2xl shadow-red-900/60 transition-all duration-300
            ${show ? 'scale-100 translate-y-0' : 'scale-90 translate-y-6'}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">🎯</div>
            <div className="text-red-400 text-[10px] font-bold tracking-widest uppercase mb-0.5">
              あなたが宣言
            </div>
            <div className="text-white font-black text-3xl">DOBON！</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3.5 flex justify-center mb-4">
            <CardFormula cards={info.cards} formula={info.formula} result={info.result} />
          </div>
          <button
            onClick={onDismiss}
            className="w-full bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold py-2.5 rounded-xl transition-all"
          >
            閉じる
          </button>
          <p className="mt-1.5 text-white/25 text-[9px] text-center">背景タップでも閉じます</p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // Z: 手札上部スライドアップバナー（自分DOBON）
  // 相手パネル・フィールドを一切隠さない
  // ════════════════════════════════════════════
  if (pattern === 'Z') {
    return (
      <div
        className={`absolute left-2 right-2 z-30 transition-all duration-300 ease-out
          ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
        style={{ bottom: '250px' }}
      >
        <div className="bg-red-950/95 backdrop-blur-sm border border-red-500/40 rounded-2xl px-3 py-2.5 shadow-xl shadow-black/50">
          <div className="flex items-center gap-2">
            <span className="text-xl shrink-0">🎯</span>
            <div className="flex-1">
              <div className="text-white font-black text-sm">あなたが DOBON！</div>
              <div className="text-red-300 text-xs">
                {info.formula} = <span className="text-yellow-300 font-bold">{info.result}</span>
              </div>
            </div>
            <div className="flex gap-0.5 shrink-0">
              {info.cards.map((c, i) => (
                <PlayingCard key={i} suit={c.suit} rank={c.rank} size="xs" />
              ))}
            </div>
            <button
              onClick={onDismiss}
              className="text-white/30 hover:text-white/80 ml-1 text-lg leading-none transition-colors"
            >×</button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  // D: 中央バーストポップアップ・自動消去（相手DOBON）
  // バックドロップなし＋pointer-events-none
  // → 相手パネルは完全に見え、返しドボンの操作も可能
  // 約1秒でふわっと消える（閉じる操作不要）
  // ════════════════════════════════════════════
  if (pattern === 'D') {
    return (
      <>
        {/* 画面縁のビネット発光（情報は一切隠れない） */}
        <div
          className="absolute inset-0 z-30 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 70px rgba(239,68,68,0.45)',
            animation: 'dobon-vignette 1.5s ease-out forwards',
          }}
        />
        {/* 中央ポップアップ本体（バックドロップなし） */}
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div
            className="bg-gradient-to-b from-red-900/97 to-red-950/97 backdrop-blur-sm
              border-2 border-red-500/65 rounded-2xl px-5 py-4 w-[80%] max-w-[310px]
              shadow-2xl shadow-red-500/40 ring-4 ring-red-400/20"
            style={{ animation: 'dobon-burst 1.5s ease-out forwards' }}
          >
            {/* プレイヤー名 */}
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-3xl shrink-0">🎯</span>
              <div>
                <div className="text-red-400/70 text-[9px] font-bold tracking-widest uppercase">
                  ドボン宣言！
                </div>
                <div className="text-white font-black text-xl leading-tight">
                  {info.playerName}
                </div>
              </div>
            </div>
            {/* カード＋計算式 */}
            <CardFormula cards={info.cards} formula={info.formula} result={info.result} />
          </div>
        </div>
      </>
    );
  }

  return null;
}