import { io, Socket } from 'socket.io-client';

function getSocketUrl(): string {
  if (typeof window !== 'undefined' && (window as any).__TEST_WS_URL__) {
    return (window as any).__TEST_WS_URL__;
  }
  // 本番: 同じオリジン（ngrok等で同一サーバーから配信時）
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  return import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;

  connect(): Socket {
    if (this.socket) {
      // 既存ソケットが切断状態なら再接続を試みる
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return this.socket;
    }

    const url = getSocketUrl();
    console.log('🔌 Connecting to:', url);

    this.socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 50, // 十分な回数（メインはvisibilitychangeでの手動再接続）
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    // ブラウザがフォアグラウンドに戻った時に再接続を試みる
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.socket && !this.socket.connected) {
          console.log('🔄 Page visible, reconnecting...');
          this.socket.connect();
        }
      });
    }

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
