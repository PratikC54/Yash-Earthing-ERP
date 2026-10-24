import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import apiRouter from "./routes/index.js";

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'", "https:"],
        "script-src-attr": ["'unsafe-inline'"],
        "img-src": ["'self'", "data:", "https:", "blob:"],
      },
    },
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.CORS_ORIGIN.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.NODE_ENV === "development" ? 50000 : 300,
    skip: () => env.NODE_ENV === "development",
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);

// Root landing route
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Yash Group ERP Backend API",
    version: "1.0.0",
    apiPrefix: "/api/v1",
    healthCheck: "/api/v1/health",
  });
});

app.use("/api/v1", apiRouter);
app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
