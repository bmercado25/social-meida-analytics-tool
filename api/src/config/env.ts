import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1), // Required for server-side operations
  YOUTUBE_API_KEY: z.string().min(1), // YouTube Data API v3 key
  OPENAI_API_KEY: z.string().min(1), // OpenAI API key for chatbot
});

export const env = envSchema.parse(process.env);
