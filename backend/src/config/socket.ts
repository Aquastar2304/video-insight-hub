import { Server as HTTPServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { authenticateSocket } from '../middleware/socketAuth';

let io: SocketServer | null = null;

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:8080',
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Join user's personal room for updates
    const userId = (socket as any).userId;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Helper to emit to user
export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

// Helper to emit video processing progress
export const emitVideoProgress = (userId: string, videoId: string, progress: number, stage: string) => {
  emitToUser(userId, 'video:progress', {
    videoId,
    progress,
    stage,
    timestamp: new Date().toISOString(),
  });
};

// Helper to emit video completion
export const emitVideoComplete = (userId: string, videoId: string) => {
  emitToUser(userId, 'video:complete', {
    videoId,
    timestamp: new Date().toISOString(),
  });
};

// Helper to emit video error
export const emitVideoError = (userId: string, videoId: string, error: string) => {
  emitToUser(userId, 'video:error', {
    videoId,
    error,
    timestamp: new Date().toISOString(),
  });
};

