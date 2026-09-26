// ```ts
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

    this.initMiddlewares();
    this.initRoutes();
    this.initErrorHandling();
  }

  private initMiddlewares(): void {
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
      (req, res, next) => {
        res.setHeader(
          "Cross-Origin-Resource-Policy",
          "cross-origin",
        );
        next();
      },
      express.static(path.join(process.cwd(), "uploads")),
    );

    this.app.use(compression());

    this.app.use(
      morgan(config.server.env === "development" ? "dev" : "combined", {
        stream: {
          write: (message: string) => logger.info(message.trim()),
        },
      }),
    );

    this.app.use(
      "/api/",
      rateLimit({
        windowMs: config.rateLimit.windowMs,
        max: config.rateLimit.max,
        message: {
          success: false,
          message: "Too many requests - try again later.",
        },
      }),
    );
  }

  private initRoutes(): void {
    const prefix = `/api/${config.server.apiVersion}`;

    this.app.get("/", (_req, res) => {
      res.json({
        success: true,
        message: "Base API Server",
        version: config.server.apiVersion,
        docs: `${prefix}/health`,
      });
    });

    this.app.use(prefix, apiRoutes);
  }

  private initErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      await testConnection();

      const port = Number(process.env.PORT) || config.server.port;

      this.server = this.app.listen(port, "0.0.0.0", () => {
        logger.info(`Server started on port ${port}`);
        logger.info(`Environment: ${config.server.env}`);
        logger.info(`API: /api/${config.server.apiVersion}`);
        logger.info("Database connected");
      });
    } catch (error) {
      logger.error(
        "Failed to start server:",
        (error as Error).message,
      );
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
    }

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
  await application.stop();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await application.stop();
  process.exit(0);
});

if (require.main === module) {
  application.start();
}

export default application.app;
