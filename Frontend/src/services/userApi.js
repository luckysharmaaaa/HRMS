import api from "./api";

// Get All Users
export const getAllUsers = () => {
  return api.get("/users");
};

// Get Single User
export const getUserById = (id) => {
  return api.get(`/users/${id}`);
};

// Create User
export const createUser = (data) => {
  return api.post("/users", data);
};

// Update User
export const updateUser = (id, data) => {
  return api.put(`/users/${id}`, data);
};

// Delete User
export const deleteUser = (id, data = {}) => {
  return api.delete(`/users/${id}`, {
    data,
  });
};

export const getRoles = () => {
  return api.get("/roles");
};