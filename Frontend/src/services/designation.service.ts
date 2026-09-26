// ```typescript
import api from "./api";

// ==========================================================
// DESIGNATION DATA
// ==========================================================

export interface DesignationData {
  departmentId: number;
  designationName: string;
  description?: string | null;
  status?: string;
}

// ==========================================================
// GET ALL DESIGNATIONS
// ==========================================================

export const getDesignations = async () => {
  return api.get("/designations");
};

// ==========================================================
// CREATE DESIGNATION
// ==========================================================

export const createDesignation = async (
  data: DesignationData
) => {
  return api.post("/designations", data);
};

// ==========================================================
// UPDATE DESIGNATION
// ==========================================================

export const updateDesignation = async (
  id: number,
  data: DesignationData
) => {
  return api.put(
    `/designations/${id}`,
    data
  );
};

// ==========================================================
// DELETE DESIGNATION
// ==========================================================

export const deleteDesignation = async (
  id: number
) => {
  return api.delete(
    `/designations/${id}`
  );
};
// ```
