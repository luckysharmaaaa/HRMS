import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiEdit2,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";
import { toast } from "react-toastify";

import defaultUser from "../../assets/images/logoo.jpg";
import EditUserModal from "./EditUserModal";
import DeleteUserModal from "./DeleteUserModal";
import DateRangePickerButton from "./DateRangePickerButton";

import {
  deleteUser,
  getAllUsers,
  getUserById,
} from "../../services/userApi";

const FILE_BASE_URL = "http://localhost:5000";

const resolveImageUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  return `${FILE_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

const SortIcon = () => (
  <span className="ml-1 inline-flex flex-col leading-none opacity-35">
    <FiChevronUp size={9} />
    <FiChevronDown size={9} />
  </span>
);

const EmailStatusCell = ({ user }) =>
  user.pendingCompanyEmail ? (
    <span
      className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700"
      title={
        user.alternateEmail
          ? `Sign-in email: ${user.alternateEmail}`
          : "Official company email has not been assigned yet"
      }
    >
      Pending official email
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
      Official email
    </span>
  );

const UserTable = ({ roles = [], refresh }) => {
  const [users, setUsers] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const today = new Date();

  const [appliedRange, setAppliedRange] = useState([
    {
      startDate: new Date(today.getFullYear(), 0, 1),
      endDate: new Date(today.getFullYear(), 11, 31),
      key: "selection",
    },
  ]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getAllUsers();
      const data = response?.data?.data;

      if (!Array.isArray(data)) {
        setUsers([]);
        return;
      }

      const mappedUsers = data.map((item) => ({
        id: item.id,
        firstName: item.firstName,
        lastName: item.lastName,
        name: `${item.firstName || ""} ${item.lastName || ""}`.trim() || "Unnamed User",
        email: item.email,
        alternateEmail: item.alternateEmail,
        pendingCompanyEmail: Boolean(item.pendingCompanyEmail),
        phone: item.phone || "—",
        status: Number(item.status) === 1 ? "Active" : "Inactive",
        statusValue: Number(item.status),
        roles: Array.isArray(item.roles) ? item.roles : [],
        createdAt: item.createdAt,
        date: item.createdAt
          ? new Date(item.createdAt * 1000).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—",
        avatar: resolveImageUrl(item.profileImage) || defaultUser,
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error(
        error?.response?.data?.message || "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, refresh]);

  /*
   * FIX FOR EDIT ICON:
   *
   * Previously the edit drawer/modal was opened ONLY after getUserById()
   * completed successfully. If that request failed, returned an unexpected
   * payload, or was delayed, clicking the edit icon looked like it did
   * nothing.
   *
   * We now:
   * 1. Open the edit modal immediately using the row already loaded.
   * 2. Fetch the complete user record in the background.
   * 3. Replace editUser with the detailed response when available.
   *
   * This also gives the user immediate visual feedback.
   */
  const handleEdit = async (user) => {
    if (!user?.id || editingUserId) return;

    setEditingUserId(user.id);
    setEditUser(user);
    setIsEditModalOpen(true);

    try {
      const response = await getUserById(user.id);

      if (response?.data?.success && response?.data?.data) {
        setEditUser(response.data.data);
      } else {
        console.warn("getUserById returned an unexpected response:", response?.data);
      }
    } catch (error) {
      console.error("Failed to load user details:", error);

      /*
       * Do NOT close the modal here.
       * The list record is already a valid fallback and the modal can still
       * be inspected instead of making the edit button appear broken.
       */
      toast.error(
        error?.response?.data?.message ||
          "Could not load complete user details. Please try again."
      );
    } finally {
      setEditingUserId(null);
    }
  };

  const closeEditModal = () => {
    if (editingUserId) return;
    setIsEditModalOpen(false);
    setEditUser(null);
  };

  const handleSaveUser = async () => {
    await fetchUsers();
    closeEditModal();
    toast.success("User details updated successfully.");
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget?.id || isDeleting) return;

    try {
      setIsDeleting(true);

      const response = await deleteUser(deleteTarget.id, { trashedBy: 1 });

      if (response?.data?.success) {
        setUsers((prev) =>
          prev.filter((user) => user.id !== deleteTarget.id)
        );

        setDeleteTarget(null);
        setIsDeleteModalOpen(false);

        toast.success(response?.data?.message || "User deleted successfully.");
      } else {
        toast.error(response?.data?.message || "Failed to delete user.");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error(
        error?.response?.data?.message || "Failed to delete user."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const roleOptions = useMemo(
    () =>
      [...new Set(
        users.flatMap((user) =>
          (user.roles || [])
            .map((role) => role?.roleName)
            .filter(Boolean)
        )
      )].sort((a, b) => a.localeCompare(b)),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        String(user.email || "").toLowerCase().includes(query) ||
        String(user.alternateEmail || "").toLowerCase().includes(query) ||
        String(user.phone || "").toLowerCase().includes(query);

      const matchRole =
        !roleFilter ||
        (user.roles || []).some((role) => role?.roleName === roleFilter);

      const matchStatus =
        !statusFilter || user.status === statusFilter;

      const rowDate = user.createdAt
        ? new Date(user.createdAt * 1000)
        : null;

      const rangeStart = new Date(appliedRange[0].startDate);
      const rangeEnd = new Date(appliedRange[0].endDate);

      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd.setHours(23, 59, 59, 999);

      const matchDate =
        !rowDate || (rowDate >= rangeStart && rowDate <= rangeEnd);

      return matchSearch && matchRole && matchStatus && matchDate;
    });
  }, [users, search, roleFilter, statusFilter, appliedRange]);

  const totalEntries = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedUsers = useMemo(
    () =>
      filteredUsers.slice(
        (safePage - 1) * rowsPerPage,
        safePage * rowsPerPage
      ),
    [filteredUsers, safePage, rowsPerPage]
  );

  const startEntry =
    totalEntries === 0 ? 0 : (safePage - 1) * rowsPerPage + 1;

  const endEntry = Math.min(safePage * rowsPerPage, totalEntries);

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setCurrentPage(1);

    const now = new Date();

    setAppliedRange([
      {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: new Date(now.getFullYear(), 11, 31),
        key: "selection",
      },
    ]);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Card Header */}
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-[#0F265C]">
                Users List
              </h2>

              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                {totalEntries}
              </span>
            </div>

            <p className="mt-1 text-xs text-gray-400">
              Manage user profiles, roles, access status and account details.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DateRangePickerButton
              value={appliedRange}
              onChange={(newRange) => {
                setAppliedRange(newRange);
                setCurrentPage(1);
              }}
              defaultPreset="This Year"
            />

            <select
              className="select select-bordered h-10 min-h-0 w-36 rounded-lg bg-white text-sm text-gray-700"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by role"
            >
              <option value="">All Roles</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            <select
              className="select select-bordered h-10 min-h-0 w-32 rounded-lg bg-white text-sm text-gray-700"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by status"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <button
              type="button"
              onClick={fetchUsers}
              disabled={loading}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-[#0F265C] disabled:cursor-not-allowed disabled:opacity-50"
              title="Refresh users"
              aria-label="Refresh users"
            >
              <FiRefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Search / Controls */}
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Rows per page</span>

          <select
            className="select select-bordered h-9 min-h-0 rounded-lg bg-white text-xs text-gray-700"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>

          {(search || roleFilter || statusFilter) && (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-1 text-xs font-medium text-orange-500 transition hover:text-orange-600"
            >
              Clear filters
            </button>
          )}
        </div>

        <label className="flex h-10 w-full max-w-sm items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-gray-400 transition focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100">
          <FiSearch size={16} />

          <input
            type="text"
            className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            placeholder="Search name, email or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </label>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead className="bg-gray-50/80">
            <tr className="border-b border-gray-100 text-left">
              <th className="w-8 px-4 py-3" />

              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <span className="inline-flex items-center">
                  Name
                  <SortIcon />
                </span>
              </th>

              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Email
              </th>

              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Email Status
              </th>

              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Created Date
              </th>

              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Role
              </th>

              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Status
              </th>

              <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading && users.length === 0 ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="border-b border-gray-50">
                  <td colSpan={8} className="px-4 py-4">
                    <div className="flex items-center gap-4 animate-pulse">
                      <div className="h-10 w-10 rounded-full bg-gray-100" />
                      <div className="h-3 w-40 rounded bg-gray-100" />
                      <div className="h-3 w-56 rounded bg-gray-100" />
                    </div>
                  </td>
                </tr>
              ))
            ) : paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <div className="mx-auto max-w-sm">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
                      <FiSearch size={20} />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      No users found
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Try changing your search or filter criteria.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-50 transition hover:bg-orange-50/20"
                >
                  <td className="px-4 py-3" />

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-100 bg-gray-50">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            if (e.currentTarget.src !== defaultUser) {
                              e.currentTarget.src = defaultUser;
                            }
                          }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-gray-800">
                          {user.name}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-400">
                          {user.phone}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="max-w-[230px] truncate text-sm text-gray-600">
                      {user.email || (
                        <span className="italic text-gray-400">
                          {user.alternateEmail || "—"}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <EmailStatusCell user={user} />
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-500">
                    {user.date}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {user.roles?.length ? (
                        <>
                          <span className="inline-flex max-w-[130px] truncate rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                            {user.roles[0]?.roleName || "—"}
                          </span>

                          {user.roles.length > 1 && (
                            <span
                              className="text-[11px] font-semibold text-gray-400"
                              title={user.roles
                                .slice(1)
                                .map((role) => role?.roleName)
                                .filter(Boolean)
                                .join(", ")}
                            >
                              +{user.roles.length - 1}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">No role</span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        user.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        aria-label={`Edit ${user.name}`}
                        title={`Edit ${user.name}`}
                        disabled={Boolean(editingUserId)}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEdit(user);
                        }}
                        className="group flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {editingUserId === user.id ? (
                          <FiRefreshCw size={15} className="animate-spin" />
                        ) : (
                          <FiEdit2
                            size={15}
                            className="transition-transform group-hover:scale-105"
                          />
                        )}
                      </button>

                      <button
                        type="button"
                        aria-label={`Delete ${user.name}`}
                        title={`Delete ${user.name}`}
                        disabled={isDeleting}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteTarget(user);
                          setIsDeleteModalOpen(true);
                        }}
                        className="group flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FiTrash2
                          size={15}
                          className="transition-transform group-hover:scale-105"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          Showing{" "}
          <span className="font-semibold text-gray-700">{startEntry}</span>–
          <span className="font-semibold text-gray-700">{endEntry}</span> of{" "}
          <span className="font-semibold text-gray-700">{totalEntries}</span>{" "}
          entries
        </p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={safePage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            aria-label="Previous page"
          >
            <FiChevronLeft size={14} />
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                type="button"
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition ${
                  safePage === page
                    ? "bg-orange-500 text-white shadow-sm"
                    : "border border-transparent text-gray-500 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={safePage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            aria-label="Next page"
          >
            <FiChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        deleteTarget={deleteTarget}
        isDeleting={isDeleting}
        onClose={() => {
          if (isDeleting) return;
          setDeleteTarget(null);
          setIsDeleteModalOpen(false);
        }}
        onConfirm={handleDeleteUser}
      />

      {/* Edit Modal */}
      <EditUserModal
        isOpen={isEditModalOpen}
        editUser={editUser}
        roles={roles}
        onClose={closeEditModal}
        onSave={handleSaveUser}
      />
    </div>
  );
};

export default UserTable;
