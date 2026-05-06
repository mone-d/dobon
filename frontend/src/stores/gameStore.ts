import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { socketService } from '../services/socket';
import type {
  GameStateForClient,
  Card,
} from '../types/domain';

interface GameStore {
  // State
  gameState: GameStateForClient | null;
  socket: Socket | null;
  isConnected: boolean;
  currentUserId: string | null;
  selectedCardIndices: number[];
  currentRoomId: string | null;
  error: string | null;
  
  // Dobo effect state
  doboEffect: {
    visible: boolean;
    playerId: string;
    playerName: string;
    formula: string;
    isSuccess: boolean;
  } | null;
  
  // Suit selection state (for wild card 8)
  suitSelectionRequired: boolean;
  
  // Return dobo state
  returnDoboPhase: {
    active: boolean;
    timeoutSeconds: number;
    waiting?: boolean; // 返さない宣言後の待機状態
  } | null;

  // Effect countdown state (2/K stacking)
  effectPending: {
    effectType: 'forced-draw' | 'open-hand';
    victimId: string;
    counterCard: number;
    timeoutSeconds: number;
    effectCount: number;
  } | null;

  // Game end data
  gameEndData: {
    winnerId: string;
    winnerName: string;
    loserName: string;
    multiplier: number;
    baseRate: number;
    payments: any[];
    doboFormula: string;
    returnCount: number;
  } | null;
  
