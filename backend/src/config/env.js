import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:5173")
    .transform((origins) => origins.split(",").map((origin) => origin.trim()))
    .pipe(z.array(z.string().url()).min(1)),
  JWT_SECRET: z
    .string()
    .min(32)
    .default("test-only-jwt-secret-at-least-32-characters"),
});

export const env = envSchema.parse(process.env);
