import api from "./api";

// ================================
// Get All Modules
// ================================
export const getAllModules = () => {
  return api.get("/modules");
};

// ================================
// Get Single Module
// ================================
export const getModuleById = (id) => {
  return api.get(`/modules/${id}`);
};

// ================================
// Create Module
// ================================
export const createModule = (data) => {
  return api.post("/modules", data);
};

// ================================
// Update Module
// ================================
export const updateModule = (id, data) => {
  return api.put(`/modules/${id}`, data);
};

// ================================
// Delete Module
// ================================
export const deleteModule = (id) => {
  return api.delete(`/modules/${id}`);
};