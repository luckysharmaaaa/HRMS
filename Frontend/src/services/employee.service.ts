// ```ts
import api from "./api";

// Create a new employee
export const createEmployee = (data: any) => {
  return api.post("/employees", data);
};

// Get all employees
export const getEmployees = () => {
  return api.get("/employees");
};

// Get users from users table who are not employees yet
export const getImportableUsers = () => {
  return api.get("/employees/users");
};

// Check whether a user already exists
export const checkUser = (data: any) => {
  return api.post("/employees/check-user", data);
};

// Import an existing user as an employee
export const importEmployee = (userId: number) => {
  return api.get(`/employees/import/${userId}`);
};

// Update an existing employee
export const updateEmployee = (
  employeeId: number,
  data: any
) => {
  return api.put(`/employees/${employeeId}`, data);
};

// Get employees who can be selected as managers
export const getManagers = () => {
  return api.get("/employees/managers");
};

// Delete (soft-delete) an employee
export const deleteEmployee = (employeeId: number) => {
  return api.delete(`/employees/${employeeId}`);
};
// ```

