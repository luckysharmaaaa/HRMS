import api, { API_URL } from "./api";

// Derive the server's root URL (without /api/v1) so relative fileURLs
// like "uploads/users/xxx.jpg" resolve to a real image URL, without
// hardcoding localhost separately from the existing API config.
const SERVER_BASE_URL = API_URL.replace(/\/api\/v1\/?$/, "");

export const getFileUrl = (fileURL) => {
  if (!fileURL) return null;
  if (/^https?:\/\//i.test(fileURL)) return fileURL;
  return `${SERVER_BASE_URL}/${fileURL.replace(/^\/+/, "")}`;
};

// ==============================
// Get My Profile
// (Prefer useAuth().refreshUser() in components: it shares one request.)
// ==============================
export const getMyProfile = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

// ==============================
// Update My Profile (+ address)
// ==============================
export const updateMyProfile = async (payload) => {
  const response = await api.put("/auth/profile", payload);
  return response.data;
};

// ==============================
// Upload Profile Photo
// Backend: POST /auth/profile/photo, multer field name is "file".
// ==============================
export const uploadProfileImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/auth/profile/photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};

// ==============================
// Remove Profile Photo
// ==============================
export const removeProfileImage = async () => {
  const response = await api.delete("/auth/profile/photo");
  return response.data;
};

// ==============================
// Change Password
// Backend: POST /auth/change-password (was PUT here).
// ==============================
export const changePassword = async (payload) => {
  const response = await api.post("/auth/change-password", payload);
  return response.data;
};