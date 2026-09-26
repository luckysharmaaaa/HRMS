import React, { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { BadgeCheck, Loader2, ShieldCheck } from "lucide-react";
import RolePermissionTable from "./RolePermissionTable";

const EMPTY_ROLE = {
  roleName: "",
  roleCode: "",
  description: "",
  status: "Active",
};

const AddRoles = ({
  open,
  onClose,
  onAddRole,
  editRole,
}) => {
  const [roleData, setRoleData] = useState(EMPTY_ROLE);

  const [selectedModules, setSelectedModules] = useState([]);

  const [permissions, setPermissions] = useState({});

  const [errors, setErrors] = useState({});

  const [isSaving, setIsSaving] = useState(false);

  // ============================================================
  // INITIALIZE FORM
  // ============================================================

  useEffect(() => {
    if (editRole) {
      setRoleData({
        roleName: editRole.roleName || "",
        roleCode: editRole.roleCode || "",
        description: editRole.description || "",
        status: editRole.status || "Active",
      });
    } else {
      setRoleData({ ...EMPTY_ROLE });
      setSelectedModules([]);
      setPermissions({});
    }

    setErrors({});
    setIsSaving(false);
  }, [editRole, open]);

  // ============================================================
  // LOCK BODY SCROLL
  // ============================================================

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // ============================================================
  // ESCAPE KEY
  // ============================================================

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, isSaving, onClose]);

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setRoleData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // ============================================================
  // ROLE CODE FORMATTER
  // ============================================================

  const handleRoleCodeChange = (event) => {
    const value = event.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, "");

    setRoleData((prev) => ({
      ...prev,
      roleCode: value,
    }));

    if (errors.roleCode) {
      setErrors((prev) => ({
        ...prev,
        roleCode: "",
      }));
    }
  };

  // ============================================================
  // VALIDATION
  // ============================================================

  const validate = () => {
    const nextErrors = {};

    const roleName = roleData.roleName.trim();
    const roleCode = roleData.roleCode.trim();

    if (!roleName) {
      nextErrors.roleName = "Role name is required.";
    } else if (roleName.length < 2) {
      nextErrors.roleName = "Role name must contain at least 2 characters.";
    }

    if (!roleCode) {
      nextErrors.roleCode = "Role code is required.";
    } else if (!/^[A-Z][A-Z0-9_]*$/.test(roleCode)) {
      nextErrors.roleCode =
        "Use uppercase letters, numbers and underscores only.";
    } else if (roleCode.length < 2) {
      nextErrors.roleCode = "Role code must contain at least 2 characters.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async () => {
    if (isSaving) return;

    if (!validate()) return;

    setIsSaving(true);

    try {
      await onAddRole({
        roleName: roleData.roleName.trim(),
        roleCode: roleData.roleCode.trim(),
        description: roleData.description.trim(),
        status: roleData.status,
        selectedModules,
        permissions,
      });

      setRoleData({ ...EMPTY_ROLE });
      setSelectedModules([]);
      setPermissions({});
      setErrors({});

      onClose();
    } catch (error) {
      // Parent already handles toast.
      // Keep form open so user does not lose entered data.
      console.error("Role save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // CANCEL
  // ============================================================

  const handleCancel = () => {
    if (isSaving) return;

    onClose();
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      {/* ========================================================
          BACKDROP
      ======================================================== */}

      {open && (
        <div
          className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-[2px]"
          onClick={handleCancel}
        />
      )}

      {/* ========================================================
          DRAWER
      ======================================================== */}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-drawer-title"
        className={`fixed top-0 right-0 z-[1000] flex h-full w-full max-w-[720px] flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="shrink-0 border-b border-gray-100 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-orange-500">
                <BadgeCheck size={22} />
              </div>

              <div className="min-w-0">
                <h2
                  id="role-drawer-title"
                  className="text-xl font-bold tracking-tight text-[#0F265C]"
                >
                  {editRole ? "Edit Role" : "Create Role"}
                </h2>

                <p className="mt-1 text-xs font-medium text-gray-400">
                  {editRole
                    ? "Update role details and access permissions"
                    : "Create a custom role and define its access scope"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              aria-label="Close role drawer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CloseIcon fontSize="small" />
            </button>
          </div>
        </div>

        {/* ======================================================
            BODY
        ====================================================== */}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* ====================================================
              ROLE INFORMATION
          ==================================================== */}

          <section className="border-b border-gray-100 px-6 py-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <ShieldCheck size={18} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-800">
                  Role Information
                </h3>

                <p className="text-xs text-gray-400">
                  Define the identity and purpose of this role.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Role Name */}

              <div>
                <label
                  htmlFor="roleName"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Role Name
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  id="roleName"
                  name="roleName"
                  type="text"
                  value={roleData.roleName}
                  onChange={handleChange}
                  disabled={isSaving}
                  placeholder="e.g. Payroll Manager"
                  className={`input input-bordered w-full bg-white ${
                    errors.roleName
                      ? "border-red-400 focus:border-red-400"
                      : "border-gray-200 focus:border-blue-400"
                  }`}
                />

                {errors.roleName && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">
                    {errors.roleName}
                  </p>
                )}
              </div>

              {/* Role Code */}

              <div>
                <label
                  htmlFor="roleCode"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Role Code
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  id="roleCode"
                  name="roleCode"
                  type="text"
                  value={roleData.roleCode}
                  onChange={handleRoleCodeChange}
                  disabled={isSaving}
                  placeholder="e.g. PAYROLL_MANAGER"
                  className={`input input-bordered w-full bg-white font-mono text-sm ${
                    errors.roleCode
                      ? "border-red-400 focus:border-red-400"
                      : "border-gray-200 focus:border-blue-400"
                  }`}
                />

                {errors.roleCode ? (
                  <p className="mt-1.5 text-xs font-medium text-red-500">
                    {errors.roleCode}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    Uppercase letters, numbers and underscores only.
                  </p>
                )}
              </div>

              {/* Description */}

              <div className="md:col-span-2">
                <label
                  htmlFor="roleDescription"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Description
                </label>

                <textarea
                  id="roleDescription"
                  name="description"
                  rows={3}
                  value={roleData.description}
                  onChange={handleChange}
                  disabled={isSaving}
                  placeholder="Describe what this role is responsible for..."
                  className="textarea textarea-bordered w-full resize-none border-gray-200 bg-white focus:border-blue-400"
                />
              </div>
            </div>
          </section>

          {/* ====================================================
              PERMISSIONS
          ==================================================== */}

          <section className="px-6 py-6">
            <div className="mb-5">
              <h3 className="text-sm font-bold text-gray-800">
                Module & Permission Access
              </h3>

              <p className="mt-1 text-xs text-gray-400">
                Select the modules this role can access and define the
                permitted actions.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <RolePermissionTable
                role={editRole}
                selectedModules={selectedModules}
                setSelectedModules={setSelectedModules}
                permissions={permissions}
                setPermissions={setPermissions}
              />
            </div>
          </section>
        </div>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <div className="shrink-0 border-t border-gray-100 bg-white px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Status */}

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">
                Status
              </span>

              <button
                type="button"
                disabled={isSaving}
                onClick={() =>
                  setRoleData((prev) => ({
                    ...prev,
                    status:
                      prev.status === "Active" ? "Inactive" : "Active",
                  }))
                }
                aria-pressed={roleData.status === "Active"}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  roleData.status === "Active"
                    ? "bg-emerald-500"
                    : "bg-gray-300"
                } disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
                    roleData.status === "Active"
                      ? "translate-x-5"
                      : "translate-x-1"
                  }`}
                />
              </button>

              <span
                className={`text-xs font-semibold ${
                  roleData.status === "Active"
                    ? "text-emerald-600"
                    : "text-gray-500"
                }`}
              >
                {roleData.status}
              </span>
            </div>

            {/* Actions */}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex min-w-[130px] items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving && (
                  <Loader2 size={16} className="animate-spin" />
                )}

                {isSaving
                  ? "Saving..."
                  : editRole
                    ? "Update Role"
                    : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddRoles;