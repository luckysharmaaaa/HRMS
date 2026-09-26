// Set these in .env (Vite). The domain defaults to bytesbrick.com, so the
// company-email-only rule is always on.
//   VITE_COMPANY_NAME=BytesBrick
//   VITE_COMPANY_EMAIL_DOMAIN=bytesbrick.com

export const COMPANY_NAME = import.meta.env.VITE_COMPANY_NAME || "BytesBrick";

export const COMPANY_EMAIL_DOMAIN = String(
  import.meta.env.VITE_COMPANY_EMAIL_DOMAIN || "bytesbrick.com"
)
  .trim()
  .toLowerCase()
  .replace(/^@/, "");

/**
 * Friendly UI check only (used by the Add/Edit User forms to validate the
 * Official Email / Personal Email fields). The backend is the authority on
 * who may actually sign in.
 */
export const isCompanyEmail = (email) => {
  if (!COMPANY_EMAIL_DOMAIN) return true;

  const parts = String(email || "").trim().toLowerCase().split("@");

  return parts.length === 2 && parts[0] !== "" && parts[1] === COMPANY_EMAIL_DOMAIN;
};