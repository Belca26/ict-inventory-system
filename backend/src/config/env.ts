import 'dotenv/config';
import { z } from 'zod';
import type { SignOptions } from 'jsonwebtoken';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),

  JWT_ACCESS_EXPIRES_IN: z
    .custom<SignOptions['expiresIn']>()
    .default('15m'),

  JWT_REFRESH_EXPIRES_IN: z
    .custom<SignOptions['expiresIn']>()
    .default('7d'),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  SMTP_HOST: z.string().optional(),

  SMTP_PORT: z.coerce.number().default(587),

  SMTP_USER: z.string().optional(),

  SMTP_PASSWORD: z.string().optional(),

  SMTP_FROM: z
    .string()
    .default('ICT Inventory System <noreply@university.ac.ke>'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;