import React, { useEffect, useState } from "react";
import { Users as UsersIcon, Plus } from "lucide-react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";

import UserTable from "../components/user/UserTable";
import AddUserDrawer from "../components/user/AddUserDrawer";
import { getRoles } from "../services/userApi";

const User = ({ refresh }) => {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [refreshTable, setRefreshTable] = useState(false);
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchRoles = async () => {
      try {
        setRolesLoading(true);
        const response = await getRoles();

        if (mounted) {
          setRoles(response?.data?.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      } finally {
        if (mounted) {
          setRolesLoading(false);
        }
      }
    };

    fetchRoles();

    return () => {
      mounted = false;
    };
  }, []);

  // Parent-level refresh support.
  useEffect(() => {
    if (refresh === undefined) return;
    setRefreshTable((prev) => !prev);
  }, [refresh]);

  const handleUserCreated = () => {
    setOpenDrawer(false);
    setRefreshTable((prev) => !prev);
  };

  return (
    <div className="space-y-6">
      {/* Header banner — same brand navy gradient as Modules.jsx, so every
          page in the app opens on the same visual pattern. */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-brand px-6 py-7 shadow-lg">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-10 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />

        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/10 border border-white/10 rounded-xl backdrop-blur-sm shrink-0">
              <UsersIcon size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Users</h1>
              <p className="text-sm text-white/70 mt-0.5">
                Manage user accounts, roles and access status
              </p>
            </div>
          </div>

          <div className="relative flex flex-wrap items-center gap-2.5">
            {/* Export — translucent on the colored banner so it doesn't
                compete with the solid Add User button */}
            <div className="dropdown dropdown-end">
              <label
                tabIndex={0}
                className="btn h-10 min-h-0 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white shadow-none transition-colors duration-fast ease-standard hover:bg-white/20"
              >
                <DescriptionOutlinedIcon fontSize="small" />
                Export
                <KeyboardArrowDownIcon fontSize="small" />
              </label>

              <ul
                tabIndex={0}
                className="dropdown-content z-50 mt-2 w-56 rounded-xl border border-border-subtle bg-surface p-2 shadow-lg"
              >
                <li>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg bg-surface px-3 py-2.5 text-sm text-text-primary transition-colors duration-fast ease-standard hover:bg-background"
                  >
                    <PictureAsPdfOutlinedIcon
                      fontSize="small"
                      sx={{ color: "#EF4444" }}
                    />
                    Export as PDF
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg bg-surface px-3 py-2.5 text-sm text-text-primary transition-colors duration-fast ease-standard hover:bg-background"
                  >
                    <TableChartOutlinedIcon
                      fontSize="small"
                      sx={{ color: "#16A34A" }}
                    />
                    Export as Excel
                  </button>
                </li>
              </ul>
            </div>

            {/* Add User */}
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-lg bg-accent-500 px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-fast ease-standard hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              onClick={() => setOpenDrawer(true)}
              disabled={rolesLoading}
              title={rolesLoading ? "Loading roles..." : "Add a new user"}
            >
              <Plus size={16} />
              {rolesLoading ? "Loading..." : "Add User"}
            </button>
          </div>
        </div>
      </div>

      {/* User Table */}
      <UserTable refresh={refreshTable} roles={roles} />

      {/* Add User Drawer */}
      <AddUserDrawer
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        onSuccess={handleUserCreated}
        roles={roles}
      />
    </div>
  );
};

export default User;