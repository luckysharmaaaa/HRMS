import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getUser,
  logout as logoutApi,
} from "../services/loginAPI";

import {
  AUTH_EXPIRED_EVENT,
  FORBIDDEN_EVENT,
  clearAuthStorage,
} from "../services/api";

// RBAC: one call returns the user's merged permissions ("slug:action").
import { getMyPermissions } from "../services/permissionApi";

export const AuthContext = createContext(null);

const getStoredToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken");

const readStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("user");

    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Failed to parse stored user:", error);
    return null;
  }
};

// GET /auth/me returns the full profile:
//   { user, address, roles, profileImage }
// A bare user object is wrapped so callers always get the same shape.
const extractProfile = (response) => {
  const data =
    response?.data?.data ||
    response?.data ||
    response;

  if (!data || typeof data !== "object") return null;

  return data.user ? data : { user: data };
};

// Keeps object references stable when nothing changed, so a background
// refresh doesn't re-render (or reset forms) for identical data.
const isSame = (a, b) => {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};

// Builds a "slug:action" permission key, e.g. "leave-employee:add".
const permissionKey = (moduleSlug, action) => `${moduleSlug}:${action}`;

export const AuthProvider = ({ children }) => {
  // user    = the flat user record ({ id, firstName, lastName, email, ... })
  // profile = the full payload from /auth/me (user + address + roles + photo)
  const [user, setUser] = useState(readStoredUser);
  const [profile, setProfileState] = useState(null);
  const [loading, setLoading] = useState(true);

  // RBAC: set of "moduleSlug:action" strings the logged-in user is allowed
  // to perform (already merged across all of the user's roles by the API).
  // permissionsLoaded lets consumers avoid a flash of the wrong menu.
  const [permissionKeys, setPermissionKeys] = useState(new Set());
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  // Holds the in-flight /auth/me request so that Navbar, Profile, StrictMode
  // double-effects, etc. all share ONE network call.
  const inFlightRef = useRef(null);

  // =========================================================
  // LOAD PERMISSIONS  (RBAC)
  // =========================================================
  const loadPermissions = useCallback(async () => {
    try {
      const res = await getMyPermissions();
      const list = res?.data?.data?.permissions;

      setPermissionKeys(new Set(Array.isArray(list) ? list : []));
    } catch (error) {
      console.error("Failed to load permissions:", error);
      // Keep whatever we already had. On a first load that is an empty set,
      // so RBAC-gated UI stays hidden (fail closed). The backend enforces
      // every action anyway, so a stale menu is never a security hole.
    } finally {
      setPermissionsLoaded(true);
    }
  }, []);

  // =========================================================
  // HAS PERMISSION  (RBAC)
  // hasPermission("employee-list", "edit")
  // =========================================================
  const hasPermission = useCallback(
    (moduleSlug, action) => permissionKeys.has(permissionKey(moduleSlug, action)),
    [permissionKeys],
  );

  // Convenience: hasAnyPermission("leave-admin", ["view", "approved"])
  const hasAnyPermission = useCallback(
    (moduleSlug, actions = ["view"]) =>
      actions.some((action) => permissionKeys.has(permissionKey(moduleSlug, action))),
    [permissionKeys],
  );

  // =========================================================
  // HAS ROLE — kept only for legacy callers. Prefer hasPermission():
  // role names in UI code are exactly what RBAC is meant to avoid.
  // =========================================================
  const hasRole = useCallback(
    (...allowedRoles) => {
      const userRoles = Array.isArray(profile?.roles) ? profile.roles : [];
      const allowed = allowedRoles.map((r) => String(r).toLowerCase());

      return userRoles.some((r) => {
        const name = String(r?.roleName ?? r?.name ?? "").toLowerCase();
        return allowed.includes(name);
      });
    },
    [profile]
  );

  const clearAuth = useCallback(() => {
    clearAuthStorage();
    setUser(null);
    setProfileState(null);
    setPermissionKeys(new Set());
    setPermissionsLoaded(false);
  }, []);

  // =========================================================
  // SET PROFILE  (after /auth/me, a save, or a photo change)
  // =========================================================
  const setProfile = useCallback((next) => {
    if (!next) return;

    const full = next.user ? next : { user: next };

    setProfileState((prev) => (isSame(prev, full) ? prev : full));
    setUser((prev) => (isSame(prev, full.user) ? prev : full.user));

    localStorage.setItem("user", JSON.stringify(full.user));

    // Roles or role permissions may have changed — refresh the permission set.
    loadPermissions();
  }, [loadPermissions]);

  // =========================================================
  // REFRESH USER  (GET /auth/me, de-duplicated)
  // Resolves to the full profile, or null on failure.
  // =========================================================
  const refreshUser = useCallback(() => {
    if (!getStoredToken()) {
      setUser(null);
      setProfileState(null);
      return Promise.resolve(null);
    }

    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    inFlightRef.current = getUser()
      .then((response) => {
        const next = extractProfile(response);

        if (next) {
          setProfile(next);
        }

        return next;
      })
      .catch((error) => {
        // Only an auth failure ends the session. A network blip or a 500
        // must not log the user out.
        if (error?.response?.status === 401) {
          clearAuth();
        } else {
          console.error("Failed to refresh user:", error);
        }

        return null;
      })
      .finally(() => {
        inFlightRef.current = null;
      });

    return inFlightRef.current;
  }, [clearAuth, setProfile]);

  // =========================================================
  // INITIAL AUTH CHECK
  // =========================================================
  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      if (!getStoredToken()) {
        setUser(null);
        setLoading(false);
        return;
      }

      await refreshUser();

      if (active) {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      active = false;
    };
  }, [refreshUser]);

  // =========================================================
  // SESSION EXPIRED (fired by api.js when refresh fails)
  // =========================================================
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setProfileState(null);
      setPermissionKeys(new Set());
      setPermissionsLoaded(false);
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    };
  }, []);

  // =========================================================
  // 403 FROM THE API -> re-sync permissions (throttled)
  // If an admin revoked something, the menu/buttons update by themselves.
  // =========================================================
  useEffect(() => {
    let last = 0;

    const handleForbidden = () => {
      const now = Date.now();
      if (now - last < 5000 || !getStoredToken()) return;
      last = now;
      loadPermissions();
    };

    window.addEventListener(FORBIDDEN_EVENT, handleForbidden);

    return () => {
      window.removeEventListener(FORBIDDEN_EVENT, handleForbidden);
    };
  }, [loadPermissions]);

  // =========================================================
  // LOGIN  (called by Login.jsx with the /auth/login payload)
  // =========================================================
  const login = useCallback(
    async ({ accessToken, refreshToken, user: loggedInUser, roles }) => {
      localStorage.setItem("token", accessToken);
      localStorage.setItem("accessToken", accessToken);

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      localStorage.setItem("roles", JSON.stringify(roles || []));

      if (loggedInUser) {
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        setUser(loggedInUser);
      }

      // Load the full profile once so Navbar/Profile can just read it.
      await refreshUser();
    },
    [refreshUser]
  );

  // =========================================================
  // LOGOUT
  // =========================================================
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  // =========================================================
  // CONTEXT VALUE
  // =========================================================
  const value = useMemo(
    () => ({
      user,
      profile,
      setUser,
      setProfile,
      loading,
      login,
      logout,
      clearUser: clearAuth, // used by ProfileSidebar
      refreshUser,
      isAuthenticated: !!user,
      // RBAC
      hasPermission,
      hasAnyPermission,
      permissionsLoaded,
      refreshPermissions: loadPermissions,
      hasRole,
    }),
    [
      user,
      profile,
      loading,
      login,
      logout,
      clearAuth,
      refreshUser,
      setProfile,
      hasPermission,
      hasAnyPermission,
      permissionsLoaded,
      loadPermissions,
      hasRole,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// =========================================================
// USE AUTH HOOK
// =========================================================
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};