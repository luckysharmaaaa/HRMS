import React, { useCallback, useEffect, useState } from "react";

import {
  ChevronRight,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Plus,
  LayoutList,
  LayoutGrid,
} from "lucide-react";

import EmployeeStatCards from "../components/employeeList/EmployeeStatCards";
import EmployeeTable from "../components/employeeList/EmployeeTable";
import EmployeeGrid from "../components/employeeList/EmployeeGrid";
import AddEmployeeDrawer from "../components/employeeList/AddEmployeeDrawer";
import EmployeeShiftDrawer from "../components/employeeList/EmployeeShiftDrawer";
import DeleteModal from "../components/employeeList/DeleteModal";

import {
  getEmployees,
  deleteEmployee,
} from "../services/employee.service";

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-teal-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-400",
  "bg-green-500",
  "bg-rose-400",
  "bg-cyan-500",
  "bg-yellow-500",
];

export default function EmployeeList() {
  // =========================================================
  // Employee Data
  // =========================================================

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // =========================================================
  // Fetch Employees
  // =========================================================

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);

      const res = await getEmployees();

      const employeeData = res?.data?.data;

      if (!Array.isArray(employeeData)) {
        console.warn(
          "Employee API returned unexpected data:",
          res?.data
        );

        setData([]);
        return;
      }

      const employees = employeeData.map((emp, index) => ({
        id: emp?.id,

        empId: String(emp?.employeeCode ?? ""),

        name: `${emp?.firstName ?? ""} ${emp?.lastName ?? ""}`.trim(),

        // Default avatar initials
        avatar: `${emp?.firstName?.[0] ?? ""}${emp?.lastName?.[0] ?? ""}`,

        // Default avatar color
        color: AVATAR_COLORS[index % AVATAR_COLORS.length],

        // Profile image
        avatarUrl: emp?.profileImage
          ? `http://localhost:5000/${emp.profileImage}`
          : null,

        department: String(emp?.departmentName ?? ""),

        designation: String(emp?.designationName ?? ""),

        email: String(emp?.email ?? ""),

        phone: String(emp?.phone ?? ""),

        joiningDate: emp?.joiningDate ?? null,

        status: emp?.status ? "Active" : "Inactive",

        projects: 0,

        done: 0,

        progress: 0,

        productivity: 0,
      }));

      setData(employees);
    } catch (error) {
      console.error("Failed to fetch employees:", error);

      // Keep existing data instead of unnecessarily clearing
      // the table when a refresh request fails.
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================
  // Initial API Call
  // =========================================================

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // =========================================================
  // View
  // =========================================================

  const [viewMode, setViewMode] = useState("list");

  // =========================================================
  // Filters
  // =========================================================

  const [search, setSearch] = useState("");
  const [designation, setDesignation] = useState("All Designations");
  const [status, setStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("Recently Added");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(2024, 0, 1),
      endDate: new Date(2026, 11, 31),
      key: "selection",
    },
  ]);

  // =========================================================
  // Modals / Drawers
  // =========================================================

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [shiftTarget, setShiftTarget] = useState(null);

  // =========================================================
  // Filter Employees
  // =========================================================

  const filtered = data
    .filter((employee) => {
      const q = String(search ?? "").toLowerCase();

      const matchSearch =
        String(employee?.name ?? "")
          .toLowerCase()
          .includes(q) ||
        String(employee?.empId ?? "")
          .toLowerCase()
          .includes(q) ||
        String(employee?.email ?? "")
          .toLowerCase()
          .includes(q) ||
        String(employee?.designation ?? "")
          .toLowerCase()
          .includes(q) ||
        String(employee?.department ?? "")
          .toLowerCase()
          .includes(q);

      const matchDesignation =
        designation === "All Designations" ||
        employee?.designation === designation;

      const matchStatus =
        status === "All Status" ||
        employee?.status === status;

      return matchSearch && matchDesignation && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "Ascending") {
        return String(a?.name ?? "").localeCompare(
          String(b?.name ?? "")
        );
      }

      if (sortBy === "Descending") {
        return String(b?.name ?? "").localeCompare(
          String(a?.name ?? "")
        );
      }

      return 0;
    });

  // =========================================================
  // Pagination
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / rowsPerPage)
  );

  const paginated = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // =========================================================
  // Submit Handler
  // =========================================================

  const handleSubmit = async () => {
    await fetchEmployees();

    setDrawerOpen(false);
    setEditItem(null);
  };

  // =========================================================
  // Delete Handler
  // =========================================================

  const handleDelete = async (id) => {
    try {
      await deleteEmployee(id);

      // Remove deleted employee from local state
      setData((prev) =>
        prev.filter((employee) => employee.id !== id)
      );

      // Close delete modal after successful deletion
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete employee:", error);
    }
  };

  // =========================================================
  // Reset Page When Filters Change
  // =========================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [search, designation, status, rowsPerPage]);

  // =========================================================
  // Render
  // =========================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F265C]">
            Employees List
          </h1>

          <nav className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
            <span>Employees</span>

            <ChevronRight size={12} />

            <span className="text-orange-500 font-medium">
              Employee List
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* List / Grid Toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-2.5 transition ${
                viewMode === "list"
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
              title="List View"
            >
              <LayoutList size={16} />
            </button>

            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2.5 transition ${
                viewMode === "grid"
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          {/* Export Dropdown */}
          <div className="dropdown dropdown-end">
            <label
              tabIndex={0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-sm font-semibold rounded-lg transition shadow-sm cursor-pointer"
            >
              <FileText
                size={16}
                className="text-gray-500"
              />

              <span>Export</span>

              <ChevronDown size={14} />
            </label>

            <ul
              tabIndex={0}
              className="dropdown-content menu bg-white border border-gray-100 rounded-xl shadow-xl z-50 w-48 p-1.5 mt-2"
            >
              <li>
                <a className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <FileText
                    size={16}
                    className="text-red-500 shrink-0"
                  />

                  <span className="font-medium">
                    Export as PDF
                  </span>
                </a>
              </li>

              <li>
                <a className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <FileSpreadsheet
                    size={16}
                    className="text-green-600 shrink-0"
                  />

                  <span className="font-medium">
                    Export as Excel
                  </span>
                </a>
              </li>
            </ul>
          </div>

          {/* Add Employee */}
          <button
            type="button"
            onClick={() => {
              setEditItem(null);
              setDrawerOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition shadow-sm"
          >
            <Plus size={15} />

            Add Employee
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <EmployeeStatCards data={data} />

      {/* Table / Grid */}
      {viewMode === "list" ? (
        <EmployeeTable
          paginated={paginated}
          filtered={filtered}
          search={search}
          setSearch={setSearch}
          designation={designation}
          setDesignation={setDesignation}
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
            setDrawerOpen(true);
          }}
          onDelete={(row) => {
            setDeleteTarget(row);
          }}
          onViewShift={(row) => {
            setShiftTarget(row);
          }}
        />
      ) : (
        <EmployeeGrid
          filtered={filtered}
          designation={designation}
          setDesignation={setDesignation}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onEdit={(row) => {
            setEditItem(row);
            setDrawerOpen(true);
          }}
          onDelete={(row) => {
            setDeleteTarget(row);
          }}
        />
      )}

      {/* Add / Edit Employee Drawer */}
      <AddEmployeeDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditItem(null);
        }}
        editData={editItem}
        onSubmit={handleSubmit}
      />

      {/* Delete Modal */}
      <DeleteModal
        open={!!deleteTarget}
        item={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      {/* Employee Shift Drawer */}
      <EmployeeShiftDrawer
        open={!!shiftTarget}
        employee={shiftTarget}
        onClose={() => setShiftTarget(null)}
      />
    </div>
  );
}
