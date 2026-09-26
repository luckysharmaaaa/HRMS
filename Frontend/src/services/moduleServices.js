import api from "./api";
const BASE_URL = "http://localhost:5000/v1";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// ── Modules API ──────────────────────────────────────────────
export const getAllModules = () => api.get("/modules");

export const createModule = (data) => api.post("/modules", data);

export const updateModule = (id, data) => api.put(`/modules/${id}`, data);

export const deleteModule = (id) => api.delete(`/modules/${id}`);

export const toggleModuleStatus = (id, status) =>
  api.patch(`/modules/${id}/status`, { status });
