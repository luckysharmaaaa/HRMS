import api from "./api";

// Reuses the existing endpoints. Nothing new on the backend.

// Roles and modules come from the DB, so a new role / module shows up in the
// permission screen automatically.
export const fetchRoles = () => api.get("/roles", { params: { limit: 100 } });
export const fetchModules = () => api.get("/modules");

export const fetchRolePermissions = (roleId) =>
  api.get(`/role-permissions/${roleId}`);

// Body: { roleId, permissions: [{ moduleId, actions: ["view", ...] }] }
export const saveRolePermissions = (roleId, permissions) =>
  api.post("/role-permissions/sync", { roleId, permissions });

// Accepts [..], { rows: [..] }, { data: [..] } or { roles: [..] }.
export const extractList = (res) => {
  const d = res?.data?.data ?? res?.data;
  if (Array.isArray(d)) return d;
  return d?.rows ?? d?.data ?? d?.roles ?? d?.modules ?? [];
};