import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
} from "lucide-react";
import DateRangePickerButton from "../user/DateRangePickerButton";
import {
  DESIGNATIONS,
  STATUSES,
  SORT_OPTIONS,
  ROWS_OPTIONS,
} from "./employeeData";
const API_BASE_URL = "http://localhost:5000";


function formatJoiningDate(rawDate) {
  if (!rawDate) return "-";

  const datePart = String(rawDate).split(" ")[0]; // strip any time component
  const parsed = new Date(datePart);

  if (isNaN(parsed.getTime())) return rawDate; // unparsable, show as-is

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function EmployeeTable({
  paginated,
  filtered,
  search,
  setSearch,
  designation,
  setDesignation,
  status,
  setStatus,
  sortBy,
  setSortBy,
  dateRange,
  setDateRange,
  rowsPerPage,
  setRowsPerPage,
  currentPage,
  setCurrentPage,
  totalPages,
  onEdit,
  onViewShift,
  onDelete,
}) {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Toolbar top row */}
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-gray-700">Employee List</h2>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePickerButton
            value={dateRange}
            onChange={(r) => {
              setDateRange(r);
              setCurrentPage(1);
            }}
          />
          <select
            value={designation}
            onChange={(e) => {
              setDesignation(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:border-orange-400 bg-white"
          >
            {DESIGNATIONS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:border-orange-400 bg-white"
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:border-orange-400 bg-white"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                Sort By : {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row per page + Search */}
      <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Row Per Page</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-orange-400 bg-white"
          >
            {ROWS_OPTIONS.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
          <span>Entries</span>
        </div>
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 w-52">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search"
            className="outline-none text-sm flex-1 placeholder-gray-400 bg-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50/60">
              <th className="px-4 py-3 font-semibold w-14">Serial No.</th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Department</th>
              <th className="px-4 py-3 font-semibold">Designation</th>
              <th className="px-4 py-3 font-semibold">Joining Date</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-center">View</th>
              <th className="px-4 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="text-center py-12 text-gray-400 text-sm"
                >
                  No employee records found.
                </td>
              </tr>
            ) : (
              paginated.map((row, index) => {
                // Sequential serial number that stays correct across pages
                const serialNo =
                  (currentPage - 1) * rowsPerPage + index + 1;

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-orange-50/30 transition group"
                  >
                    {/* Serial No. — narrow fixed-width column, centered */}
                    <td className="px-4 py-3 text-gray-600 text-sm font-medium text-center w-14">
                      {serialNo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 shadow-sm"
                        >
                          {row.avatarUrl ? (
                            <img
                              src={row.avatarUrl}
                              alt={`${row.name || "Employee"} profile`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div
                              className={`w-full h-full ${row.color || "bg-orange-500"
                                } flex items-center justify-center text-white text-xs font-bold`}
                            >
                              {row.avatar ||
                                row.name?.charAt(0)?.toUpperCase() ||
                                "U"}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">
                            {row.name}
                          </p>
                          {/* Employee ID shown subtly below the name */}
                          <p className="text-xs text-gray-400">
                            {row.empId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-600 text-sm">{row.email}</p>
                      {/* Phone number shown subtly below the email */}
                      <p className="text-xs text-gray-400">{row.phone}</p>
                    </td>
                    {/* Department now has its own column, placed before Designation */}
                    <td className="px-4 py-3 text-gray-500 text-sm">
                      {row.department}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 bg-gray-50">
                        {row.designation}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm">
                      {formatJoiningDate(row.joiningDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${row.status === "Active"
                          ? "bg-green-50 text-green-600 border border-green-200"
                          : "bg-red-50 text-red-500 border border-red-200"
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${row.status === "Active" ? "bg-green-500" : "bg-red-500"}`}
                        />
                        {row.status}
                      </span>
                    </td>
                    {/* View */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(`/employee/${row.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold transition border border-blue-100"
                        title="View Profile"
                      >
                        <Eye size={13} />
                        View
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                         onClick={() => onViewShift(row)}
                           className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-500 transition"
                                                  title="Shift"
                        >
                                                  <Clock size={15} />
                                                </button>
                      <button
                        onClick={() => onEdit(row)}
                        className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-500 hover:text-orange-500 transition"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => onDelete(row)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                  </tr>
          );
              })
            )}
        </tbody>
      </table>
    </div>

      {/* Pagination */ }
  <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between text-sm text-gray-500">
    <span>
      Showing{" "}
      {filtered.length === 0
        ? 0
        : Math.min((currentPage - 1) * rowsPerPage + 1, filtered.length)}
      –{Math.min(currentPage * rowsPerPage, filtered.length)} of{" "}
      {filtered.length} entries
    </span>
    <div className="flex items-center gap-1">
      <button
        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft size={14} />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition ${page === currentPage
            ? "bg-orange-500 text-white shadow-sm"
            : "border border-gray-200 hover:bg-gray-50 text-gray-600"
            }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
        disabled={currentPage === totalPages || totalPages === 0}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  </div>
    </div >
  );
}
