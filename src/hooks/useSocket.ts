import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { authApi } from '@/services/api/auth';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export const useSocket = (onVideoProgress?: (data: any) => void, onVideoComplete?: (data: any) => void, onVideoError?: (data: any) => void) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only connect if authenticated
    if (!authApi.isAuthenticated()) {
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      return;
    }

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Listen for video processing events
    if (onVideoProgress) {
      socket.on('video:progress', onVideoProgress);
    }

    if (onVideoComplete) {
      socket.on('video:complete', onVideoComplete);
    }

    if (onVideoError) {
      socket.on('video:error', onVideoError);
    }

    socket.on('connect', () => {
      console.log('✅ Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (onVideoProgress) socket.off('video:progress', onVideoProgress);
      if (onVideoComplete) socket.off('video:complete', onVideoComplete);
      if (onVideoError) socket.off('video:error', onVideoError);
      socket.disconnect();
    };
  }, [onVideoProgress, onVideoComplete, onVideoError]);

  return socketRef.current;
};

