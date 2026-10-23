process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-jwt-secret-at-least-32-characters";
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:saurav2004@localhost:5432/earthing_erp?schema=public";
}
