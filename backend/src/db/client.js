import { PrismaClient } from "@prisma/client";

// Global PrismaClient instance for backend query execution
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export default prisma;