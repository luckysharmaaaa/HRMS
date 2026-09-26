import winston from 'winston';
import config from '../config';
import * as path from 'path';
import * as fs from 'fs';

const logsDir = config.logging.filePath;
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message as string}`;
        if (Object.keys(meta).length > 0) msg += ` ${JSON.stringify(meta)}`;
        return msg;
    })
);

const logger = winston.createLogger({
    level: config.logging.level,
    format: fileFormat,
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880,
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
        }),
    ],
});

if (config.server.env !== 'production') {
    logger.add(new winston.transports.Console({ format: consoleFormat }));
}

export default logger;
