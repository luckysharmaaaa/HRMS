
import React, { useEffect, useState } from "react";
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiChevronUp,
  FiChevronDown,
} from "react-icons/fi";
import DateRangePickerButton from "../user/DateRangePickerButton";

const DepartmentTable = ({
  departments,
  setDepartments,
  onEditDepartment,
  onDeleteDepartment,
}) => {
  const today = new Date();

  const [appliedRange, setAppliedRange] = useState([
    {
      startDate: new Date(today.getFullYear(), 0, 1),
      endDate: new Date(today.getFullYear(), 11, 31),
      key: "selection",
    },
  ]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    dir: "asc",
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, rowsPerPage]);

  // ==========================================================
  // Sorting
  // ==========================================================
  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? {
            key,
            dir: prev.dir === "asc" ? "desc" : "asc",
          }
        : {
            key,
            dir: "asc",
          }
    );
  };

  // ==========================================================
  // Filter
  // ==========================================================
  const filtered = departments.filter((item) => {
    const matchSearch = item.name
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchStatus = statusFilter
      ? item.status === statusFilter
      : true;

    return matchSearch && matchStatus;
  });

  // ==========================================================
  // Sort
  // ==========================================================
  const sorted = [...filtered].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aVal =
      a[sortConfig.key]?.toLowerCase?.() ?? a[sortConfig.key];

    const bVal =
      b[sortConfig.key]?.toLowerCase?.() ?? b[sortConfig.key];

    if (aVal < bVal) {
      return sortConfig.dir === "asc" ? -1 : 1;
    }

    if (aVal > bVal) {
      return sortConfig.dir === "asc" ? 1 : -1;
    }

    return 0;
  });

  // ==========================================================
  // Pagination
  // ==========================================================
  const totalEntries = sorted.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalEntries / rowsPerPage)
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginated = sorted.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage
  );

  const startEntry =
    totalEntries === 0
      ? 0
      : (safePage - 1) * rowsPerPage + 1;

  const endEntry = Math.min(
    safePage * rowsPerPage,
    totalEntries
  );

  // ==========================================================
  // Column Header
  // ==========================================================
  const ColHeader = ({ label, sortKey }) => (
    <button
      type="button"
      className="inline-flex items-center gap-0.5 font-bold text-[13px] text-gray-600 uppercase tracking-wide hover:text-orange-500 transition"
      onClick={() => sortKey && handleSort(sortKey)}
    >
      {label}

      {sortKey && (
        <span className="inline-flex flex-col ml-1 opacity-40 leading-none">
          <FiChevronUp
            size={10}
            className={
              sortConfig.key === sortKey &&
              sortConfig.dir === "asc"
                ? "opacity-100 text-orange-500"
                : ""
            }
          />

          <FiChevronDown
            size={10}
            className={
              sortConfig.key === sortKey &&
              sortConfig.dir === "desc"
                ? "opacity-100 text-orange-500"
                : ""
            }
          />
        </span>
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 font-sans">

      {/* =====================================================
          Card Header
      ====================================================== */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-200">
        <h2 className="text-base font-bold text-[#0F265C]">
          Department List
        </h2>

        <div className="flex items-center gap-2">

          {/* Date Range */}
          <DateRangePickerButton
            value={appliedRange}
            onChange={(newRange) => {
              setAppliedRange(newRange);
              setCurrentPage(1);
            }}
            defaultPreset="This Year"
          />

          {/* Status Filter */}
          <select
            className="select select-bordered select-xs text-xs h-8 min-h-0 rounded-lg bg-white text-black"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Sort By */}
          <select className="select select-bordered select-xs text-xs h-8 min-h-0 rounded-lg min-w-40 bg-white text-black">
            <option>Sort By : Last 7 Days</option>
            <option>Sort By : Last 30 Days</option>
            <option>Sort By : Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* =====================================================
          Search + Rows Per Page
      ====================================================== */}
      <div className="flex items-center justify-between gap-2 px-5 py-2.5 border-b border-gray-200 text-sm text-gray-600">

        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-[13px]">
            Row Per Page
          </span>

          <select
            className="select select-bordered select-xs h-7 min-h-0 text-xs rounded-md bg-white text-black"
            value={rowsPerPage}
            onChange={(e) =>
              setRowsPerPage(Number(e.target.value))
            }
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>

          <span>Entries</span>
        </div>

        {/* Search */}
        <label className="input input-bordered input-xs flex items-center gap-2 h-8 rounded-lg px-3 text-xs bg-white text-black">
          <FiSearch
            size={13}
            className="text-gray-400"
          />

          <input
            type="text"
            placeholder="Search departments"
            className="grow bg-transparent outline-none text-xs w-36"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {/* =====================================================
          Table
      ====================================================== */}
      <div className="overflow-x-auto">
        <table className="table table-md w-full">

          <thead className="bg-gray-50 text-gray-600 text-xs font-semibold">
            <tr>

              {/* Department */}
              <th className="bg-gray-50">
                <ColHeader
                  label="Department"
                  sortKey="name"
                />
              </th>

              {/* Description */}
              <th className="bg-gray-50">
                <ColHeader
                  label="Description"
                  sortKey="description"
                />
              </th>

              {/* Status */}
              <th className="bg-gray-50">
                <ColHeader
                  label="Status"
                  sortKey="status"
                />
              </th>

              {/* Actions */}
              <th className="bg-gray-50 text-center">
                <span className="font-bold text-[13px] text-gray-600 uppercase tracking-wide">
                  Actions
                </span>
              </th>
            </tr>
          </thead>

          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="text-center text-gray-400 py-10"
                >
                  No departments found.
                </td>
              </tr>
            ) : (
              paginated.map((dept) => (
                <tr
                  key={dept.id}
                  className="hover:bg-gray-50 transition-colors"
                >

                  {/* Department */}
                  <td>
                    <span className="text-gray-800 text-sm font-semibold hover:text-orange-500 transition cursor-pointer">
                      {dept.name}
                    </span>
                  </td>

                  {/* Description */}
                  <td className="text-gray-600 text-sm max-w-md">
                    <span
                      className="block truncate"
                      title={dept.description || ""}
                    >
                      {dept.description || "-"}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    <span
                      className={`badge badge-sm border-0 text-white font-semibold text-xs gap-1.5 px-2.5 py-0.5 ${
                        dept.status === "Active"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />

                      {dept.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="text-center">
                    <div className="flex justify-center items-center gap-2">

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() =>
                          onEditDepartment(dept)
                        }
                        className="btn btn-ghost btn-xs text-gray-400 hover:text-orange-500 hover:bg-orange-50 p-1 min-h-0 h-auto rounded"
                        title="Edit"
                      >
                        <FiEdit2 size={14} />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() =>
                          onDeleteDepartment(dept)
                        }
                        className="btn btn-ghost btn-xs text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 min-h-0 h-auto rounded"
                        title="Delete"
                      >
                        <FiTrash2 size={14} />
                      </button>

                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* =====================================================
          Footer Pagination
      ====================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-200">

        <p className="text-sm text-gray-500">
          Showing {startEntry} - {endEntry} of{" "}
          {totalEntries} entries
        </p>

        <div className="join">

          {/* Previous */}
          <button
            type="button"
            className="join-item btn btn-sm btn-ghost border border-gray-200"
            onClick={() =>
              setCurrentPage((p) =>
                Math.max(1, p - 1)
              )
            }
            disabled={safePage === 1}
          >
            ❮
          </button>

          {/* Pages */}
          {Array.from(
            { length: totalPages },
            (_, i) => i + 1
          ).map((page) => (
            <button
              type="button"
              key={page}
              className={`join-item btn btn-sm border-none ${
                page === safePage
                  ? "bg-orange-500 text-white"
                  : "btn-ghost border border-gray-200"
              }`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}

          {/* Next */}
          <button
            type="button"
            className="join-item btn btn-sm btn-ghost border border-gray-200"
            onClick={() =>
              setCurrentPage((p) =>
                Math.min(totalPages, p + 1)
              )
            }
            disabled={safePage === totalPages}
          >
            ❯
          </button>

        </div>
      </div>
    </div>
  );
};

export default DepartmentTable;

