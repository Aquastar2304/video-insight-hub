import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash?: string;
  created_at: Date;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in environment variables');
}

export const register = async (input: RegisterInput): Promise<{ user: Omit<User, 'password_hash'>; token: string }> => {
  const { email, password, name } = input;

  // Check if user already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existingUser.rows.length > 0) {
    throw new AppError('User with this email already exists', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const result = await query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, created_at`,
    [email.toLowerCase(), passwordHash, name]
  );

  const user = result.rows[0];

  // Generate JWT token
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
    },
    token,
  };
};

export const login = async (input: LoginInput): Promise<{ user: Omit<User, 'password_hash'>; token: string }> => {
  const { email, password } = input;

  // Find user
  const result = await query(
    'SELECT id, email, name, password_hash, created_at FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = result.rows[0] as User;

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash!);

  if (!isValidPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
    },
    token,
  };
};

export const getUserById = async (userId: string): Promise<Omit<User, 'password_hash'> | null> => {
  const result = await query(
    'SELECT id, email, name, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
};

