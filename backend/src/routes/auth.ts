import { Router } from 'express';
import { z } from 'zod';
import { register, login } from '../services/authService';
import { validate } from '../middleware/validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getUserById } from '../services/authService';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1, 'Name is required'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// Register new user
router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { user, token } = await register(req.body);
    res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { user, token } = await login(req.body);
    res.json({
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await getUserById(req.userId!);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;