  // Actions
  initializeSocket: () => void;
  disconnectSocket: () => void;
  setCurrentUserId: (userId: string) => void;
  setCurrentRoomId: (roomId: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  rejoinGame: (roomId: string, playerId: string) => void;
  
  // Game actions
  startGame: (roomId: string, players: any[], baseRate: number) => void;
  
  // Card actions
  selectCard: (index: number) => void;
  deselectCard: (index: number) => void;
  clearSelection: () => void;
  playCards: (roomId: string, playerId: string, cards: Card[]) => void;
  drawCard: (roomId: string, playerId: string) => void;
  selectSuit: (roomId: string, playerId: string, suit: string) => void;
  
  // Dobo actions
  declareDobo: (roomId: string, playerId: string) => void;
  declareReturn: (roomId: string, playerId: string) => void;
  declareNoReturn: (roomId: string, playerId: string) => void;
  
  // Game state updates
  updateGameState: (gameState: GameStateForClient) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state (no mock data - real WebSocket only)
  gameState: null,
  socket: null,
  isConnected: false,
  currentUserId: null,
  selectedCardIndices: [],
  currentRoomId: null,
  error: null,
  doboEffect: null,
  suitSelectionRequired: false,
  returnDoboPhase: null,
  effectPending: null,
  gameEndData: null,

  // Initialize WebSocket connection
  initializeSocket: () => {
    // Prevent duplicate initialization
    if (get().socket) return;
    
    const socket = socketService.connect();
    
    // ===== ゲーム状態更新イベント =====
    socket.on('game:state-updated', (gameState: GameStateForClient) => {
      console.log('📊 Game state updated:', gameState);
      set({ gameState });
    });

    // ===== ゲーム開始イベント =====
    socket.on('game:started', (data: any) => {
      console.log('🎮 Game started:', data);
      
      // Clear previous game end data
      set({ gameEndData: null });
      
      // Set room ID if provided
      if (data.roomId) {
        set({ currentRoomId: data.roomId });
      }
      
      // ゲーム状態を更新
      const currentState = get().gameState;
      if (data) {
        set({
          gameState: {
            ...(currentState || {} as any),
            gameId: data.gameId,
            players: data.players || [],
            multiplier: data.multiplier || 1,
            fieldCard: data.fieldCard,
            currentPlayer: data.currentPlayer,
            gamePhase: 'playing',
            turnOrder: [],
            turnDirection: 'forward',
            deckRemaining: 0,
            selectedSuit: null,
            lastPlayedPlayer: null,
          }
        });
        console.log('✅ Game state updated from game:started');
      }
    });

    // ===== カード操作イベント =====
    socket.on('game:card-played', (data: any) => {
      console.log('🃏 Card played:', data);
      
      // 8（ワイルドカード）が出された場合、スート選択を要求
      const currentUserId = get().currentUserId;
      if (data.playerId === currentUserId && data.cards?.some((c: any) => c.value === 8)) {
        set({ suitSelectionRequired: true });
        console.log('🃏 Wild card played - suit selection required');
      }
      
      // ゲーム状態は game:state-updated で更新される
    });

    socket.on('game:card-drawn', (data: any) => {
      console.log('🎴 Card drawn:', data);
      // ゲーム状態は game:state-updated で更新される
    });

    socket.on('game:suit-selected', (data: any) => {
      console.log('♠️ Suit selected:', data);
    });

    // ===== 効果カウントダウンイベント =====
    socket.on('game:effect-pending', (data: any) => {
      console.log('⏳ Effect pending:', data);
      set({
        effectPending: {
          effectType: data.effectType,
          victimId: data.victimId,
          counterCard: data.counterCard,
          timeoutSeconds: data.timeoutSeconds,
          effectCount: data.effectCount || 0,
        },
      });
      // タイムアウト後に自動クリア
      setTimeout(() => {
        if (get().effectPending?.victimId === data.victimId) {
          set({ effectPending: null });
        }
      }, (data.timeoutSeconds + 1) * 1000);
    });

    socket.on('game:effect-applied', (data: any) => {
      console.log('💥 Effect applied:', data);
      set({ effectPending: null });
    });

    // ===== ドボン関連イベント =====
    socket.on('game:dobo', (data: any) => {
      console.log('💥 Dobo declared:', data);
      
      // ドボンエフェクトを表示
      const currentState = get().gameState;
      const currentUserId = get().currentUserId;
      if (currentState) {
        const player = currentState.players.find(p => p.id === data.playerId);
        set({
          doboEffect: {
            visible: true,
            playerId: data.playerId,
            playerName: player?.name || 'Unknown',
            formula: data.formula || '',
            isSuccess: true,
          }
        });
        
        // 3秒後にエフェクトを非表示
        setTimeout(() => {
          set({ doboEffect: null });
        }, 3000);
        
        // 自分がドボン宣言者でない場合、返しドボンフェーズを開始
        if (data.playerId !== currentUserId) {
          const timeoutSec = data.timeoutSeconds || 10;
          set({
            returnDoboPhase: {
              active: true,
              timeoutSeconds: timeoutSec,
            }
          });
          console.log('⚡ Return dobo phase started');
          
          // タイムアウト時に自動で「返さない」を送信
          setTimeout(() => {
            const phase = get().returnDoboPhase;
            if (phase?.active) {
              const { currentRoomId, currentUserId: uid } = get();
              if (currentRoomId && uid) {
                get().declareNoReturn(currentRoomId, uid);
              }
            }
          }, timeoutSec * 1000);
        }
      }
      
      // ゲーム状態は game:state-updated で更新される
    });

    socket.on('game:return', (data: any) => {
      console.log('🔄 Return dobo declared:', data);
      // TODO: 返しドボンエフェクトを表示
      // ゲーム状態は game:state-updated で更新される
    });

    socket.on('game:penalty', (data: any) => {
      console.log('⚠️ Penalty:', data);
      
      // ペナルティエフェクトを表示
      if (data.reason === 'invalid_dobo') {
        const currentState = get().gameState;
        if (currentState) {
          const player = currentState.players.find(p => p.id === data.playerId);
          set({
            doboEffect: {
              visible: true,
              playerId: data.playerId,
              playerName: player?.name || 'Unknown',
              formula: '無効なドボン',
              isSuccess: false,
            }
          });
          
          // 3秒後にエフェクトを非表示
          setTimeout(() => {
            set({ doboEffect: null });
          }, 3000);
        }
      }
      
      // ゲーム状態は game:state-updated で更新される
    });

    // ===== ゲーム終了イベント =====
    socket.on('game:ended', (data: any) => {
      console.log('🏁 Game ended:', data);
      set({
        gameEndData: data,
        returnDoboPhase: null, // 返しドボンフェーズを終了
        doboEffect: null, // ドボンエフェクトを非表示
      });
    });

    // ===== エラーイベント =====
    socket.on('game:error', (error: any) => {
      console.error('❌ Game error:', error);
      const errorMessage = error.message || error.error || 'ゲームエラーが発生しました';
      set({ error: errorMessage });
    });

    // ===== 接続状態イベント =====
    socket.on('connect', () => {
      console.log('✅ Socket connected');
      set({ isConnected: true, error: null });
      
      // 再接続時にルーム/ゲームに自動再参加
      const { currentRoomId, currentUserId } = get();
      if (currentRoomId && currentUserId) {
        console.log('🔄 Auto-rejoining room:', { currentRoomId, currentUserId });
        
        // まずゲームセッションへの再参加を試みる
        socket.emit('game:rejoin', { roomId: currentRoomId, playerId: currentUserId }, (response: any) => {
          if (response.success && response.gameState) {
            console.log('✅ Auto-rejoin game successful - game in progress');
            set({ gameState: response.gameState });
          } else {
            // ゲームがなければ待機ルームへの再参加を試みる
            socket.emit('room:rejoin', { roomId: currentRoomId, playerId: currentUserId }, (roomResponse: any) => {
              if (roomResponse.success && roomResponse.room) {
                console.log('✅ Auto-rejoin room successful');
                import('../stores/roomStore').then(({ useRoomStore }) => {
                  useRoomStore.setState({ currentRoom: roomResponse.room });
                });
              } else {
                console.log('ℹ️ Auto-rejoin failed:', roomResponse?.error);
              }
            });
          }
        });
      }
    });

    socket.on('disconnect', (reason: string) => {
      console.log('❌ Socket disconnected:', reason);
      set({ isConnected: false });
    });

    socket.on('connect_error', (error: Error) => {
      console.error('❌ Socket connection error:', error);
      set({ isConnected: false });
      // 再接続中はエラー表示しない（reconnectionが有効なので自動リトライされる）
    });

    // ===== 再接続イベント =====
    socket.on('reconnect', (attemptNumber: number) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      set({ isConnected: true, error: null });
      
      // 再接続後、ゲームに再参加
      const { currentRoomId, currentUserId } = get();
      if (currentRoomId && currentUserId) {
        console.log('🔄 Rejoining game:', { currentRoomId, currentUserId });
        get().rejoinGame(currentRoomId, currentUserId);
      }
    });

    socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('🔄 Reconnection attempt', attemptNumber);
      set({ error: `再接続中... (${attemptNumber}回目)` });
    });

    socket.on('reconnect_error', (error: Error) => {
      console.error('❌ Reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      set({ error: 'サーバーへの再接続に失敗しました' });
    });

    set({ socket, isConnected: socket.connected });
  },

  // Disconnect WebSocket
  disconnectSocket: () => {
    socketService.disconnect();
    set({ socket: null, isConnected: false });
  },

  // Declare return dobo
  // Set current user ID
  setCurrentUserId: (userId: string) => {
    set({ currentUserId: userId });
  },

  // Set current room ID
  setCurrentRoomId: (roomId: string) => {
    set({ currentRoomId: roomId });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
    // Auto-clear error after 5 seconds
    if (error) {
      setTimeout(() => {
        if (get().error === error) {
          set({ error: null });
        }
      }, 5000);
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Rejoin game after reconnection
  rejoinGame: (roomId: string, playerId: string) => {
    const { socket } = get();
    if (!socket) {
      console.warn('⚠️ Socket not connected');
      return;
    }

    console.log('🔄 Rejoining game:', { roomId, playerId });

    socket.emit('game:rejoin', { roomId, playerId }, (response: any) => {
      if (response.success) {
        console.log('✅ Rejoined game successfully');
        set({ error: null });
        // ゲーム状態は game:state-updated で更新される
      } else {
        console.error('❌ Failed to rejoin game:', response.error);
        set({ error: `ゲームへの再参加に失敗しました: ${response.error}` });
      }
    });
  },

  // Start game
  startGame: (roomId: string, players: any[], baseRate: number) => {
    const { socket, currentUserId } = get();
    if (!socket) {
      console.warn('⚠️ Socket not connected');
      set({ error: 'サーバーに接続されていません' });
      return;
    }

    console.log('🎮 Starting game:', { roomId, players, baseRate, myPlayerId: currentUserId });
    
    socket.emit('game:start', { roomId, players, baseRate, myPlayerId: currentUserId }, (response: any) => {
      if (response.success) {
        console.log('✅ Game started successfully:', response.gameId);
        set({ currentRoomId: roomId, error: null });
        // Note: gameState will be updated via game:state-updated event
      } else {
        console.error('❌ Failed to start game:', response.error);
        set({ error: `ゲーム開始に失敗しました: ${response.error}` });
      }
    });
  },

  // Select a card
  selectCard: (index: number) => {
    const { selectedCardIndices, gameState } = get();
    
    if (!gameState) return;
    
    const currentPlayer = gameState.players.find(p => p.id === get().currentUserId);
    if (!currentPlayer || !currentPlayer.hand) return;

    // Business rule: 異なる数字を選択した場合、前の選択を自動解除
    if (selectedCardIndices.length > 0) {
      const firstSelectedCard = currentPlayer.hand[selectedCardIndices[0]];
      const clickedCard = currentPlayer.hand[index];
      
      if (firstSelectedCard.value !== clickedCard.value) {
        // 異なる数字なので、新しいカードのみ選択
        set({ selectedCardIndices: [index] });
        return;
      }
    }

    // 同じ数字なので追加
    set({ selectedCardIndices: [...selectedCardIndices, index] });
  },

  // Deselect a card
  deselectCard: (index: number) => {
    const { selectedCardIndices } = get();
    set({ selectedCardIndices: selectedCardIndices.filter(i => i !== index) });
  },

  // Clear selection
  clearSelection: () => {
    set({ selectedCardIndices: [] });
  },

  // Play cards
  playCards: (roomId: string, playerId: string, cards: Card[]) => {
    const { socket } = get();
    if (!socket) {
      console.warn('⚠️ Socket not connected');
      set({ error: 'サーバーに接続されていません' });
      return;
    }

    console.log('🃏 Playing cards:', { roomId, playerId, cards });

    socket.emit('game:play-card', { roomId, playerId, cards }, (response: any) => {
      if (response.success) {
        console.log('✅ Cards played successfully');
        set({ selectedCardIndices: [], error: null });
        // ゲーム状態は game:state-updated で更新される
      } else {
        console.error('❌ Failed to play cards:', response);
        set({ error: `カードをプレイできませんでした: ${response.error || '不明なエラー'}` });
      }
    });
  },

  // Draw a card
  drawCard: (roomId: string, playerId: string) => {
    const { socket } = get();
    if (!socket) {
      console.warn('⚠️ Socket not connected');
      set({ error: 'サーバーに接続されていません' });
      return;
    }

    console.log('🎴 Drawing card:', { roomId, playerId });

    socket.emit('game:draw-card', { roomId, playerId }, (response: any) => {
      if (response.success) {
        console.log('✅ Card drawn:', response.card);
        set({ error: null });
        
        // 暫定対応: 山札枚数を手動で減らす（game:state-updatedが来るまで）
        const currentState = get().gameState;
        if (currentState) {
          set({
            gameState: {
              ...currentState,
              deckRemaining: Math.max(0, (currentState.deckRemaining || 0) - 1),
            }
          });
        }
        // ゲーム状態は game:state-updated で更新される
      } else {
        // エラーは表示しない（山札が空の場合も静かに失敗）
        console.log('Draw card failed:', response.error);
      }
    });
  },

  // Select suit (for 8 wild card)
  // Select suit (for wild card 8)
  selectSuit: (roomId: string, playerId: string, suit: string) => {
    const { socket } = get();
    if (!socket) {
      console.warn('⚠️ Socket not connected');
      set({ error: 'サーバーに接続されていません' });
      return;
    }

    console.log('♠️ Selecting suit:', { roomId, playerId, suit });

    socket.emit('game:select-suit', { roomId, playerId, suit }, (response: any) => {
      if (response.success) {
        console.log('✅ Suit selected successfully');
        set({ error: null, suitSelectionRequired: false });
        // ゲーム状態は game:state-updated で更新される
      } else {
        console.error('❌ Failed to select suit:', response);
        set({ error: 'スート選択に失敗しました' });
      }
    });
  },

  // Declare dobo
  declareDobo: (roomId: string, playerId: string) => {
    const { socket } = get();
    if (!socket) {
      console.warn('⚠️ Socket not connected');
      set({ error: 'サーバーに接続されていません' });
      return;
    }

    console.log('💥 Declaring dobo:', { roomId, playerId });

    socket.emit('game:declare-dobo', { roomId, playerId }, (response: any) => {
      if (response.success) {
        console.log('✅ Dobo declared successfully');
        set({ error: null });
        // ゲーム状態は game:state-updated で更新される
        // ドボンエフェクトは game:dobo イベントで表示される
      } else {
        // ドボン失敗 → game:ended で結果画面が表示される
        console.log('Dobo failed (penalty applied)');
      }
    });
  },

  // Declare return dobo
  declareReturn: (roomId: string, playerId: string) => {
    const { socket } = get();
    if (!socket) {
      console.warn('⚠️ Socket not connected');
      set({ error: 'サーバーに接続されていません' });
      return;
    }

    console.log('🔄 Declaring return dobo:', { roomId, playerId });

    socket.emit('game:declare-return', { roomId, playerId }, (response: any) => {
      if (response.success) {
        console.log('✅ Return dobo declared successfully');
        set({ error: null, returnDoboPhase: null });
        // ゲーム状態は game:state-updated で更新される
        // 返しドボンエフェクトは game:return イベントで表示される
      } else {
        console.error('❌ Failed to declare return dobo:', response);
        set({ error: '返しドボンに失敗しました' });
      }
    });
  },

  // Declare no return
  declareNoReturn: (roomId: string, playerId: string) => {
    const { socket } = get();
    if (!socket) {
      console.warn('⚠️ Socket not connected');
      set({ error: 'サーバーに接続されていません' });
      return;
    }

    console.log('🚫 Declaring no return:', { roomId, playerId });

    socket.emit('game:declare-no-return', { roomId, playerId }, (response: any) => {
      if (response.success) {
        console.log('✅ No return declared successfully');
        set({ error: null, returnDoboPhase: { active: true, timeoutSeconds: 0, waiting: true } });
        // ゲーム状態は game:state-updated で更新される
      } else {
        console.error('❌ Failed to declare no return:', response);
        set({ error: '返しなし宣言に失敗しました' });
      }
    });
  },

  // Update game state
  updateGameState: (gameState: GameStateForClient) => {
    set({ gameState });
  },
}));
