import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { getAllowedIps, normalizeIp } from "../utils/allowedIps";

declare global {
  namespace Express {
    interface Request {
      clientIp?: string;
    }
  }
}

const getClientIp = (req: Request): string => {
  const raw = req.ip || req.socket.remoteAddress || "";
  return normalizeIp(raw.trim());
};

export const attendanceIpCheck = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const clientIp = getClientIp(req);
  req.clientIp = clientIp; // always attach, used for DB logging regardless of restriction

  const allowed = getAllowedIps();
  if (allowed.length === 0) return next();

  const isLocalhost = ["127.0.0.1", "::1", "localhost"].includes(clientIp);
  if (isLocalhost && process.env.NODE_ENV !== "production") {
    return next();
  }

  if (!allowed.includes(clientIp)) {
    return next(
      ApiError.forbidden(`Attendance is not allowed from this network (${clientIp})`),
    );
  }

  next();
};