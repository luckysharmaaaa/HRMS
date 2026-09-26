import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiShield,
  FiChevronUp,
  FiChevronDown,
  FiAlertTriangle,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const SortIcon = () => (
  <span className="inline-flex flex-col ml-1 opacity-40 leading-none">
    <FiChevronUp size={10} />
    <FiChevronDown size={10} />
  </span>
);

// Confirmation modal — replaces the old window.confirm()/alert() pair so
// deletes match the rest of the app's visual language.
function DeleteConfirmModal({ role, onClose, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsDeleting(false);
  }, [role]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && !isDeleting) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isDeleting]);

  if (!role) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(role.id);
      onClose();
    } catch {
      // onDeleteRole already toasts the error — just let the user try again
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={isDeleting ? undefined : onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-role-title"
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 z-10 p-6"
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div className="p-3 bg-red-50 rounded-full">
            <FiAlertTriangle size={22} className="text-red-500" />
          </div>
          <h3 id="delete-role-title" className="text-base font-semibold text-gray-800">
            Delete Role?
          </h3>
          <p className="text-sm text-gray-500">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-700">"{role.roleName}"</span>? Any
            users assigned this role will lose the permissions tied to it. This can't be
            undone.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

const RolesTable = ({ roles, setRoles, onEditRole, onDeleteRole }) => {
  const navigate = useNavigate();

  // ===========================
  // Filters
  // ===========================

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [roleToDelete, setRoleToDelete] = useState(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // ===========================
  // Delete Role
  // The API call + toast + refetch all live in Roles.jsx (single source
  // of truth). This component only confirms and hands off the id — it
  // used to also call axios.delete itself, which meant every click fired
  // two delete requests against the backend.
  // ===========================

  const handleConfirmDelete = async (id) => {
    await onDeleteRole(id);
  };

  // ===========================
  // Search + Filter
  // NOTE: a createdAt date-range filter used to run here too, defaulting
  // to "this calendar year" — but the date-range picker that would let
  // someone see or change that range was commented out. Roles outside
  // the current year were silently disappearing from the table with no
  // visible cause. Removed until the picker is wired back up.
  // ===========================

  const filteredRoles = roles.filter((item) => {
    const matchSearch =
      item.roleName.toLowerCase().includes(search.toLowerCase()) ||
      item.roleCode.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter ? item.status === statusFilter : true;

    return matchSearch && matchStatus;
  });

  // ===========================
  // Pagination
  // ===========================

  const totalEntries = filteredRoles.length;

  const totalPages = Math.max(1, Math.ceil(totalEntries / rowsPerPage));

  const safePage = Math.min(currentPage, totalPages);

  const paginatedRoles = filteredRoles.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage
  );

  const startEntry =
    totalEntries === 0 ? 0 : (safePage - 1) * rowsPerPage + 1;

  const endEntry = Math.min(safePage * rowsPerPage, totalEntries);

  return (
    <div className="bg-white rounded-xl shadow-md shadow-gray-200/60 border border-gray-100">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <FiSearch
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles..."
              aria-label="Search roles"
              className="input input-sm input-bordered pl-8 w-56 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="select select-sm select-bordered focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="whitespace-nowrap">Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="select select-sm select-bordered focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table table-md w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-blue-900/50 uppercase tracking-wider border-b border-blue-100 bg-blue-50/40">
              <th className="bg-transparent px-5 py-3 font-semibold">
                <span className="inline-flex items-center gap-1">
                  Role Name <SortIcon />
                </span>
              </th>

              <th className="bg-transparent px-5 py-3 font-semibold">
                <span className="inline-flex items-center gap-1">
                  Role Code <SortIcon />
                </span>
              </th>

              <th className="bg-transparent px-5 py-3 font-semibold">
                <span className="inline-flex items-center gap-1">
                  Description <SortIcon />
                </span>
              </th>

              <th className="bg-transparent px-5 py-3 font-semibold">
                <span className="inline-flex items-center gap-1">
                  Created Date <SortIcon />
                </span>
              </th>

              <th className="bg-transparent px-5 py-3 font-semibold">
                <span className="inline-flex items-center gap-1">
                  Status <SortIcon />
                </span>
              </th>

              <th className="bg-transparent px-5 py-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {paginatedRoles.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                  {search || statusFilter ? "No roles match your filters." : "No roles yet."}
                </td>
              </tr>
            ) : (
              paginatedRoles.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/50 transition">
                  <td className="px-5 py-3 font-medium text-gray-800">{item.roleName}</td>

                  <td className="px-5 py-3">
                    <code className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded font-mono">
                      {item.roleCode}
                    </code>
                  </td>

                  <td className="px-5 py-3 text-gray-500">{item.description || "—"}</td>

                  <td className="px-5 py-3 text-gray-500">{item.createdAt}</td>

                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        item.status === "Active"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-red-50 text-red-500 border-red-100"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex justify-center gap-1">
                      

                      <button
                        onClick={() => onEditRole(item)}
                        title="Edit"
                        aria-label={`Edit ${item.roleName}`}
                        className="p-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-500 text-gray-400 transition"
                      >
                        <FiEdit2 size={15} />
                      </button>

                      <button
                        onClick={() => setRoleToDelete(item)}
                        title="Delete"
                        aria-label={`Delete ${item.roleName}`}
                        className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-400 transition"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Showing {startEntry} - {endEntry} of {totalEntries} entries
        </p>

        <div className="join">
          <button
            className="join-item btn btn-sm btn-ghost border border-gray-200"
            disabled={safePage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            aria-label="Previous page"
          >
            ❮
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                aria-current={page === safePage ? "page" : undefined}
                className={`join-item btn btn-sm ${
                  page === safePage
                    ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                    : "btn-ghost border border-gray-200"
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            className="join-item btn btn-sm btn-ghost border border-gray-200"
            disabled={safePage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            aria-label="Next page"
          >
            ❯
          </button>
        </div>
      </div>

      <DeleteConfirmModal
        role={roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default RolesTable;