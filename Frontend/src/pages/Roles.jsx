import React, { useEffect, useState } from "react";
import api from "../services/api";
import { FiChevronRight } from "react-icons/fi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AddIcon from "@mui/icons-material/Add";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";

import RolesTable from "../components/RolesTable";
import AddRoles from "../components/AddRoles";

import {
  saveRoleModules,
  saveRolePermissions,
} from "../services/RolePermissionApi";

const Roles = () => {
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(false);

  const [openDrawer, setOpenDrawer] = useState(false);

  const [editRole, setEditRole] = useState(null);

  // ============================================================
  // FETCH ROLES
  // ============================================================

  const fetchRoles = async () => {
    try {
      setLoading(true);

      const response = await api.get("/roles");

      const data = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      const formattedRoles = data.map((item) => ({
        id: item.id,
        roleName: item.roleName || "",
        roleCode: item.roleCode || "",
        description: item.description || "",
        status:
          item.status === "1" || item.status === 1
            ? "Active"
            : "Inactive",
        createdAt: item.createdAt
          ? new Date(item.createdAt * 1000).toLocaleDateString(
              "en-GB",
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
              },
            )
          : "-",
      }));

      setRoles(formattedRoles);
    } catch (error) {
      console.error("Fetch Roles Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to load roles.",
      );

      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // ============================================================
  // ADD ROLE
  // ============================================================

  const handleOpenDrawer = () => {
    setEditRole(null);
    setOpenDrawer(true);
  };

  // ============================================================
  // EDIT ROLE
  // ============================================================

  const handleEditRole = (role) => {
    setEditRole(role);
    setOpenDrawer(true);
  };

  // ============================================================
  // SAVE ROLE
  // ============================================================

  const handleAddRole = async (roleData) => {
    try {
      let roleId;

      const payload = {
        roleName: roleData.roleName,
        roleCode: roleData.roleCode,
        description: roleData.description,
        status: roleData.status === "Active" ? "1" : "0",
      };

      // --------------------------------------------------------
      // UPDATE
      // --------------------------------------------------------

      if (editRole?.id) {
        roleId = editRole.id;

        await api.put(
          `/roles/update/${roleId}`,
          payload,
        );
      }

      // --------------------------------------------------------
      // CREATE
      // --------------------------------------------------------

      else {
        const response = await api.post(
          "/roles/add",
          payload,
        );

        roleId =
          response.data?.data?.id ||
          response.data?.data?.roleId ||
          response.data?.id;

        if (!roleId) {
          throw new Error(
            "Role was created but the server did not return the role ID.",
          );
        }
      }

      // --------------------------------------------------------
      // SAVE MODULE MAPPINGS
      // --------------------------------------------------------

      await saveRoleModules({
        roleId,
        moduleIds: Array.isArray(roleData.selectedModules)
          ? roleData.selectedModules
          : [],
      });

      // --------------------------------------------------------
      // SAVE PERMISSIONS
      // --------------------------------------------------------

      const permissionObject =
        roleData.permissions &&
        typeof roleData.permissions === "object"
          ? roleData.permissions
          : {};

      const permissionArray = Object.entries(
        permissionObject,
      ).map(([moduleId, actions]) => ({
        moduleId: Number(moduleId),

        actions:
          actions && typeof actions === "object"
            ? Object.keys(actions).filter(
                (action) => actions[action] === true,
              )
            : [],
      }));

      await saveRolePermissions({
        roleId,
        permissions: permissionArray,
      });

      // --------------------------------------------------------
      // REFRESH
      // --------------------------------------------------------

      await fetchRoles();

      setOpenDrawer(false);
      setEditRole(null);

      toast.success(
        editRole
          ? "Role updated successfully."
          : "Role created successfully.",
      );
    } catch (error) {
      console.error("Save Role Error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to save role.",
      );

      // Important:
      // AddRoles uses this to keep the drawer open.
      throw error;
    }
  };

  // ============================================================
  // DELETE ROLE
  // ============================================================

  const handleDeleteRole = async (id) => {
    try {
      await api.delete(`/roles/delete/${id}`);

      setRoles((prev) =>
        prev.filter((role) => role.id !== id),
      );

      toast.success("Role deleted successfully.");
    } catch (error) {
      console.error("Delete Role Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to delete role.",
      );

      throw error;
    }
  };

  // ============================================================
  // CLOSE DRAWER
  // ============================================================

  const handleCloseDrawer = () => {
    setOpenDrawer(false);
    setEditRole(null);
  };

  // ============================================================
  // EXPORT CSV
  // ============================================================

  const exportCSV = () => {
    if (!roles.length) {
      toast.info("No roles available to export.");
      return;
    }

    const headers = [
      "Role Name",
      "Role Code",
      "Description",
      "Status",
      "Created Date",
    ];

    const rows = roles.map((role) => [
      role.roleName,
      role.roleCode,
      role.description || "",
      role.status,
      role.createdAt,
    ]);

    const escapeCell = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCell).join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `roles-${Date.now()}.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  };

  // ============================================================
  // EXPORT PDF
  // ============================================================

  const exportPDF = () => {
    if (!roles.length) {
      toast.info("No roles available to export.");
      return;
    }

    window.print();
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-5">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#0F265C] via-[#173a82] to-[#2563eb] px-6 py-7 shadow-lg shadow-blue-900/10">
        <div className="absolute right-0 top-0 h-40 w-40 translate-x-1/4 -translate-y-1/3 rounded-full bg-white/5" />

        <div className="absolute bottom-0 left-10 h-24 w-24 translate-y-1/2 rounded-full bg-sky-400/10" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 backdrop-blur-sm">
              <ShieldOutlinedIcon
                fontSize="small"
                sx={{ color: "#7dd3fc" }}
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Roles
              </h1>

              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-white/50">
                <span>User Management</span>

                <FiChevronRight
                  size={12}
                  className="shrink-0"
                />

                <span className="font-medium text-sky-300">
                  Roles & Permissions
                </span>
              </div>
            </div>
          </div>

          {/* ====================================================
              ACTIONS
          ==================================================== */}

          <div className="flex items-center gap-3">
            {/* Export */}

            <div className="dropdown dropdown-end">
              <label
                tabIndex={0}
                className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <DescriptionOutlinedIcon fontSize="small" />

                Export

                <KeyboardArrowDownIcon fontSize="small" />
              </label>

              <ul
                tabIndex={0}
                className="dropdown-content menu z-50 mt-2 w-56 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl"
              >
                <li>
                  <button
                    type="button"
                    onClick={exportPDF}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <PictureAsPdfOutlinedIcon
                      fontSize="small"
                      sx={{ color: "#ef4444" }}
                    />

                    <span className="font-medium">
                      Print / Save as PDF
                    </span>
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    onClick={exportCSV}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <TableChartOutlinedIcon
                      fontSize="small"
                      sx={{ color: "#16a34a" }}
                    />

                    <span className="font-medium">
                      Export as CSV
                    </span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Add Role */}

            <button
              type="button"
              onClick={handleOpenDrawer}
              className="flex h-10 items-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white shadow-sm shadow-orange-900/20 transition hover:bg-orange-600"
            >
              <AddIcon fontSize="small" />

              Add Role
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          TABLE
      ======================================================== */}

      {loading ? (
        <div className="flex justify-center py-24">
          <span className="loading loading-spinner loading-lg text-blue-500" />
        </div>
      ) : (
        <RolesTable
          roles={roles}
          setRoles={setRoles}
          onEditRole={handleEditRole}
          onDeleteRole={handleDeleteRole}
        />
      )}

      {/* ========================================================
          ADD / EDIT DRAWER
      ======================================================== */}

      <AddRoles
        open={openDrawer}
        onClose={handleCloseDrawer}
        onAddRole={handleAddRole}
        editRole={editRole}
      />
    </div>
  );
};

export default Roles;