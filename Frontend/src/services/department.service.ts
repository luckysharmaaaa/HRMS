// ```typescript
import api from "./api";

export interface DepartmentData {
  departmentName: string;
  description: string;
  status: "Active" | "Inactive";
}

// Get all departments
export const getDepartments = async () => {
  return api.get("/departments");
};

// Create department
export const createDepartment = async (
  data: DepartmentData
) => {
  return api.post("/departments", data);
};

// Update department
export const updateDepartment = async (
  id: number,
  data: DepartmentData
) => {
  return api.put(`/departments/${id}`, data);
};

// Delete department
export const deleteDepartment = async (
  id: number
) => {
  return api.delete(`/departments/${id}`);
};
// ```
