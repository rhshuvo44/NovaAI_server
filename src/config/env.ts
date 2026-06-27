import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_VERSION: z.string().default('v1'),
  APP_NAME: z.string().default('AI Workspace'),
  APP_URL: z.string().default('http://localhost:5000'),
  CLIENT_URL: z.string().default('http://localhost:3000'),

  // MongoDB
  MONGODB_URI: z.string().default('mongodb://localhost:27017/ai-workspace'),
  MONGODB_URI_TEST: z.string().optional(),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_USERNAME: z.string().optional(),
  REDIS_TLS: z.coerce.boolean().default(false),
  REDIS_DB: z.coerce.number().default(0),

  // Clerk
  CLERK_SECRET_KEY: z.string().default('sk_test_placeholder'),
  CLERK_PUBLISHABLE_KEY: z.string().default('pk_test_placeholder'),
  CLERK_JWT_KEY: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().default('whsec_placeholder'),

  // JWT (internal service tokens / refresh tokens)
  JWT_ACCESS_SECRET: z.string().default('dev_access_secret_change_me_minimum_32_chars'),
  JWT_REFRESH_SECRET: z.string().default('dev_refresh_secret_change_me_minimum_32_chars'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // AI Providers
  AI_PROVIDER: z.enum(['openai', 'gemini']).default('openai'),
  OPENAI_API_KEY: z.string().default('sk-placeholder'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  GEMINI_API_KEY: z.string().default('AIzaSyPlaceholder'),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().default('placeholder_cloud'),
  CLOUDINARY_API_KEY: z.string().default('placeholder_key'),
  CLOUDINARY_API_SECRET: z.string().default('placeholder_secret'),

  // Email
  EMAIL_PROVIDER: z.enum(['resend', 'nodemailer']).default('resend'),
  RESEND_API_KEY: z.string().default('re_placeholder'),
  SMTP_HOST: z.string().default('smtp.mailtrap.io'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default('placeholder_user'),
  SMTP_PASSWORD: z.string().default('placeholder_password'),
  EMAIL_FROM: z.string().default('AI Workspace <noreply@aiworkspace.dev>'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),

  // Bcrypt
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),

  // Cookies
  COOKIE_SECRET: z.string().default('dev_cookie_secret_change_me_in_prod_min_32'),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment configuration:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration. Check .env against .env.example');
  }

  return parsed.data;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
