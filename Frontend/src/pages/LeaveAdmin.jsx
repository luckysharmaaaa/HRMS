import React, { useState, useEffect, useCallback } from "react";
import { ChevronRight, FileText, FileSpreadsheet, ChevronDown } from "lucide-react";

import LeaveStatCards from "../components/leaveAdmin/LeaveStatCards";
import LeaveTable from "../components/leaveAdmin/LeaveTable";
import ApproveRejectModal from "../components/leaveAdmin/ApproveRejectModal";
import {
  getLeaveTypes,
  getAdminApplications,
  approveApplication,
  rejectApplication,
} from "../services/leaveService";

// ── Main LeaveAdmin Page ──────────────────────────────────────
export default function LeaveAdmin() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);

  const [search, setSearch] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [status, setStatus] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewMode, setReviewMode] = useState("approve");

  useEffect(() => {
    getLeaveTypes().then(setLeaveTypes).catch(() => {});
  }, []);

  const fetchApplications = useCallback(() => {
    setLoading(true);
    getAdminApplications({
      page: currentPage,
      limit: rowsPerPage,
      leaveTypeId: leaveTypeId || undefined,
      status: status || undefined,
      search: search || undefined,
    })
      .then((data) => {
        setRows(data.data);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages || 1);
      })
      .catch(() => {
        setRows([]);
        setTotal(0);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [currentPage, rowsPerPage, leaveTypeId, status, search]);

  useEffect(() => {
    const timer = setTimeout(fetchApplications, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [fetchApplications, search]);

  const handleReviewConfirm = async (id, remarks) => {
    if (reviewMode === "approve") {
      await approveApplication(id, remarks);
    } else {
      await rejectApplication(id, remarks);
    }
    fetchApplications();
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F265C]">Leaves</h1>
          <nav className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
            <span>Attendance</span>
            <ChevronRight size={12} />
            <span className="text-orange-500 font-medium">{"Leaves(Admin)"}</span>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <div className="dropdown dropdown-end">
            <label
              tabIndex={0}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition shadow-sm cursor-pointer"
            >
              <FileText size={16} />
              <span>Export</span>
              <ChevronDown size={14} />
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-white border border-gray-100 rounded-xl shadow-xl z-50 w-48 p-1.5 mt-2"
            >
              <li>
                <a className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <FileText size={16} className="text-red-500 shrink-0" />
                  <span className="font-medium">Export as PDF</span>
                </a>
              </li>
              <li>
                <a className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <FileSpreadsheet size={16} className="text-green-600 shrink-0" />
                  <span className="font-medium">Export as Excel</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <LeaveStatCards />

      {/* ── Leave Table ── */}
      <LeaveTable
        rows={rows}
        loading={loading}
        total={total}
        totalPages={totalPages}
        leaveTypes={leaveTypes}
        search={search}
        setSearch={setSearch}
        leaveTypeId={leaveTypeId}
        setLeaveTypeId={setLeaveTypeId}
        status={status}
        setStatus={setStatus}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onApprove={(row) => {
          setReviewMode("approve");
          setReviewTarget(row);
        }}
        onReject={(row) => {
          setReviewMode("reject");
          setReviewTarget(row);
        }}
      />

      <ApproveRejectModal
        open={!!reviewTarget}
        mode={reviewMode}
        item={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onConfirm={handleReviewConfirm}
      />
    </div>
  );
}