import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { User } from '@shared/schema';

// JWT secret - required in production, fallback for development
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' 
  ? 'dev-jwt-secret-change-in-production-' + Date.now() 
  : (() => {
      console.error('❌ JWT_SECRET environment variable is required in production');
      process.exit(1);
    })());
const JWT_EXPIRES_IN = '7d';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static createLoginResponse(user: User, token: string): LoginResponse {
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token
    };
  }
}

// Middleware to authenticate JWT tokens
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = AuthService.verifyToken(token);
    // Pass the decoded token payload which contains userId, email, role
    req.user = decoded as { userId: string; email: string; role: string; };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check if user has admin role
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

// Middleware to check if user has staff role (or higher)
export const requireStaff = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!['staff', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Staff access required' });
  }
  
  next();
};