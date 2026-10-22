import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  CORS_ORIGIN: z.string().url().default("http://localhost:5173"),
  JWT_SECRET: z.string().default("secret-jwt-key-yash-earthing-erp"),
});

export const env = envSchema.parse(process.env);
