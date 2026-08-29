import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import pinoHttp from "pino-http";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { errorHandler, notFoundHandler } from "./lib/errors.js";
import { logger } from "./lib/logger.js";
import { apiLimiter } from "./middleware/rate-limit.middleware.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendDirectory = path.resolve(currentDirectory, "../../frontend/dist");

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const id = req.headers["x-request-id"] || crypto.randomUUID();
        res.setHeader("x-request-id", id);
        return id;
      },
    })
  );
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
    })
  );
  if (process.env.NODE_ENV !== "production") {
    app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
  }
  app.use(express.json({ limit: "7mb" }));
  app.use(cookieParser());

  app.get("/api/health", (req, res) => {
    const databaseReady = mongoose.connection.readyState === 1;
    res.status(databaseReady ? 200 : 503).json({
      status: databaseReady ? "ok" : "unavailable",
      database: databaseReady ? "connected" : "disconnected",
    });
  });

  app.use("/api", apiLimiter);
  app.use("/api/auth", authRoutes);
  app.use("/api/messages", messageRoutes);

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(frontendDirectory));
    app.get(/^(?!\/api(?:\/|$)).*/, (req, res) => {
      res.sendFile(path.join(frontendDirectory, "index.html"));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
