import api from "./api";

// Shift master
export const getShifts = () => api.get("/shifts");
export const getShiftById = (shiftId: number) => api.get(`/shifts/${shiftId}`);
export const createShift = (data: any) => api.post("/shifts", data);
export const updateShift = (shiftId: number, data: any) => api.put(`/shifts/${shiftId}`, data);
export const deleteShift = (shiftId: number) => api.delete(`/shifts/${shiftId}`);

// Employee <-> Shift mapping
export const getEmployeeShift = (employeeId: number) => api.get(`/employees/${employeeId}/shift`);

export const assignEmployeeShift = (employeeId: number, data: any) =>
  api.post(`/employees/${employeeId}/shift`, data);

export const getEmployeeShiftHistory = (employeeId: number) =>
  api.get(`/employees/${employeeId}/shift/history`);