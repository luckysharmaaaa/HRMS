import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export interface ValidationSchema {
    body?:   Joi.ObjectSchema;
    query?:  Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
}

/**
 * Reusable Joi schema fragments
 */
export const commonSchemas = {
    uuidParam:      Joi.object({ id: Joi.string().uuid().required() }),
    paginationQuery: Joi.object({
        page:  Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
    }),
    dateRangeQuery: Joi.object({
        startDate: Joi.date().iso(),
        endDate:   Joi.date().iso().min(Joi.ref('startDate')),
    }),
    email:    Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    phone:    Joi.string().pattern(/^\+?[\d\s\-()]+$/).min(10).max(20),
    latitude:  Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
};

/**
 * Validate request body / query / params using Joi.
 * Collects ALL validation errors before responding (abortEarly: false).
 */
export const validate = (schema: ValidationSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const errors: string[] = [];

        if (schema.body) {
            const { error } = schema.body.validate(req.body, { abortEarly: false });
            if (error) errors.push(...error.details.map((d) => d.message));
        }
        if (schema.query) {
            const { error } = schema.query.validate(req.query, { abortEarly: false });
            if (error) errors.push(...error.details.map((d) => d.message));
        }
        if (schema.params) {
            const { error } = schema.params.validate(req.params, { abortEarly: false });
            if (error) errors.push(...error.details.map((d) => d.message));
        }

        if (errors.length > 0) {
            res.status(400).json({ success: false, message: 'Validation failed', errors });
            return;
        }
        next();
    };
};
