import api from "./api";

// =========================================================
// AUTH
// =========================================================

export const loginUser = (email, password) => {
  return api.post("/auth/login", {
    email,
    password,
  });
};

export const getUser = () => {
  return api.get("/auth/me");
};

export const logout = () => {
  return api.post("/auth/logout");
};

export const refreshToken = (refreshTokenValue) => {
  return api.post("/auth/refresh-token", {
    refreshToken: refreshTokenValue,
  });
};

// First-time access for employees who don't have a company email yet.
// The backend always answers with the same generic success message, whether
// or not the email is registered.
export const requestFirstTimeAccess = (email) => {
  return api.post("/auth/first-time-access", {
    email,
  });
};

// =========================================================
// PASSWORD
// =========================================================

export const forgotPassword = (email) => {
  return api.post("/auth/forgot-password", {
    email,
  });
};

export const resetPassword = (token, password) => {
  return api.post("/auth/reset-password", {
    token,
    password,
  });
};

export const changePassword = (
  currentPassword,
  newPassword
) => {
  return api.post("/auth/change-password", {
    currentPassword,
    newPassword,
  });
};

// =========================================================
// PROFILE
// =========================================================

export const updateProfile = (data) => {
  return api.put("/auth/profile", data);
};

export const uploadProfilePhoto = (formData) => {
  return api.post("/auth/profile/photo", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const removeProfilePhoto = () => {
  return api.delete("/auth/profile/photo");
};

export default {
  loginUser,
  getUser,
  logout,
  refreshToken,
  requestFirstTimeAccess,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
};