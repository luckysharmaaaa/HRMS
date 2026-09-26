import multer, { FileFilterCallback } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import config from '../config';
import { ApiError } from '../utils/apiError';

const uploadPath = config.upload.path;
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv'];


export const ALLOWED_MODULES = [
    'users',
    'employees',
    'companies',
    'branches',
    'clients',
    'vendors',
    'products',
    'others',
] as const;

export type UploadModule = (typeof ALLOWED_MODULES)[number];

const DEFAULT_MODULE: UploadModule = 'others';


const resolveModule = (req: Request): UploadModule => {
    const raw = (req.query.module as string) || (req.body?.module as string) || DEFAULT_MODULE;
    const normalized = raw.toLowerCase().trim();

    return (ALLOWED_MODULES as readonly string[]).includes(normalized)
        ? (normalized as UploadModule)
        : DEFAULT_MODULE;
};

const diskStorage = multer.diskStorage({
    destination: (req, _file, cb) => {
        const moduleName = resolveModule(req as Request);
        const modulePath = path.join(uploadPath, moduleName);

        if (!fs.existsSync(modulePath)) {
            fs.mkdirSync(modulePath, { recursive: true });
        }

        cb(null, modulePath);
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`File type '${ext}' is not allowed`));
    }
};

/** Saves files to disk at config.upload.path/<module>/ */
export const upload = multer({
    storage: diskStorage,
    fileFilter,
    limits: { fileSize: config.upload.maxFileSize },
});

/** Loads file buffer into memory (for processing without saving to disk) */
export const uploadToMemory = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: config.upload.maxFileSize },
});

/**
 * ==========================================================
 * forceModule
 * ==========================================================
 * Forces the upload destination folder server-side, ignoring
 * whatever ?module= the client sent. Used by routes (like the
 * Account Settings profile photo upload) where the destination
 * module must never be client-controlled.
 */
export const forceModule = (moduleName: UploadModule): RequestHandler => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        req.query.module = moduleName;
        next();
    };
};

/**
 * ==========================================================
 * Profile Photo Upload (stricter than the general `upload`)
 * ==========================================================
 * - Images only (jpg/jpeg/png/webp), no pdf/doc/etc.
 * - 2MB max, regardless of the global MAX_FILE_SIZE env value.
 * Still uses the same diskStorage (so files still land in
 * uploads/<module>/ via resolveModule / forceModule).
 */
const PROFILE_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const PROFILE_IMAGE_MAX_SIZE = 2 * 1024 * 1024; // 2MB

const profileImageFileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
): void => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (PROFILE_IMAGE_EXTENSIONS.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Profile photo must be one of: ${PROFILE_IMAGE_EXTENSIONS.join(', ')}`));
    }
};

export const uploadProfilePhoto = multer({
    storage: diskStorage,
    fileFilter: profileImageFileFilter,
    limits: { fileSize: PROFILE_IMAGE_MAX_SIZE },
});

/**
 * ==========================================================
 * wrapUpload
 * ==========================================================
 * Multer middleware calls next(err) internally on validation/size
 * failures, but that err is a plain Error / MulterError — which the
 * global error handler treats as an unhandled 500. This wrapper
 * converts those into a proper ApiError.badRequest (400) with the
 * real message ("File too large", "Profile photo must be one of...", etc).
 */
export const wrapUpload = (uploadMiddleware: RequestHandler): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): void => {
        uploadMiddleware(req, res, (err: unknown) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    return next(ApiError.badRequest(err.message));
                }
                if (err instanceof Error) {
                    return next(ApiError.badRequest(err.message));
                }
                return next(err);
            }
            next();
        });
    };
};