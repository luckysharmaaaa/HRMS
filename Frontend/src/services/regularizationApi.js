import api from "./api";

/**
 * ===========================================
 * Submit a new regularization request
 * ===========================================
 */
export const submitRegularization = (payload) => {
  return api.post("/regularization", payload);
};

/**
 * ===========================================
 * Update an existing PENDING regularization request
 * (Part 14/15 — edits the same request, never creates a new one)
 * ===========================================
 */
export const updateRegularization = (id, payload) => {
  return api.patch(`/regularization/${id}`, payload);
};

/**
 * ===========================================
 * Get the logged-in employee's own requests
 * ===========================================
 */
export const getMyRegularizations = async (page = 1, limit = 10, status) => {
  const res = await api.get("/regularization/my", {
    params: { page, limit, status },
  });
  return res.data;
};

/**
 * ===========================================
 * HR/Admin — list requests for review
 * ===========================================
 */
export const getRegularizationsForReview = async (page = 1, limit = 10, status) => {
  const res = await api.get("/regularization", {
    params: { page, limit, status },
  });
  return res.data;
};

/**
 * ===========================================
 * HR/Admin — approve a request
 * ===========================================
 */
export const approveRegularization = (id, reviewRemarks) => {
  return api.patch(`/regularization/${id}/approve`, { reviewRemarks });
};

/**
 * ===========================================
 * HR/Admin — reject a request
 * ===========================================
 */
export const rejectRegularization = (id, reviewRemarks) => {
  return api.patch(`/regularization/${id}/reject`, { reviewRemarks });
};