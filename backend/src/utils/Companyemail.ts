/**
 * Company email domain rule (single source of truth for the backend).
 *
 * Set in .env:
 *   COMPANY_EMAIL_DOMAIN=bytesbrick.com
 *
 * Read on every call (not at import time) so it works regardless of when
 * dotenv loads. Falls back to bytesbrick.com so the rule can never be
 * switched off by a missing variable.
 */
const DEFAULT_COMPANY_EMAIL_DOMAIN = "bytesbrick.com";

export const getCompanyEmailDomain = (): string =>
  (process.env.COMPANY_EMAIL_DOMAIN || DEFAULT_COMPANY_EMAIL_DOMAIN)
    .trim()
    .toLowerCase()
    .replace(/^@/, "");

/**
 * True only for exactly one "@" and the exact company domain.
 * Subdomains (a@mail.bytesbrick.com) and look-alikes
 * (a@bytesbrick.com.evil.com, a@evilbytesbrick.com) are rejected.
 */
export const isCompanyEmail = (email: unknown): boolean => {
  const parts = String(email ?? "")
    .trim()
    .toLowerCase()
    .split("@");

  return (
    parts.length === 2 &&
    parts[0] !== "" &&
    parts[1] === getCompanyEmailDomain()
  );
};