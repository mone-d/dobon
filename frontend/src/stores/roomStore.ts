import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { socketService } from '../services/socket';
import { useGameStore } from './gameStore';
import type { Room, User } from '../types/domain';

interface RoomStore {
  // State
  rooms: Room[];
  currentRoom: Room | null;
  socket: Socket | null;
  
  // Actions
  initializeSocket: () => void;
  createRoom: (creator: User, baseRate: number) => void;
  joinRoom: (roomCode: string, user: User) => void;
  leaveRoom: () => void;
  startGame: (roomId: string) => void;
  clearRoom: () => void;
  
  // Room state updates
  updateRooms: (rooms: Room[]) => void;
  updateCurrentRoom: (room: Room | null) => void;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  // Initial state
  rooms: [],
  currentRoom: null,
  socket: null,

  // Initialize WebSocket connection
  initializeSocket: () => {
    const socket = socketService.connect();
    
    // Listen to room updates from server
    socket.on('room:updated', (room: Room) => {
      console.log('Room updated:', room);
      set({ currentRoom: room });
    });

    socket.on('room:ended', (data: any) => {
      console.log('Room ended:', data);
      set({ currentRoom: null });
    });

    set({ socket });
  },

  // Create a room via WebSocket
  createRoom: (creator: User, baseRate: number) => {
    const { socket } = get();
    if (!socket) {
      console.warn('⚠️ Socket not connected');
      return;
    }

    socket.emit('room:create', {
      player: { id: creator.userId, user: creator },
      baseRate,
    }, (response: any) => {
      if (response.success) {
        console.log('✅ Room created:', response.roomCode);
        set({ currentRoom: response.room });
        // gameStoreにもroomIdを設定（再接続時のrejoin用）
        
        useGameStore.setState({ currentRoomId: response.roomId });
      } else {
        console.error('❌ Failed to create room:', response.error);
      }
    });
  },

  // Join a room by room code via WebSocket
  joinRoom: (roomCode: string, user: User) => {
    const { socket } = get();
    if (!socket) {
      console.warn('⚠️ Socket not connected');
      return;
    }

    socket.emit('room:join', {
      roomCode: roomCode.toUpperCase(),
      player: { id: user.userId, user },
    }, (response: any) => {
      if (response.success) {
        console.log('✅ Joined room:', response.room?.roomCode);
        set({ currentRoom: response.room });
        // gameStoreにもroomIdを設定（再接続時のrejoin用）
        
        useGameStore.setState({ currentRoomId: response.room?.roomId });
      } else {
        console.error('❌ Failed to join room:', response.error);
        alert(response.error || 'ルームへの参加に失敗しました');
      }
    });
  },

  // Leave current room
  leaveRoom: () => {
    const { socket, currentRoom } = get();
    if (!socket || !currentRoom) return;

    socket.emit('room:leave', {
      roomId: currentRoom.roomId,
      playerId: socket.id,
    }, (response: any) => {
      if (response.success) {
        console.log('✅ Left room');
      }
    });
    
    set({ currentRoom: null });
  },

  // Start game (called from RoomScreen)
  startGame: (roomId: string) => {
    const { socket } = get();
    if (!socket) return;

    socket.emit('game:start', { roomId }, (response: any) => {
      if (response.success) {
        console.log('Game started successfully');
      }
    });
  },

  // Clear room state
  clearRoom: () => {
    set({ currentRoom: null });
  },

  // Update rooms list
  updateRooms: (rooms: Room[]) => {
    set({ rooms });
  },

  // Update current room
  updateCurrentRoom: (room: Room | null) => {
    set({ currentRoom: room });
  },
}));
