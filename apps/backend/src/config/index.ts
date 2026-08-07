import { config } from 'dotenv';

config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 3001,
  DATABASE_URL: process.env.DATABASE_URL || '',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-jwt-key-change-me-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
} as const;
