import api from "./api";

/**
 * ==========================================================
 * GET TODAY'S ATTENDANCE
 * ==========================================================
 */
export const getTodayAttendance = async () => {
  const res = await api.get("/attendance/today");

  return res.data;
};

/**
 * ==========================================================
 * PUNCH IN
 * ==========================================================
 */
export const punchIn = async (location = null) => {
  const payload = {};

  if (location) {
    payload.location = location;
  }

  const res = await api.post("/attendance/punch-in", payload);

  return res.data;
};

/**
 * ==========================================================
 * PUNCH OUT
 * ==========================================================
 */
export const punchOut = async (location = null) => {
  const payload = {};

  if (location) {
    payload.location = location;
  }

  const res = await api.post("/attendance/punch-out", payload);

  return res.data;
};

/**
 * ==========================================================
 * GET ATTENDANCE HISTORY
 * ==========================================================
 */
export const getAttendanceHistory = async (
  page = 1,
  limit = 10,
  filters = {}
) => {
  const params = {
    page,
    limit,
  };

  if (filters.startDate) {
    params.startDate = filters.startDate;
  }

  if (filters.endDate) {
    params.endDate = filters.endDate;
  }

  const res = await api.get("/attendance/history", {
    params,
  });

  return res.data;
};