import React from "react";
import { useAuth } from "../../context/AuthContext";

/**
 * <Can module="designations" action="delete"> <DeleteButton /> </Can>
 *
 * Renders children only when the user holds that permission.
 * `fallback` (optional) is rendered otherwise, e.g. a disabled button.
 * UI convenience only — the API enforces the same rule with authorize().
 */
export default function Can({ module: moduleSlug, action = "view", fallback = null, children }) {
  const { hasPermission, permissionsLoaded } = useAuth();

  return permissionsLoaded && hasPermission(moduleSlug, action) ? (
    <>{children}</>
  ) : (
    <>{fallback}</>
  );
}