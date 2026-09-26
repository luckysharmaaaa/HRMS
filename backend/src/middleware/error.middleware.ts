import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';

/**
 * Global Error Handler  (must be the LAST middleware in server.ts)
 */
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
): void => {
    let statusCode = 500;
    let message = 'Internal server error';
    let errors: unknown = null;
    let isOperational = false;

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors;
        isOperational = err.isOperational;
    }

    if (!isOperational || statusCode >= 500) {
        logger.error('Unhandled error:', { message: err.message, stack: err.stack, url: req.url });
    } else {
        logger.warn('Operational error:', { message: err.message, url: req.url });
    }

    const body: Record<string, unknown> = { success: false, message };
    if (errors) body.errors = errors;
    if (process.env.NODE_ENV === 'development') body.stack = err.stack;

    res.status(statusCode).json(body);
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
};

/**
 * Async wrapper to catch promise rejections and forward to next()
 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
