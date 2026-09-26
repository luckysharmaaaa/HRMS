import { useAuth } from "../context/AuthContext";

/**
 * usePermission("attendance-employee")
 *   -> { canView, canAdd, canEdit, canApprove, canDelete, can(action), loaded }
 *
 * The slug must match modules.slug in the database. Permissions come from
 * role_permissions (merged across all of the user's roles) — never from a
 * role name.
 */
export default function usePermission(moduleSlug) {
  const { hasPermission, permissionsLoaded } = useAuth();

  const can = (action) => permissionsLoaded && hasPermission(moduleSlug, action);

  return {
    loaded: permissionsLoaded,
    can,
    canView: can("view"),
    canAdd: can("add"),
    canEdit: can("edit"),
    canApprove: can("approved"),
    canDelete: can("delete"),
  };
}