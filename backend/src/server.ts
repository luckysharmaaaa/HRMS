import path from "path";
import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import * as http from "http";

import config from "./config";
import logger from "./utils/logger";
import { testConnection, closeConnection } from "./db/connection";
import apiRoutes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

class App {
  public readonly app: Application;
  private server!: http.Server;

  constructor() {
    this.app = express();
    this._initMiddlewares();
    this._initRoutes();
    this._initErrorHandling();
  }

  private _initMiddlewares(): void {
    this.app.use(helmet());

    this.app.use(
      cors({
        origin: config.cors.origin,
        credentials: config.cors.credentials,
      }),
    );

    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));
    this.app.use(
      "/uploads",
      // helmet()'s default Cross-Origin-Resource-Policy: same-origin header
      // blocks the React dev server (localhost:5173) from embedding these
      // images in <img> tags, even though direct navigation to the same
      // URL works fine (that's same-origin navigation, not cross-origin
      // embedding — browsers treat them differently).
      // This override only relaxes the policy for the /uploads route,
      // leaving helmet's defaults untouched for the rest of the API.
      (req, res, next) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        next();
      },
      express.static(path.join(process.cwd(), "uploads")),
    );
    this.app.use(compression());

    if (config.server.env === "development") {
      this.app.use(morgan("dev"));
    } else {
      this.app.use(
        morgan("combined", {
          stream: { write: (msg: string) => logger.info(msg.trim()) },
        }),
      );
    }

    this.app.use(
      "/api/",
      rateLimit({
        windowMs: config.rateLimit.windowMs,
        max: config.rateLimit.max,
        message: {
          success: false,
          message: "Too many requests — try again later.",
        },
      }),
    );
  }

  private _initRoutes(): void {
    const prefix = `/api/${config.server.apiVersion}`;

    this.app.get("/", (_req, res) =>
      res.json({
        success: true,
        message: "Base API Server",
        version: config.server.apiVersion,
        docs: `${prefix}/health`,
      }),
    );

    this.app.use(prefix, apiRoutes);
  }

  private _initErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      await testConnection();
      this.server = this.app.listen(config.server.port, () => {
        logger.info("╔══════════════════════════════════════════╗");
        logger.info("║         Base API Server Started          ║");
        logger.info("╠══════════════════════════════════════════╣");
        logger.info(`║  Environment : ${config.server.env.padEnd(26)}║`);
        logger.info(
          `║  Port        : ${String(config.server.port).padEnd(26)}║`,
        );
        logger.info(
          `║  API Prefix  : /api/${config.server.apiVersion.padEnd(21)}║`,
        );
        logger.info("║  DB          : Connected ✓               ║");
        logger.info("╚══════════════════════════════════════════╝");
      });
    } catch (error) {
      logger.error("Failed to start server:", (error as Error).message);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    if (this.server) this.server.close();
    await closeConnection();
    logger.info("Server shut down gracefully");
  }
}

const application = new App();

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  logger.error("Unhandled Rejection:", reason);
  process.exit(1);
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received");
  await application.stop();
  process.exit(0);
});
process.on("SIGINT", async () => {
  logger.info("SIGINT received");
  await application.stop();
  process.exit(0);
});

if (require.main === module) {
  application.start();
}

export default application.app;