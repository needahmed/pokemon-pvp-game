import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

interface UseSocketOptions {
  roomId?: string;
  playerId?: string;
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  error: string | null;
  emit: (event: string, data?: any) => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler?: (...args: any[]) => void) => void;
  disconnect: () => void;
  reconnect: () => void;
}

// Global socket instance to share across components
let globalSocket: Socket | null = null;

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const {
    roomId,
    playerId,
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Initialize socket connection
  const initSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('Socket already connected, reusing existing connection');
      return;
    }

    const socketURL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    console.log(`Initializing socket connection to ${socketURL}`);

    // Reuse global socket if available
    if (globalSocket && globalSocket.connected) {
      socketRef.current = globalSocket;
      setConnected(true);
      return;
    }

    const newSocket = io(socketURL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
      autoConnect,
    });

    socketRef.current = newSocket;
    globalSocket = newSocket;

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
      onConnect?.();
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
      onDisconnect?.();

      // Auto-reconnect if disconnected unexpectedly
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        attemptReconnect();
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      const errorMessage = `Connection error: ${err.message}`;
      setError(errorMessage);
      onError?.(err);
      attemptReconnect();
    });

    newSocket.on('error', (err) => {
      console.error('Socket error:', err);
      setError(typeof err === 'string' ? err : 'Socket error occurred');
      onError?.(err instanceof Error ? err : new Error(String(err)));
    });

    // Join room if roomId and playerId provided
    if (roomId && playerId) {
      newSocket.emit('joinBattleRoom', { roomId, playerId });
      console.log(`Joining battle room: ${roomId} as player: ${playerId}`);
    }
  }, [autoConnect, roomId, playerId, onConnect, onDisconnect, onError]);

  // Attempt to reconnect with exponential backoff
  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      setError('Failed to reconnect after multiple attempts');
      return;
    }

    reconnectAttempts.current += 1;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);

    console.log(`Attempting reconnect #${reconnectAttempts.current} in ${delay}ms`);

    reconnectTimeoutRef.current = setTimeout(() => {
      socketRef.current?.connect();
    }, delay);
  }, []);

  // Emit event to socket
  const emit = useCallback((event: string, data?: any) => {
    if (!socketRef.current) {
      console.warn('Cannot emit, socket not initialized');
      return;
    }

    if (!socketRef.current.connected) {
      console.warn('Cannot emit, socket not connected');
      return;
    }

    socketRef.current.emit(event, data);
  }, []);

  // Listen to socket event
  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (!socketRef.current) {
      console.warn('Cannot listen, socket not initialized');
      return;
    }

    socketRef.current.on(event, handler);
  }, []);

  // Remove socket event listener
  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (!socketRef.current) {
      console.warn('Cannot remove listener, socket not initialized');
      return;
    }

    if (handler) {
      socketRef.current.off(event, handler);
    } else {
      socketRef.current.off(event);
    }
  }, []);

  // Manually disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('Manually disconnecting socket');
      socketRef.current.disconnect();
      socketRef.current = null;
      globalSocket = null;
      setConnected(false);
    }
  }, []);

  // Manually reconnect socket
  const reconnect = useCallback(() => {
    console.log('Manually reconnecting socket');
    reconnectAttempts.current = 0;
    if (socketRef.current) {
      socketRef.current.connect();
    } else {
      initSocket();
    }
  }, [initSocket]);

  // Initialize socket on mount
  useEffect(() => {
    if (autoConnect) {
      initSocket();
    }

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Note: We don't disconnect the socket here to allow reuse across pages
      // Only disconnect if explicitly needed
    };
  }, [autoConnect, initSocket]);

  return {
    socket: socketRef.current,
    connected,
    error,
    emit,
    on,
    off,
    disconnect,
    reconnect,
  };
}
