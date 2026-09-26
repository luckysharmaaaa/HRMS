import api from "./api";

// ============================================================
// ADMIN ATTENDANCE LIST
// ============================================================
export const getAdminAttendance = async (filters = {}) => {
  const params = {};

  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;

  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;

  if (filters.employeeId) params.employeeId = filters.employeeId;
  if (filters.departmentId) params.departmentId = filters.departmentId;
  if (filters.designationId) params.designationId = filters.designationId;

  if (filters.status) params.status = filters.status;
  if (filters.search) params.search = filters.search;

  const res = await api.get("/attendance/admin", {
    params,
  });

  return res.data.data;
};


// ============================================================
// ADMIN ATTENDANCE SUMMARY
// ============================================================
export const getAdminAttendanceSummary = async (filters = {}) => {
  const params = {};

  /*
   * IMPORTANT:
   * Do NOT send:
   *
   * params.date = filters;
   *
   * That creates:
   * date[startDate]=...
   * date[endDate]=...
   *
   * Instead, every filter must be sent as a separate
   * query parameter.
   */

  if (filters.date) {
    params.date = filters.date;
  }

  if (filters.startDate) {
    params.startDate = filters.startDate;
  }

  if (filters.endDate) {
    params.endDate = filters.endDate;
  }

  if (filters.employeeId) {
    params.employeeId = filters.employeeId;
  }

  if (filters.departmentId) {
    params.departmentId = filters.departmentId;
  }

  if (filters.designationId) {
    params.designationId = filters.designationId;
  }

  if (filters.status) {
    params.status = filters.status;
  }

  if (filters.search) {
    params.search = filters.search;
  }

  const res = await api.get("/attendance/admin/summary", {
    params,
  });

  return res.data.data;
};


// ============================================================
// UPDATE ADMIN ATTENDANCE
// ============================================================
export const updateAdminAttendance = async (
  attendanceId,
  payload
) => {
  const res = await api.patch(
    `/attendance/admin/${attendanceId}`,
    payload
  );

  return res.data.data;
};


// ============================================================
// GET DEPARTMENTS
// ============================================================
export const getDepartments = async () => {
  const res = await api.get("/departments");

  const payload = res.data?.data;

  return Array.isArray(payload)
    ? payload
    : payload?.data ?? [];
};