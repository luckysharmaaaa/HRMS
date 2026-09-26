import api from "./api";

// ======================================
// Role Module Mapping
// ======================================

// Get mapped modules of role
export const getRoleModules = (roleId) => {
  return api.get(`/role-module-mapping/${roleId}`);
};

// Save mapped modules
export const saveRoleModules = (data) => {
  return api.post("/role-module-mapping/sync", data);
};

// ======================================
// Role Permissions
// ======================================

// Get permissions of role
export const getRolePermissions = (roleId) => {
  return api.get(`/role-permissions/${roleId}`);
};

// Save permissions
export const saveRolePermissions = (data) => {
  return api.post("/role-permissions/sync", data);
};