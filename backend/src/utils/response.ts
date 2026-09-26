import { Response } from 'express';
import { ApiResponse, PaginatedResponse, PaginationMeta } from '../types';

export const sendSuccess = <T>(
    res: Response,
    message = 'Success',
    data: T = null as unknown as T,
    statusCode = 200
): Response => {
    const body: ApiResponse<T> = { success: true, message, data };
    return res.status(statusCode).json(body);
};

export const sendError = (
    res: Response,
    message: string,
    statusCode = 500,
    errors: unknown = null
): Response => {
    const body: Record<string, unknown> = { success: false, message };
    if (errors) body.errors = errors;
    return res.status(statusCode).json(body);
};

export const sendPaginated = <T>(
    res: Response,
    data: T[],
    pagination: PaginationMeta,
    message = 'Success'
): Response => {
    const body: PaginatedResponse<T> = { success: true, message, data, pagination };
    return res.status(200).json(body);
};
