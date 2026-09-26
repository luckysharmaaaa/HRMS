// Shared avatar helpers, used by both Navbar and ProfileImage so the
// "initials fallback" logic lives in exactly one place.

export const getInitials = (firstName = "", lastName = "") => {
  const first = (firstName || "").trim().charAt(0);
  const last = (lastName || "").trim().charAt(0);
  const initials = `${first}${last}`.toUpperCase();
  return initials || "U";
};

// Deterministic background color from the HRMS palette, so a given
// user's initials avatar looks the same every time (no random flicker
// between renders).
const AVATAR_PALETTE = ["#0F265C", "#FF7A21", "#1E3A73", "#C9601A"];

export const getAvatarColor = (seed = "") => {
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
};