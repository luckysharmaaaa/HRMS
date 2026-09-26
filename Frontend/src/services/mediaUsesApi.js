import api from "./api";

/**
 * ===========================================
 * Create Media Mapping
 * ===========================================
 */
export const createMediaUses = (data) => {
  return api.post("/media-uses", data);
};

/**
 * ===========================================
 * Get Media By Object
 * ===========================================
 */
export const getMediaUsesByObject = (objectType, objectID) => {
  return api.get(`/media-uses/${objectType}/${objectID}`);
};

/**
 * ===========================================
 * Delete Media Mapping
 * ===========================================
 */
export const deleteMediaUses = (id) => {
  return api.delete(`/media-uses/${id}`);
};