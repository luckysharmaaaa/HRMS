import React from "react";
import { Search, X, Check, ChevronLeft, ChevronRight } from "lucide-react";
import ReasonTooltip from "./ReasonTooltip";

const STATUS_TABS = ["PENDING", "APPROVED", "REJECTED", "All"];
const ROWS_OPTIONS = [5, 10, 25, 50];

const STATUS_LABEL = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const STATUS_BADGE = {
  APPROVED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-200 text-gray-600",
};

// Deterministic dot color per leave type so it stays consistent across renders
const DOT_COLORS = ["bg-orange-400", "bg-sky-500", "bg-violet-500", "bg-rose-500", "bg-lime-500", "bg-amber-500"];
const dotColorFor = (leaveCode = "") => {
  const hash = leaveCode.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return DOT_COLORS[hash % DOT_COLORS.length];
};

const formatDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const initials = (first, last) => `${(first || "?")[0]}${(last || "")[0] || ""}`.toUpperCase();

// ── Leave Table (Admin/HR review) ──────────────────────────────
export default function LeaveTable({
  rows,
  loading,
  total,
  totalPages,
  leaveTypes,
  search,
  setSearch,
  leaveTypeId,
  setLeaveTypeId,
  status,
  setStatus,
  rowsPerPage,
  setRowsPerPage,
  currentPage,
  setCurrentPage,
  onApprove,
  onReject,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Status pill tabs + type filter */}
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {STATUS_TABS.map((s) => {
            const value = s === "All" ? "" : s;
            const active = status === value;
            return (
              <button
                key={s}
                onClick={() => {
                  setStatus(value);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                  active
                    ? "bg-orange-500 text-white border-orange-500"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {s === "All" ? "All" : STATUS_LABEL[s]}
              </button>
            );
          })}
        </div>

        <select
          value={leaveTypeId}
          onChange={(e) => {
            setLeaveTypeId(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:border-orange-400 bg-white"
        >
          <option value="">All Types</option>
          {leaveTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.leaveName}
            </option>
          ))}
        </select>
      </div>

      {/* Toolbar second row */}
      <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Rows per page</span>
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
        </div>
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 w-52">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search employee..."
            className="outline-none text-sm flex-1 placeholder-gray-400 bg-transparent"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
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
              <th className="px-4 py-3 font-semibold">Employee</th>
              <th className="px-4 py-3 font-semibold">Leave Type</th>
              <th className="px-4 py-3 font-semibold">Start Date</th>
              <th className="px-4 py-3 font-semibold">End Date</th>
              <th className="px-4 py-3 font-semibold">No of Days</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                  No leave records found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-orange-50/30 transition group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                        {initials(row.firstName, row.lastName)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">
                          {row.firstName} {row.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{row.employeeCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dotColorFor(row.leaveCode)}`} />
                      <span className="text-gray-700 font-medium text-sm">{row.leaveName}</span>
                      <ReasonTooltip reason={row.reason} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{formatDate(row.startDate)}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{formatDate(row.endDate)}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {row.totalDays} {Number(row.totalDays) === 1 ? "Day" : "Days"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        STATUS_BADGE[row.leaveStatus] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {STATUS_LABEL[row.leaveStatus] || row.leaveStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.leaveStatus === "PENDING" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onApprove(row)}
                          title="Approve"
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition"
                        >
                          <Check size={14} strokeWidth={3} />
                        </button>
                        <button
                          onClick={() => onReject(row)}
                          title="Reject"
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition"
                        >
                          <X size={14} strokeWidth={3} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between text-sm text-gray-500">
        <span>
          Showing {Math.min((currentPage - 1) * rowsPerPage + 1, total)}–
          {Math.min(currentPage * rowsPerPage, total)} of {total} entries
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
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition ${
                page === currentPage
                  ? "bg-orange-500 text-white shadow-sm"
                  : "border border-gray-200 hover:bg-gray-50 text-gray-600"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}