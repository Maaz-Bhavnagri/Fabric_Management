import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { JWTPayload } from '@/lib/db-types';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRE = '7d';
const REFRESH_TOKEN_EXPIRE = '30d';

export const hashPassword = async (password: string) => {
  return bcryptjs.hash(password, 10);
};

export const verifyPassword = async (password: string, hash: string) => {
  return bcryptjs.compare(password, hash);
};

export const createToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

export const createRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRE });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
};

export const extractToken = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

export const requireAuth = (request: NextRequest) => {
  const token = extractToken(request);
  
  if (!token) {
    return {
      authenticated: false,
      error: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    };
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return {
      authenticated: false,
      error: NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    };
  }

  return {
    authenticated: true,
    user: decoded
  };
};
