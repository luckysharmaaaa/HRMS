// Single source of truth for "is this IP allowed for attendance" —
// used by both the middleware (to block) and the service (to mark
// historic records as valid/invalid for display).

export const getAllowedIps = (): string[] => {
  const raw = process.env.ATTENDANCE_ALLOWED_IPS || "";
  return raw.split(",").map((ip) => ip.trim()).filter(Boolean);
};

export const normalizeIp = (ip: string): string => {
  return ip.replace(/^::ffff:/, "");
};

// No IPs configured -> nothing is "invalid" (matches middleware's
// dev-safe default of not blocking anything).
export const isIpAllowed = (ip: string | null): boolean => {
  if (!ip) return false; // no IP recorded (old rows before this feature) -> flagged
  const allowed = getAllowedIps();
  if (allowed.length === 0) return true;
  return allowed.includes(normalizeIp(ip));
};