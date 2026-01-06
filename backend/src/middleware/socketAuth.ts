import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

export const authenticateSocket = async (socket: Socket, next: any) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(new Error('Authentication error: JWT_SECRET not configured'));
    }

    const decoded = jwt.verify(token, secret) as { userId: string; email: string; name: string };
    
    (socket as any).userId = decoded.userId;
    (socket as any).user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new Error('Authentication error: Invalid token'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('Authentication error: Token expired'));
    }
    return next(new Error('Authentication error'));
  }
};

