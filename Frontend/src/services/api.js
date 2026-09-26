import axios from "axios";

// export const API_URL = "http://localhost:5000/api/v1";
export const API_URL = import.meta.env.VITE_API_URL;

// Fired when the session can no longer be recovered (refresh failed / no
// refresh token). AuthContext listens and clears its state; the router then
// sends the user to /login. No page reload, so no request loop.
export const AUTH_EXPIRED_EVENT = "auth:expired";

// Fired on every 403 from the API. AuthContext listens and re-loads the
// user's permissions, so a menu item / button that an admin has just revoked
// disappears without the user having to log out.
export const FORBIDDEN_EVENT = "auth:forbidden";

const AUTH_STORAGE_KEYS = [
  "token",
  "accessToken",
  "refreshToken",
  "user",
  "roles",
];

export const clearAuthStorage = () => {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

// A 401 from these endpoints is an expected answer (wrong password, bad reset
// token, ...) and must never trigger a refresh attempt or a redirect.
const NO_REFRESH_PATHS = [
  "/auth/login",
  "/auth/refresh-token",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/first-time-access",
  "/auth/change-password", // backend answers 401 for a wrong current password
  "/auth/logout",
];

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

const expireSession = () => {
  clearAuthStorage();
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
};

// One refresh at a time: parallel 401s share the same request.
let refreshPromise = null;

const refreshAccessToken = () => {
  if (refreshPromise) return refreshPromise;

  const storedRefreshToken = localStorage.getItem("refreshToken");

  if (!storedRefreshToken) {
    return Promise.reject(new Error("No refresh token available"));
  }

  // Bare axios on purpose: this call must not go through our interceptors.
  refreshPromise = axios
    .post(`${API_URL}/auth/refresh-token`, {
      refreshToken: storedRefreshToken,
    })
    .then((response) => {
      const data = response?.data?.data || response?.data;

      if (!data?.accessToken) {
        throw new Error("Refresh response did not include an access token");
      }

      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("accessToken", data.accessToken);

      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }

      return data.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || "";

    // 403 = logged in but not allowed. Tell the app so it can re-sync the
    // user's permissions; the caller still receives the error to show a message.
    if (status === 403) {
      window.dispatchEvent(new Event(FORBIDDEN_EVENT));
      return Promise.reject(error);
    }

    const skip =
      status !== 401 ||
      !original ||
      NO_REFRESH_PATHS.some((path) => url.includes(path));

    if (skip) {
      return Promise.reject(error);
    }

    // Already retried once and still 401 -> the session is really gone.
    if (original._retry) {
      expireSession();
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const newToken = await refreshAccessToken();

      original.headers.Authorization = `Bearer ${newToken}`;

      return api(original);
    } catch (refreshError) {
      expireSession();
      return Promise.reject(error);
    }
  }
);

export default api;