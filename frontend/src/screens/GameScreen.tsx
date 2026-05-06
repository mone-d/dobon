import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useUserStore } from '../stores/userStore';
import { OpponentPlayer } from '../components/OpponentPlayer';
import { GameField } from '../components/GameField';
import { PlayerHand } from '../components/PlayerHand';
import { DobonEffectOverlay, type DobonInfo } from '../components/DobonEffectOverlay';
import { SuitSelector } from '../components/SuitSelector';
import { ReturnDoboUI } from '../components/ReturnDoboUI';
import { EffectBanner } from '../components/EffectBanner';
import { EffectCountdown } from '../components/EffectCountdown';
import { toCardDisplay, suitToSymbol } from '../types/domain';
import type { CardDisplay } from '../types/domain';

export default function GameScreen() {
  const { currentUser } = useUserStore();
  const [leaveNextDeclared, setLeaveNextDeclared] = useState(false);
  const { 
    gameState, 
    selectedCardIndices,
    doboEffect,
    suitSelectionRequired,
    returnDoboPhase,
    currentUserId,
    selectCard, 
    deselectCard, 
    clearSelection,
    playCards,
    drawCard,
    declareDobo,
    selectSuit,
    declareReturn,
    declareNoReturn,
    effectPending,
  } = useGameStore();

  // Get current player (self) - use gameStore's currentUserId
  const currentPlayerId = currentUserId || currentUser?.userId || 'current-user';

  // Convert doboEffect to DobonInfo
  const dobonInfo: DobonInfo | null = doboEffect ? {
    playerName: doboEffect.playerName,
    cards: [], // TODO: カード情報を追加
    formula: doboEffect.formula,
    result: gameState?.fieldCard?.value.toString() || '',
    isSelf: doboEffect.playerId === currentPlayerId,
  } : null;

  // Determine which pattern to use
  const dobonPattern = dobonInfo?.isSelf ? 'Z' : 'D';
  const dobonVisible = doboEffect?.visible || false;
  
  const currentPlayer = gameState?.players.find(p => p.id === currentPlayerId);
  
  // Get opponents (all players except self)
  const opponents = gameState?.players
    .filter(p => p.id !== currentPlayerId)
    .map(p => {
      const userName = p.name || 'Unknown';
      const handCount = p.handCount || 0;
      const hand = p.hand || [];
      
      return {
        name: userName,
        cardCount: handCount,
        revealedCards: hand.filter(c => c.isPublic).map(c => toCardDisplay(c)),
        isCurrentTurn: p.isCurrentPlayer || false,
        dobonDeclared: false,
      };
    }) || [];

  // Get player hand - handle both formats
  const playerHand: CardDisplay[] = currentPlayer?.hand?.map(c => toCardDisplay(c)) || [];

  // Get field card
  const fieldCard = gameState?.fieldCard ? toCardDisplay(gameState.fieldCard) : { suit: '♦' as const, rank: '10' as const };

  // Get multiplier
  const multiplier = gameState?.multiplier || 1;

  // Get current turn player
  const currentTurnPlayer = gameState?.players.find(p => p.isCurrentPlayer);
  const currentTurnPlayerName = currentTurnPlayer?.name || gameState?.currentPlayer?.name || '';

  // Check if it's my turn
  const isMyTurn = gameState?.currentPlayer?.id === currentPlayerId;

  const handleCardClick = (index: number) => {
    if (!isMyTurn) return; // ターン外は選択不可
    if (selectedCardIndices.includes(index)) {
      deselectCard(index);
    } else {
      selectCard(index);
    }
  };

  const handlePlayCards = () => {
    if (!isMyTurn || !currentUser || !gameState || !currentPlayer || !currentPlayer.hand) return;
    
    // 選択順序を維持: 最初に選択 = 一番下、最後に選択 = 一番上（次の場札）
    const selectedCards = selectedCardIndices.map(idx => currentPlayer.hand![idx]);
    const { currentRoomId } = useGameStore.getState();
    const roomId = currentRoomId || 'room-1';
    
    console.log('Playing cards:', { roomId, playerId: currentUser.userId, cards: selectedCards });
    
    playCards(roomId, currentUser.userId, selectedCards);
    clearSelection();
  };

  const handleDrawCard = () => {
    if (!isMyTurn || !currentUser || !gameState) return;
    
    const { currentRoomId } = useGameStore.getState();
    const roomId = currentRoomId || 'room-1';
    
    drawCard(roomId, currentUser.userId);
  };

  const handleDobon = () => {
    if (!currentUser || !gameState) return;
    // ドボンはターン外でも宣言可能
    
    const { currentRoomId } = useGameStore.getState();
    const roomId = currentRoomId || 'room-1';
    
    console.log('Declaring dobo:', { roomId, playerId: currentUser.userId });
    
    declareDobo(roomId, currentUser.userId);
  };

  const handleSelectSuit = (suit: '♠' | '♥' | '♦' | '♣') => {
    if (!currentUser || !gameState) return;
    
    const { currentRoomId } = useGameStore.getState();
    const roomId = currentRoomId || 'room-1';
    
    // シンボルをバックエンドのスート名に変換
    const suitMap: Record<string, string> = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
    const suitName = suitMap[suit] || suit;
    
    console.log('Selecting suit:', { roomId, playerId: currentUser.userId, suit: suitName });
    
    selectSuit(roomId, currentUser.userId, suitName);
  };

  const handleDeclareReturn = () => {
    if (!currentUser || !gameState) return;
    
    const { currentRoomId } = useGameStore.getState();
    const roomId = currentRoomId || 'room-1';
    
    console.log('Declaring return dobo:', { roomId, playerId: currentUser.userId });
    
    declareReturn(roomId, currentUser.userId);
  };

  const handleDeclareNoReturn = () => {
    if (!currentUser || !gameState) return;
    
    const { currentRoomId } = useGameStore.getState();
    const roomId = currentRoomId || 'room-1';
    
    console.log('Declaring no return:', { roomId, playerId: currentUser.userId });
    
    declareNoReturn(roomId, currentUser.userId);
  };

  const handleLeaveNext = () => {
    if (!currentUser) return;
    const { socket, currentRoomId } = useGameStore.getState();
    if (!socket || !currentRoomId) return;
    
    socket.emit('game:leave-next', { roomId: currentRoomId, playerId: currentUser.userId }, (response: any) => {
      if (response.success) {
        setLeaveNextDeclared(true);
        console.log('✅ Leave next declared');
      }
    });
  };

  // Show loading if no game state
  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-4xl mb-4">🃏</div>
          <div className="text-white text-lg mb-2">対戦相手を待っています...</div>
          <div className="text-white/50 text-sm">別のタブで「Join」ボタンを押してください</div>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between px-3 py-1.5 bg-black/30 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-base">🃏</span>
            <span className="text-white/80 text-xs font-bold tracking-wider">DOBON</span>
            {/* 次で抜けるボタン */}
            {!leaveNextDeclared ? (
              <button
                onClick={handleLeaveNext}
                className="text-[10px] px-2 py-0.5 bg-red-900/40 border border-red-500/40 text-red-300 rounded-full hover:bg-red-900/60 transition-colors"
              >
                次で抜ける
              </button>
            ) : (
              <span className="text-[10px] px-2 py-0.5 bg-red-900/60 border border-red-500/50 text-red-300 rounded-full">
                🚪 退出予定
              </span>
            )}
          </div>
          {currentTurnPlayer && (
            <div className="flex items-center gap-1.5 bg-yellow-900/40 border border-yellow-500/40 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-yellow-300 text-xs font-semibold">{currentTurnPlayerName}のターン</span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 rounded-full px-2.5 py-0.5">
            <span className="text-amber-400/70 text-[10px]">BASE</span>
            <span className="text-amber-300 text-xs font-bold">¥100</span>
          </div>
        </div>

        {/* Opponents */}
        <div className="shrink-0 p-2 pb-1">
          <div className="grid grid-cols-3 gap-1.5">
            {opponents.map((opponent, idx) => (
              <OpponentPlayer key={idx} {...opponent} />
            ))}
          </div>
        </div>

        <div className="mx-3 border-t border-white/10" />

        {/* ターン順表示 */}
        <div className="flex items-center justify-center gap-1 px-3 py-1 bg-black/20">
          <span className="text-white/40 text-[10px]">順:</span>
          {gameState.turnOrder.map((playerId) => {
            const player = gameState.players.find(p => p.id === playerId);
            const isCurrent = playerId === gameState.currentPlayer?.id;
            const isMe = playerId === currentPlayerId;
            const name = isMe ? '自分' : (player?.name?.charAt(0) || '?');
            return (
              <span
                key={playerId}
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  isCurrent
                    ? 'bg-yellow-500/30 text-yellow-300 font-bold'
                    : isMe
                    ? 'text-green-400'
                    : 'text-white/50'
                }`}
              >
                {name}
              </span>
            );
          })}
          <span className="text-white/30 text-[10px] ml-1">
            {gameState.turnDirection === 'reverse' ? '← 逆' : '→'}
          </span>
        </div>

        {/* 特殊カード効果バナー */}
        <EffectBanner
          forcedDrawCount={gameState.effects?.forcedDrawCount || 0}
          skippedPlayerIds={gameState.effects?.skippedPlayerIds || []}
          playerNames={Object.fromEntries(
            gameState.players.map(p => [p.id, p.name])
          )}
        />

        {/* Game Field */}
        <GameField
          deckCount={gameState.deckRemaining ?? 28}
          discardPile={fieldCard}
          discardedBy={gameState.lastPlayedPlayer?.name || ''}
          multiplier={multiplier}
          selectedSuit={gameState.selectedSuit ? suitToSymbol[gameState.selectedSuit] : undefined}
          dobonDeclarations={[]}
          onDrawCard={isMyTurn ? handleDrawCard : undefined}
        />

        {/* Player Hand */}
        <div className={`shrink-0 ${isMyTurn ? 'bg-yellow-900/20 border-t-2 border-yellow-500/40' : ''}`}>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20 border-t border-white/5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
              isMyTurn ? 'bg-gradient-to-br from-yellow-400 to-amber-600 animate-pulse' : 'bg-gradient-to-br from-green-400 to-emerald-600'
            }`}>
              <span className="text-white text-[9px] font-black">自</span>
            </div>
            <span className="text-white/80 text-xs font-bold">{currentUser?.userName || 'あなた'}</span>
            <span className="text-white/40 text-xs">—</span>
            <span className={`text-xs ${isMyTurn ? 'text-yellow-300 font-bold' : 'text-white/50'}`}>
              {isMyTurn ? '🎯 あなたのターンです！' : '自分のターン待ち'}
            </span>
          </div>

          <PlayerHand
            cards={playerHand}
            selectedIndices={selectedCardIndices}
            highlightIndices={
              effectPending && effectPending.victimId === currentPlayerId
                ? (currentPlayer?.hand || [])
                    .map((c, i) => c.value === effectPending.counterCard ? i : -1)
                    .filter(i => i >= 0)
                : []
            }
            onCardClick={handleCardClick}
            onPlayCards={isMyTurn ? handlePlayCards : undefined}
          />

          <div className="bg-gray-950/60 px-4 pb-4 pt-2">
            <button
              onClick={handleDobon}
              className="w-full bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 active:from-red-700 active:to-red-900 text-white font-black text-base py-3 rounded-xl shadow-lg shadow-red-900/50 border border-red-400/30 transition-all active:scale-95"
            >
              🎯 DOBON！
            </button>
          </div>
        </div>

        {/* Dobon Effect Overlay */}
        {dobonInfo && (
          <DobonEffectOverlay
            pattern={dobonPattern}
            info={dobonInfo}
            visible={dobonVisible}
            onDismiss={() => useGameStore.setState({ doboEffect: null })}
          />
        )}

        {/* Suit Selector (for wild card 8) */}
        {suitSelectionRequired && (
          <SuitSelector onSelectSuit={handleSelectSuit} />
        )}

        {/* Return Dobo UI */}
        {returnDoboPhase?.active && !returnDoboPhase.waiting && (
          <ReturnDoboUI
            timeoutSeconds={returnDoboPhase.timeoutSeconds}
            onDeclareReturn={handleDeclareReturn}
            onDeclareNoReturn={handleDeclareNoReturn}
          />
        )}

        {/* Return Dobo Waiting (返さない宣言後) */}
        {returnDoboPhase?.waiting && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 border-2 border-white/20 rounded-2xl p-6 w-[85%] max-w-[320px] text-center">
              <div className="text-3xl mb-3">⏳</div>
              <div className="text-white font-bold text-lg mb-2">他のプレイヤーの判定待ち</div>
              <div className="text-white/60 text-sm">返しドボンの判定を待っています...</div>
            </div>
          </div>
        )}

        {/* Effect Countdown (2/K stacking) */}
        {effectPending && (
          <EffectCountdown
            effectType={effectPending.effectType}
            victimId={effectPending.victimId}
            currentUserId={currentPlayerId}
            counterCard={effectPending.counterCard}
            timeoutSeconds={effectPending.timeoutSeconds}
            effectCount={effectPending.effectCount}
            onAccept={() => {
              const { socket, currentRoomId } = useGameStore.getState();
              if (socket && currentRoomId && currentUser) {
                socket.emit('game:accept-effect', { roomId: currentRoomId, playerId: currentUser.userId }, () => {});
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
