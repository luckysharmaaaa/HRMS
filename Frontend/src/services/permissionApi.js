import api from "./api";

// GET /auth/me/permissions
// -> { success, data: { permissions: ["leave-employee:view", ...] } }
// Any logged-in user can call this (it needs no module permission).
export const getMyPermissions = () => api.get("/auth/me/permissions");