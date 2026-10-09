import { config } from 'dotenv';

config();

/** Documented local-dev placeholder only. Never used when NODE_ENV is not development. */
export const DEVELOPMENT_JWT_SECRET = 'development-only-jwt-secret';

export function resolveJwtSecret(nodeEnv: string, secret: string | undefined): string {
  if (secret) {
    return secret;
  }
  if (nodeEnv === 'development') {
    return DEVELOPMENT_JWT_SECRET;
  }
  throw new Error('JWT_SECRET is required when NODE_ENV is not development');
}

const nodeEnv = process.env.NODE_ENV || 'development';

export const env = {
  NODE_ENV: nodeEnv,
  PORT: Number(process.env.PORT) || 3001,
  DATABASE_URL: process.env.DATABASE_URL || '',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  JWT_SECRET: resolveJwtSecret(nodeEnv, process.env.JWT_SECRET),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  REMINDER_QUEUE_NAME: process.env.REMINDER_QUEUE_NAME || 'booking-reminders',
  MAIL_HOST: process.env.MAIL_HOST || '',
  MAIL_PORT: Number(process.env.MAIL_PORT) || 587,
  MAIL_USER: process.env.MAIL_USER || '',
  MAIL_PASSWORD: process.env.MAIL_PASSWORD || '',
  MAIL_FROM: process.env.MAIL_FROM || 'noreply@conference.local',
  MAIL_TIMEZONE: process.env.MAIL_TIMEZONE || 'UTC',
  // Product docs do not specify a reminder offset. This is an operational default.
  REMINDER_LEAD_MINUTES: Number(process.env.REMINDER_LEAD_MINUTES) || 15,
  // Optional LLM constraint extraction. Empty key keeps the deterministic fallback.
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  OPENAI_TIMEOUT_MS: Number(process.env.OPENAI_TIMEOUT_MS) || 8000,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || '',
} as const;
