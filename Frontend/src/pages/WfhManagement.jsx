import React, { useState } from "react";
import {
  ChevronRight,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Plus,
} from "lucide-react";

import { WFH_DATA } from "../components/wfhManagement/wfhData";
import WfhStatCards from "../components/wfhManagement/WfhStatCards";
import WfhTable from "../components/wfhManagement/WfhTable";
import WfhModal from "../components/wfhManagement/WfhModal";
import DeleteModal from "../components/leaveAdmin/DeleteModal";

export default function WfhManagement() {
  const [data, setData] = useState(WFH_DATA);
  const [search, setSearch] = useState("");
  const [designation, setDesignation] = useState("All Designations");
  const [shift, setShift] = useState("All Shifts");
  const [status, setStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(2025, 0, 1),
      endDate: new Date(2026, 11, 31),
      key: "selection",
    },
  ]);

  // ── Filter ──────────────────────────────────────────────────
  const filtered = data
    .filter((r) => {
      const q = search.toLowerCase();
      const matchSearch =
        r.name.toLowerCase().includes(q) ||
        r.empId.toLowerCase().includes(q) ||
        r.designation.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.shift.toLowerCase().includes(q);

      const matchDesignation =
        designation === "All Designations" || r.designation === designation;

      const matchShift = shift === "All Shifts" || r.shift === shift;

      const matchStatus = status === "All Status" || r.status === status;

      let matchDate = true;
      if (dateRange && dateRange[0]) {
        const { startDate, endDate } = dateRange[0];
        if (startDate && endDate) {
          const rowDate = new Date(r.date);
          const filterStart = new Date(startDate);
          filterStart.setHours(0, 0, 0, 0);
          const filterEnd = new Date(endDate);
          filterEnd.setHours(23, 59, 59, 999);
          matchDate = rowDate >= filterStart && rowDate <= filterEnd;
        }
      }

      return (
        matchSearch &&
        matchDesignation &&
        matchShift &&
        matchStatus &&
        matchDate
      );
    })
    .sort((a, b) => {
      if (sortBy === "Ascending") return a.name.localeCompare(b.name);
      if (sortBy === "Descending") return b.name.localeCompare(a.name);
      return 0; // Recently Added / default order
    });

  // ── Pagination ───────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  // ── Handlers ─────────────────────────────────────────────────
  const handleSubmit = (form) => {
    if (editItem) {
      setData((prev) =>
        prev.map((r) =>
          r.id === editItem.id
            ? {
                ...r,
                name: form.name,
                designation: form.designation,
                shift: form.shift,
                date: form.startDate,
                displayDate: new Date(form.startDate).toLocaleDateString(
                  "en-GB",
                  { day: "2-digit", month: "short", year: "numeric" },
                ),
                reason: form.reviewer,
              }
            : r,
        ),
      );
    } else {
      const newId = Math.max(...data.map((r) => r.id)) + 1;
      const newRecord = {
        id: newId,
        empId: `Emp-${String(newId).padStart(3, "0")}`,
        name: form.name,
        avatar: form.name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        color: "bg-orange-500",
        designation: form.designation,
        shift: form.shift,
        reason: form.reviewer,
        date: form.startDate,
        displayDate: new Date(form.startDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        status: "Pending",
      };
      setData((prev) => [newRecord, ...prev]);
    }
    setEditItem(null);
  };

  const handleDelete = (id) => {
    setData((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F265C]">Work From Home</h1>
          <nav className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
            <span>Attendance</span>
            <ChevronRight size={12} />
            <span className="text-orange-500 font-medium">
              Work From Home Management
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <div className="dropdown dropdown-end">
            <label
              tabIndex={0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-sm font-semibold rounded-lg transition shadow-sm cursor-pointer"
            >
              <FileText size={16} className="text-gray-500" />
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

          {/* Add New Request */}
          <button
            onClick={() => {
              setEditItem(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition shadow-sm"
          >
            <Plus size={15} />
            Add New Request
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <WfhStatCards data={data} />

      {/* ── WFH Table ── */}
      <WfhTable
        paginated={paginated}
        filtered={filtered}
        search={search}
        setSearch={setSearch}
        designation={designation}
        setDesignation={setDesignation}
        shift={shift}
        setShift={setShift}
        status={status}
        setStatus={setStatus}
        sortBy={sortBy}
        setSortBy={setSortBy}
        dateRange={dateRange}
        setDateRange={setDateRange}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        onEdit={(row) => {
          setEditItem(row);
          setModalOpen(true);
        }}
        onDelete={(row) => setDeleteTarget(row)}
      />

      {/* ── Modals ── */}
      <WfhModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditItem(null);
        }}
        editData={editItem}
        onSubmit={handleSubmit}
      />

      <DeleteModal
        open={!!deleteTarget}
        item={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
