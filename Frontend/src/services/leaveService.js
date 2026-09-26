import api from "./api";

// ============================================================
// LEAVE TYPES
// ============================================================
export const getLeaveTypes = async () => {
  const res = await api.get("/leave/types");
  return res.data.data;
};

// ============================================================
// LEAVE BALANCE (self)
// ============================================================
export const getMyBalance = async () => {
  const res = await api.get("/leave/balance");
  return res.data.data;
};

export const getMySummary = async () => {
  const res = await api.get("/leave/summary");
  return res.data.data;
};

export const getAdminSummary = async () => {
  const res = await api.get("/leave/admin/summary");
  return res.data.data;
};

// ============================================================
// EMPLOYEE: OWN APPLICATIONS
// ============================================================
export const getMyApplications = async (filters = {}) => {
  const params = {};

  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.leaveTypeId) params.leaveTypeId = filters.leaveTypeId;
  if (filters.status) params.status = filters.status;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;

  const res = await api.get("/leave/applications", { params });
  return res.data.data;
};

export const applyLeave = async (payload) => {
  const res = await api.post("/leave/applications", payload);
  return res.data.data;
};

export const getApplicationDetail = async (id) => {
  const res = await api.get(`/leave/applications/${id}`);
  return res.data.data;
};

export const editApplication = async (id, payload) => {
  const res = await api.patch(`/leave/applications/${id}`, payload);
  return res.data.data;
};

export const cancelApplication = async (id) => {
  const res = await api.patch(`/leave/applications/${id}/cancel`);
  return res.data.data;
};

// ============================================================
// ADMIN: ALL APPLICATIONS
// ============================================================
export const getAdminApplications = async (filters = {}) => {
  const params = {};

  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.employeeId) params.employeeId = filters.employeeId;
  if (filters.departmentId) params.departmentId = filters.departmentId;
  if (filters.leaveTypeId) params.leaveTypeId = filters.leaveTypeId;
  if (filters.status) params.status = filters.status;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.search) params.search = filters.search;

  const res = await api.get("/leave/admin/applications", { params });
  return res.data.data;
};

export const approveApplication = async (id, remarks) => {
  const res = await api.patch(`/leave/admin/applications/${id}/approve`, {
    remarks,
  });
  return res.data.data;
};

export const rejectApplication = async (id, remarks) => {
  const res = await api.patch(`/leave/admin/applications/${id}/reject`, {
    remarks,
  });
  return res.data.data;
};

// ============================================================
// LEAVE SETTINGS
// ============================================================
export const getLeaveSettings = async () => {
  const res = await api.get("/leave/settings");
  return res.data.data;
};

export const createLeaveSetting = async (payload) => {
  const res = await api.post("/leave/settings", payload);
  return res.data.data;
};

export const updateLeaveSetting = async (id, payload) => {
  const res = await api.patch(`/leave/settings/${id}`, payload);
  return res.data.data;
};