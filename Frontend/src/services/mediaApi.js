import api from "./api";

/**
 * ===========================================
 * Upload Media
 * ===========================================
 * `module` is sent as a query param (?module=users), not just a
 * FormData field. This matters: Multer's destination logic (backend)
 * only sees FormData text fields that arrive BEFORE the file field
 * in the multipart stream. A query param is parsed by Express from
 * the URL itself, so it's always available immediately — no
 * dependency on field ordering inside the FormData you build.
 *
 * Usage:
 *   uploadMedia(formData, "users")
 *   uploadMedia(formData, "employees")
 *   uploadMedia(formData) // defaults to "others" on the backend
 */
export const uploadMedia = (formData, module) => {
  const query = module ? `?module=${encodeURIComponent(module)}` : "";
  return api.post(`/media/upload${query}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

/**
 * ===========================================
 * Get All Media
 * ===========================================
 */
export const getAllMedia = () => {
  return api.get("/media");
};

/**
 * ===========================================
 * Get Media By Id
 * ===========================================
 */
export const getMediaById = (id) => {
  return api.get(`/media/${id}`);
};

/**
 * ===========================================
 * Delete Media
 * ===========================================
 */
export const deleteMedia = (id, data = {}) => {
  return api.delete(`/media/${id}`, {
    data,
  });
};