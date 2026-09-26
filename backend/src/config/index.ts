import dotenv from 'dotenv';
import { AppConfig, DatabaseConfig } from '../types';
dotenv.config();

const buildDatabaseConfig = (): DatabaseConfig => {
    return {
        host:     process.env.DB_HOST     ?? 'localhost',
        port:     parseInt(process.env.DB_PORT ?? '3306', 10),
        database: process.env.DB_NAME     ?? 'base_db',
        user:     process.env.DB_USER     ?? 'root',
        password: process.env.DB_PASSWORD ?? '',
        poolMin:  parseInt(process.env.DB_POOL_MIN ?? '2', 10),
        poolMax:  parseInt(process.env.DB_POOL_MAX ?? '10', 10),
    };
};

const config: AppConfig = {
    server: {
        port:       parseInt(process.env.PORT ?? '5000', 10),
        env:        process.env.NODE_ENV ?? 'development',
        apiVersion: process.env.API_VERSION ?? 'v1',
    },

    database: buildDatabaseConfig(),

    jwt: {
        secret:            process.env.JWT_SECRET            ?? 'dev-jwt-secret',
        expiresIn:         process.env.JWT_EXPIRES_IN        ?? '1h',
        refreshSecret:     process.env.JWT_REFRESH_SECRET    ?? 'dev-refresh-secret',
        refreshExpiresIn:  process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    },

    cors: {
        origin:      (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(','),
        credentials: true,
    },

    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS      ?? '900000', 10),
        max:      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS   ?? '100', 10),
    },

    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE ?? '5242880', 10),
        path:        process.env.UPLOAD_PATH ?? './uploads',
    },

    logging: {
        level:    process.env.LOG_LEVEL      ?? 'info',
        filePath: process.env.LOG_FILE_PATH  ?? './logs',
    },

    email: {
        host:     process.env.SMTP_HOST     ?? 'smtp.gmail.com',
        port:     parseInt(process.env.SMTP_PORT ?? '587', 10),
        secure:   process.env.SMTP_SECURE === 'true',
        user:     process.env.SMTP_USER     ?? '',
        password: process.env.SMTP_PASSWORD ?? '',
        from:     process.env.EMAIL_FROM    ?? 'noreply@yourapp.com',
    },

    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
};

export default config;
