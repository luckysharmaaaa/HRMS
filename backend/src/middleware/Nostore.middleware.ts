import { Request, Response, NextFunction } from "express";

/**
 * Authenticated auth/profile responses (e.g. GET /auth/me) are per-user,
 * dynamic data and must never be served from, or revalidated against, a cache.
 *
 * Express auto-generates an ETag and answers "304 Not Modified" when the
 * request carries a matching If-None-Match. Dropping the conditional headers
 * makes req.fresh false, so the API always returns a full 200 body.
 */
export const noStore = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    Pragma: "no-cache",
    Expires: "0",
  });

  delete req.headers["if-none-match"];
  delete req.headers["if-modified-since"];

  next();
};