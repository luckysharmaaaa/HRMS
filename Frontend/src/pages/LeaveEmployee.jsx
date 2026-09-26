import React, { useState, useEffect, useCallback } from "react";
import { ChevronRight, FileText, FileSpreadsheet, ChevronDown, Plus } from "lucide-react";

import AddLeaveModal from "../components/leaveEmployee/AddLeaveModal";
import LeaveStatCardsEmployee from "../components/leaveEmployee/LeaveStatCardsEmployee";
import LeaveTableEmployee from "../components/leaveEmployee/LeaveTableEmployee";
import DeleteModal from "../components/leaveAdmin/DeleteModal";
import {
  getLeaveTypes,
  getMyApplications,
  cancelApplication,
} from "../services/leaveService";

const LeaveEmployee = () => {
  const [modalOpen, setModalOpen] = useState(false);
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
  const [editItem, setEditItem] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  useEffect(() => {
    getLeaveTypes().then(setLeaveTypes).catch(() => {});
  }, []);

  const fetchApplications = useCallback(() => {
    setLoading(true);
    getMyApplications({
      page: currentPage,
      limit: rowsPerPage,
      leaveTypeId: leaveTypeId || undefined,
      status: status || undefined,
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
  }, [currentPage, rowsPerPage, leaveTypeId, status]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleModalSubmit = () => {
    fetchApplications();
  };

  const handleCancel = async (id) => {
    try {
      await cancelApplication(id);
      fetchApplications();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to cancel leave request.");
    }
  };

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0F265C]">Leaves</h1>

            <nav className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
              <span>Attendance</span>
              <ChevronRight size={12} />
              <span className="text-orange-500 font-medium">
                {"Leaves(Employee)"}
              </span>
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
                    <FileSpreadsheet
                      size={16}
                      className="text-green-600 shrink-0"
                    />
                    <span className="font-medium">Export as Excel</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Add Leave */}
            <button
              onClick={() => {
                setEditItem(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition shadow-sm"
            >
              <Plus size={15} />
              Apply Leave
            </button>
          </div>
        </div>
        <LeaveStatCardsEmployee />
        {/* Table */}
        <LeaveTableEmployee
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
          onEdit={(row) => {
            setEditItem(row);
            setModalOpen(true);
          }}
          onCancel={(row) => setCancelTarget(row)}
        />
      </div>

      {/* Add/Edit Leave Modal */}
      <AddLeaveModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditItem(null);
        }}
        onSubmit={handleModalSubmit}
        editData={editItem}
      />

      <DeleteModal
        open={!!cancelTarget}
        item={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel Leave Request?"
        message={
          cancelTarget && (
            <>
              This will cancel your {cancelTarget.leaveName} request. This
              can't be undone.
            </>
          )
        }
        confirmLabel="Yes, Cancel"
        confirmColor="orange"
      />
    </div>
  );
};

export default LeaveEmployee;