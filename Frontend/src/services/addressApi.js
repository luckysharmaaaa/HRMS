import api from "./api";

/**
 * ===========================================
 * Create Address
 * ===========================================
 */
export const createAddress = (data) => {
  return api.post("/address", data);
};

/**
 * ===========================================
 * Get All Addresses
 * ===========================================
 */
export const getAllAddresses = () => {
  return api.get("/address");
};

/**
 * ===========================================
 * Get Address By Id
 * ===========================================
 */
export const getAddressById = (id) => {
  return api.get(`/address/${id}`);
};

/**
 * ===========================================
 * Get Address By Owner
 * ===========================================
 */
export const getAddressByOwner = (ownerType, ownerID) => {
  return api.get(`/address/${ownerType}/${ownerID}`);
};

/**
 * ===========================================
 * Update Address
 * ===========================================
 */
export const updateAddress = (id, data) => {
  return api.put(`/address/${id}`, data);
};

/**
 * ===========================================
 * Delete Address
 * ===========================================
 */
export const deleteAddress = (id, data = {}) => {
  return api.delete(`/address/${id}`, {
    data,
  });
};

export const getAttendanceHistory = async (page = 1, limit = 31, { startDate, endDate } = {}) => {
  const res = await api.get("/attendance/history", {
    params: { page, limit, startDate, endDate },
  });
  return res.data;
};