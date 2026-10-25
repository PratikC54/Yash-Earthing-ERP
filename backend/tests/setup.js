import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-jwt-secret-at-least-32-characters";
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:saurav2004@localhost:5432/earthing_erp?schema=public";
} else if (!process.env.DATABASE_URL.includes("connect_timeout")) {
  const delimiter = process.env.DATABASE_URL.includes("?") ? "&" : "?";
  process.env.DATABASE_URL = `${process.env.DATABASE_URL}${delimiter}connect_timeout=30&pool_timeout=30`;
}
