import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

const globalForPrisma = globalThis;

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.DEBUG_PRISMA === "true"
        ? ["query", "error", "warn"]
        : ["error", "warn"],
  });

// Enhance $transaction with a 30s timeout for cloud database latency tolerance
const originalTransaction = basePrisma.$transaction.bind(basePrisma);
basePrisma.$transaction = function (arg, options = {}) {
  if (typeof arg === "function") {
    return originalTransaction(arg, {
      maxWait: 15000,
      timeout: 30000,
      ...options,
    });
  }
  return originalTransaction(arg, options);
};

export const prisma = basePrisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
