import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  X,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Clock,
  ClipboardEdit,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-toastify";

import DateRangePickerButton from "../user/DateRangePickerButton";
import EditAttendanceModal from "./EditAttendanceModal";
import Can from "../rbac/Can";

import {
  getAdminAttendance,
  getDepartments,
  updateAdminAttendance,
} from "../../services/attendanceAdminApi";

const ROWS_OPTIONS = [10, 20, 50];

// "Late" is translated server-side to:
// attendanceStatus=PRESENT + isLate=1
const STATUS_OPTIONS = [
  "Present",
  "Absent",
  "Half Day",
  "On Leave",
  "Holiday",
  "Weekend",
  "Work From Home",
  "Late",
];

// ============================================================
// DATE HELPERS
// ============================================================

const toDateStr = (d) => {
  if (!d || Number.isNaN(d.getTime())) {
    return undefined;
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// ============================================================
// TIME FORMAT
// ============================================================

const fmtTime = (value) => {
  if (!value || value === "-") {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// ============================================================
// MINUTES FORMAT
// ============================================================

const fmtMins = (mins) => {
  if (mins === null || mins === undefined) {
    return "-";
  }

  if (mins <= 0) {
    return "0 Min";
  }

  const h = Math.floor(mins / 60);
  const m = mins % 60;

  return h > 0 ? `${h}h ${m}m` : `${m} Min`;
};

// ============================================================
// HOURS FORMAT
// ============================================================

const fmtHours = (mins) => {
  return mins || mins === 0
    ? `${(mins / 60).toFixed(2)} Hrs`
    : "0.00 Hrs";
};

// ============================================================
// DISPLAY DATE
// ============================================================

const formatDisplayDate = (dateStr) => {
  if (!dateStr) {
    return "";
  }

  const [y, m, d] = dateStr.split("-").map(Number);

  const date = new Date(y, m - 1, d);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// ============================================================
// STATUS DISPLAY
// ============================================================

const displayStatus = (row) => {
  if (row.hasNoRecord) {
    return "No Record";
  }

  if (
    row.attendanceStatus === "PRESENT" &&
    Number(row.isLate) === 1
  ) {
    return "Late";
  }

  const map = {
    PRESENT: "Present",
    ABSENT: "Absent",
    HALF_DAY: "Half Day",
    ON_LEAVE: "On Leave",
    HOLIDAY: "Holiday",
    WEEKEND: "Weekend",
    WORK_FROM_HOME: "Work From Home",
  };

  return map[row.attendanceStatus] || row.attendanceStatus || "Unknown";
};

// ============================================================
// STATUS BADGE
// ============================================================

const statusBadgeClasses = (row) => {
  if (row.hasNoRecord) {
    return "bg-gray-100 text-gray-500";
  }

  if (
    row.attendanceStatus === "PRESENT" &&
    Number(row.isLate) === 1
  ) {
    return "bg-amber-100 text-amber-700";
  }

  if (row.attendanceStatus === "PRESENT") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (row.attendanceStatus === "HALF_DAY") {
    return "bg-yellow-100 text-yellow-700";
  }

  if (row.attendanceStatus === "ON_LEAVE") {
    return "bg-blue-100 text-blue-700";
  }

  if (
    row.attendanceStatus === "HOLIDAY" ||
    row.attendanceStatus === "WEEKEND"
  ) {
    return "bg-purple-100 text-purple-700";
  }

  if (row.attendanceStatus === "WORK_FROM_HOME") {
    return "bg-cyan-100 text-cyan-700";
  }

  return "bg-red-100 text-red-700";
};

// ============================================================
// STATUS DOT
// ============================================================

const statusDotClasses = (row) => {
  if (row.hasNoRecord) {
    return "bg-gray-400";
  }

  if (
    row.attendanceStatus === "PRESENT" &&
    Number(row.isLate) === 1
  ) {
    return "bg-amber-500";
  }

  if (row.attendanceStatus === "PRESENT") {
    return "bg-emerald-500";
  }

  if (row.attendanceStatus === "HALF_DAY") {
    return "bg-yellow-500";
  }

  if (row.attendanceStatus === "ON_LEAVE") {
    return "bg-blue-500";
  }

  if (
    row.attendanceStatus === "HOLIDAY" ||
    row.attendanceStatus === "WEEKEND"
  ) {
    return "bg-purple-500";
  }

  if (row.attendanceStatus === "WORK_FROM_HOME") {
    return "bg-cyan-500";
  }

  return "bg-red-500";
};

// ============================================================
// INITIALS
// ============================================================

const initials = (first, last) => {
  return `${(first || "?")[0] ?? ""}${(last || "")[0] ?? ""}`.toUpperCase();
};

// ============================================================
// AVATAR COLORS
// ============================================================

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-cyan-500",
  "bg-orange-700",
  "bg-slate-700",
  "bg-pink-500",
  "bg-purple-500",
  "bg-emerald-600",
  "bg-red-500",
];

const avatarColorFor = (id) => {
  const numericId = Number(id) || 0;

  return AVATAR_COLORS[numericId % AVATAR_COLORS.length];
};

// ============================================================
// PARSE TIME -> MYSQL DATETIME
// ============================================================

const parseTimeToMySQL = (dateStr, timeStr) => {
  if (!dateStr || !timeStr || timeStr === "-") {
    return null;
  }

  const value = String(timeStr).trim();

  let hours;
  let minutes;

  // ----------------------------------------------------------
  // 24-HOUR FORMAT
  // ----------------------------------------------------------

  const time24Match = value.match(/^(\d{1,2}):(\d{2})$/);

  if (time24Match) {
    hours = Number(time24Match[1]);
    minutes = Number(time24Match[2]);

    if (
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    return `${dateStr} ${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:00`;
  }

  // ----------------------------------------------------------
  // 12-HOUR FORMAT
  // ----------------------------------------------------------

  const time12Match = value.match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
  );

  if (time12Match) {
    hours = Number(time12Match[1]);
    minutes = Number(time12Match[2]);

    const period = time12Match[3].toUpperCase();

    if (
      hours < 1 ||
      hours > 12 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    if (period === "AM" && hours === 12) {
      hours = 0;
    }

    if (period === "PM" && hours !== 12) {
      hours += 12;
    }

    return `${dateStr} ${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:00`;
  }

  return null;
};

// ============================================================
// REVERSE STATUS MAP
// ============================================================
//
// NOTE: "Late" is intentionally absent here. It is not a real
// attendanceStatus value — it is derived from
// (attendanceStatus === "PRESENT" && isLate === 1). If
// EditAttendanceModal ever offers "Late" as a savable status,
// this map will silently drop the status field from the update
// payload (see the guard in handleSaveAttendance). Confirm with
// EditAttendanceModal.jsx whether "Late" is meant to be editable;
// if so it needs to set { attendanceStatus: "PRESENT", isLate: 1 }
// instead of going through this map.
// ============================================================

const REVERSE_STATUS_MAP = {
  Present: "PRESENT",
  Absent: "ABSENT",
  "Half Day": "HALF_DAY",
  "On Leave": "ON_LEAVE",
  Holiday: "HOLIDAY",
  Weekend: "WEEKEND",
  "Work From Home": "WORK_FROM_HOME",
};

// ============================================================
// REGULARIZATION STATUS
// ============================================================
//
// Supports common backend response shapes:
//
// row.regularizationStatus
// row.regularization?.status
// row.regularizationRequest?.status
// row.regularization?.regularizationStatus
//
// Expected values:
//
// PENDING
// APPROVED
// REJECTED
//
// ============================================================

const getRegularizationStatus = (row) => {
  const status =
    row?.regularizationStatus ??
    row?.regularization?.status ??
    row?.regularization?.regularizationStatus ??
    row?.regularizationRequest?.status ??
    row?.regularizationRequest?.regularizationStatus ??
    row?.regularization?.requestStatus ??
    row?.requestStatus;

  if (!status) {
    return null;
  }

  return String(status).trim().toUpperCase();
};

// ============================================================
// REGULARIZATION ACTION
// ============================================================

const getRegularizationAction = (row) => {
  const status = getRegularizationStatus(row);

  if (status === "APPROVED") {
    return "APPROVED";
  }

  if (status === "PENDING") {
    return "PENDING";
  }

  if (status === "REJECTED") {
    return "REJECTED";
  }

  return "NONE";
};

// ============================================================
// COMPONENT
// ============================================================

const AttendanceAdminTable = ({ onFiltersChange }) => {
  // ----------------------------------------------------------
  // FILTER STATE
  // ----------------------------------------------------------

  const [search, setSearch] = useState("");

  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const [editEmployee, setEditEmployee] = useState(null);

  const [departments, setDepartments] = useState([]);

  const [departmentId, setDepartmentId] = useState("");

  const [status, setStatus] = useState("");

  // ----------------------------------------------------------
  // PAGINATION
  // ----------------------------------------------------------

  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [currentPage, setCurrentPage] = useState(1);

  // ----------------------------------------------------------
  // DATA
  // ----------------------------------------------------------

  const [rows, setRows] = useState([]);

  const [total, setTotal] = useState(0);

  const [resolvedDate, setResolvedDate] = useState(null);

  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------------
  // SESSION-ONLY "RECENTLY EDITED BY ADMIN" HIGHLIGHT
  // ----------------------------------------------------------
  //
  // Tracks attendance record IDs the admin has just saved a change
  // for, in this component's lifetime only. This is intentionally
  // NOT persisted anywhere (no localStorage, no backend flag) — it
  // resets as soon as the admin navigates away or reloads the page.
  //
  // ----------------------------------------------------------

  const [recentlyEditedIds, setRecentlyEditedIds] = useState(
    () => new Set()
  );

  // ==========================================================
  // LOAD DEPARTMENTS
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    getDepartments()
      .then((list) => {
        if (cancelled) {
          return;
        }

        setDepartments(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Failed to load departments");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================================
  // BUILD CURRENT FILTERS
  // ==========================================================

  const getCurrentFilters = useCallback(() => {
    const startDate = dateRange[0]?.startDate
      ? toDateStr(new Date(dateRange[0].startDate))
      : undefined;

    const endDate = dateRange[0]?.endDate
      ? toDateStr(new Date(dateRange[0].endDate))
      : undefined;

    return {
      startDate,
      endDate,
      departmentId: departmentId || undefined,
      status: status || undefined,
      search: search.trim() || undefined,
    };
  }, [dateRange, departmentId, status, search]);

  // ==========================================================
  // SEND FILTERS TO PARENT
  // ==========================================================

  useEffect(() => {
    if (typeof onFiltersChange !== "function") {
      return;
    }

    onFiltersChange(getCurrentFilters());
  }, [getCurrentFilters, onFiltersChange]);

  // ==========================================================
  // LOAD ATTENDANCE
  // ==========================================================

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const filters = getCurrentFilters();

      const res = await getAdminAttendance({
        page: currentPage,
        limit: rowsPerPage,
        ...filters,
      });

      const nextRows = Array.isArray(res?.data) ? res.data : [];

      setRows(nextRows);

      setTotal(Number(res?.pagination?.total || 0));

      setResolvedDate(res?.date ?? null);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to load attendance"
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, getCurrentFilters]);

  // ==========================================================
  // FETCH WHEN DEPENDENCIES CHANGE
  // ==========================================================

  useEffect(() => {
    load();
  }, [load]);

  // ==========================================================
  // RESET PAGE WHEN FILTER CHANGES
  // ==========================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [
    dateRange,
    departmentId,
    status,
    search,
    rowsPerPage,
  ]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(total / rowsPerPage)
  );

  // ==========================================================
  // DATE LABEL
  // ==========================================================

  const todayStr = toDateStr(new Date());

  const dateLabel = resolvedDate
    ? resolvedDate === todayStr
      ? `Today — ${formatDisplayDate(resolvedDate)}`
      : formatDisplayDate(resolvedDate)
    : dateRange[0]?.startDate && dateRange[0]?.endDate
    ? `${formatDisplayDate(
        toDateStr(new Date(dateRange[0].startDate))
      )} – ${formatDisplayDate(
        toDateStr(new Date(dateRange[0].endDate))
      )}`
    : "";

  // ==========================================================
  // SAVE EDITED ATTENDANCE
  // ==========================================================

  const handleSaveAttendance = async (updatedEmployee) => {
    if (!editEmployee?.id) {
      toast.error(
        "This employee has no attendance record yet for this date to edit."
      );

      return false;
    }

    const payload = {};

    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    if (
      updatedEmployee.status &&
      REVERSE_STATUS_MAP[updatedEmployee.status]
    ) {
      payload.attendanceStatus =
        REVERSE_STATUS_MAP[updatedEmployee.status];
    }

    // --------------------------------------------------------
    // CHECK IN
    // --------------------------------------------------------

    if (updatedEmployee.checkIn !== undefined) {
      if (
        updatedEmployee.checkIn === "-" ||
        !updatedEmployee.checkIn
      ) {
        payload.checkIn = null;
      } else {
        const mysqlDateTime = parseTimeToMySQL(
          editEmployee.attendanceDate,
          updatedEmployee.checkIn
        );

        if (!mysqlDateTime) {
          toast.error("Please enter a valid Check In time.");

          return false;
        }

        payload.checkIn = mysqlDateTime;
      }
    }

    // --------------------------------------------------------
    // CHECK OUT
    // --------------------------------------------------------

    if (updatedEmployee.checkOut !== undefined) {
      if (
        updatedEmployee.checkOut === "-" ||
        !updatedEmployee.checkOut
      ) {
        payload.checkOut = null;
      } else {
        const mysqlDateTime = parseTimeToMySQL(
          editEmployee.attendanceDate,
          updatedEmployee.checkOut
        );

        if (!mysqlDateTime) {
          toast.error("Please enter a valid Check Out time.");

          return false;
        }

        payload.checkOut = mysqlDateTime;
      }
    }

    // --------------------------------------------------------
    // REMARKS
    // --------------------------------------------------------

    if (updatedEmployee.notes !== undefined) {
      payload.remarks = updatedEmployee.notes || null;
    }

    // --------------------------------------------------------
    // DO NOT SEND EMPTY PAYLOAD
    // --------------------------------------------------------

    if (Object.keys(payload).length === 0) {
      toast.info("No attendance changes were made.");

      return false;
    }

    // --------------------------------------------------------
    // UPDATE API
    // --------------------------------------------------------

    try {
      await updateAdminAttendance(
        editEmployee.id,
        payload
      );

      toast.success(
        "Attendance updated successfully"
      );

      // ------------------------------------------------------
      // MARK THIS RECORD AS RECENTLY EDITED (SESSION ONLY)
      // ------------------------------------------------------

      setRecentlyEditedIds((previous) => {
        const next = new Set(previous);

        next.add(editEmployee.id);

        return next;
      });

      // ------------------------------------------------------
      // CLOSE MODAL
      // ------------------------------------------------------

      setEditEmployee(null);

      // ------------------------------------------------------
      // RELOAD TABLE
      // ------------------------------------------------------

      await load();

      return true;
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to update attendance"
      );

      return false;
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6">

        {/* ==================================================
            TOOLBAR TOP ROW
        ================================================== */}

        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">

          <div>
            <h2 className="text-base font-bold text-[#0F265C]">
              Admin Attendance
            </h2>

            {dateLabel && (
              <p className="text-xs text-orange-500 font-medium mt-0.5">
                Showing: {dateLabel}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">

            {/* DATE RANGE */}

            <DateRangePickerButton
              value={dateRange}
              onChange={setDateRange}
            />

            {/* DEPARTMENT */}

            <select
              value={departmentId}
              onChange={(e) =>
                setDepartmentId(e.target.value)
              }
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:border-orange-400 bg-white"
            >
              <option value="">
                Department
              </option>

              {departments.map((department) => (
                <option
                  key={department.id}
                  value={department.id}
                >
                  {department.name}
                </option>
              ))}
            </select>

            {/* STATUS */}

            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:border-orange-400 bg-white"
            >
              <option value="">
                Select Status
              </option>

              {STATUS_OPTIONS.map((statusOption) => (
                <option
                  key={statusOption}
                  value={statusOption}
                >
                  {statusOption}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ==================================================
            TOOLBAR SECOND ROW
        ================================================== */}

        <div className="px-5 py-3 border-b border-gray-50 flex flex-wrap items-center justify-between gap-3">

          {/* ROW COUNT */}

          <div className="flex items-center gap-2 text-sm text-gray-500">

            <span>
              Row Per Page
            </span>

            <select
              value={rowsPerPage}
              onChange={(e) =>
                setRowsPerPage(
                  Number(e.target.value)
                )
              }
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-orange-400 bg-white"
            >
              {ROWS_OPTIONS.map((number) => (
                <option
                  key={number}
                  value={number}
                >
                  {number}
                </option>
              ))}
            </select>

            <span>
              Entries
            </span>
          </div>

          {/* SEARCH */}

          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 w-52">

            <Search
              size={14}
              className="text-gray-400 shrink-0"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search"
              className="outline-none text-sm flex-1 placeholder-gray-400 bg-transparent"
            />

            {search && (
              <button
                onClick={() =>
                  setSearch("")
                }
                className="text-gray-400 hover:text-gray-600"
                type="button"
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* ==================================================
            TABLE
        ================================================== */}

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead>
              <tr className="text-left text-xs font-bold text-gray-700 bg-gray-50/60 border-b border-gray-100">

                <th className="px-4 py-4">
                  Employee
                </th>

                <th className="px-4 py-4">
                  Date
                </th>

                <th className="px-4 py-4">
                  Status
                </th>

                <th className="px-4 py-4">
                  Check In
                </th>

                <th className="px-4 py-4">
                  Check Out
                </th>

                <th className="px-4 py-4">
                  Break
                </th>

                <th className="px-4 py-4">
                  Late
                </th>

                <th className="px-4 py-4">
                  Production Hours
                </th>

                <th className="px-4 py-4 text-right pr-8">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">

              {/* LOADING */}

              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-12 text-gray-400 text-sm"
                  >
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-12 text-gray-400 text-sm"
                  >
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const rowKey =
                    row.id ??
                    `noattendance-${row.employeeId}`;

                  const regularizationAction =
                    getRegularizationAction(row);

                  const isRegularized =
                    regularizationAction === "APPROVED";

                  const isPending =
                    regularizationAction === "PENDING";

                  // ==========================================
                  // RECENTLY EDITED BY ADMIN (SESSION ONLY)
                  // ==========================================
                  //
                  // Only meaningful for rows that actually have
                  // an attendance id (row.id is null for
                  // "no record yet" roster rows, which can't be
                  // edited in the first place).
                  //
                  // ==========================================

                  const isRecentlyEdited =
                    row.id != null &&
                    recentlyEditedIds.has(row.id);

                  return (
                    <tr
                      key={rowKey}
                      className={`group transition-all duration-200 ${
                        isRegularized
                          ? "bg-emerald-50/30 hover:bg-emerald-50/60 border-l-2 border-l-emerald-400"
                          : isRecentlyEdited
                          ? "bg-indigo-50/30 hover:bg-indigo-50/60 border-l-2 border-l-indigo-400"
                          : "hover:bg-gray-50/50 border-l-2 border-l-transparent"
                      }`}
                    >

                      {/* EMPLOYEE */}

                      <td className="px-4 py-3">

                        <div className="flex items-center gap-3">

                          <div
                            className={`w-9 h-9 rounded-full ${avatarColorFor(
                              row.employeeId
                            )} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}
                          >
                            {initials(
                              row.firstName,
                              row.lastName
                            )}
                          </div>

                          <div className="min-w-0">

                            <div className="flex items-center gap-2 flex-wrap">

                              <p className="font-semibold text-gray-800 text-sm">
                                {row.firstName}{" "}
                                {row.lastName}
                              </p>

                              {isRegularized && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-semibold whitespace-nowrap"
                                  title="This attendance has been regularized"
                                >
                                  <CheckCircle2 size={10} />
                                  Regularized
                                </span>
                              )}

                              {isRecentlyEdited && !isRegularized && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-semibold whitespace-nowrap"
                                  title="Edited by admin this session"
                                >
                                  <Pencil size={10} />
                                  Edited
                                </span>
                              )}

                            </div>

                            <p className="text-xs text-gray-400 mt-0.5">
                              {row.departmentName || "-"}
                            </p>

                          </div>
                        </div>
                      </td>

                      {/* DATE */}

                      <td className="px-4 py-3 text-gray-500 text-sm whitespace-nowrap">
                        {formatDisplayDate(
                          row.attendanceDate ||
                            resolvedDate
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="px-4 py-3">

                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${statusBadgeClasses(
                            row
                          )}`}
                        >
                          <span
                            className={`w-1 h-1 rounded-full ${statusDotClasses(
                              row
                            )}`}
                          />

                          {displayStatus(row)}
                        </span>
                      </td>

                      {/* CHECK IN */}

                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {fmtTime(row.checkIn)}
                      </td>

                      {/* CHECK OUT */}

                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {fmtTime(row.checkOut)}
                      </td>

                      {/* BREAK */}

                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {row.shiftBreakMinutes
                          ? fmtMins(
                              row.shiftBreakMinutes
                            )
                          : "-"}
                      </td>

                      {/* LATE */}

                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {row.isLate
                          ? fmtMins(
                              row.lateMinutes
                            )
                          : "-"}
                      </td>

                      {/* PRODUCTION HOURS */}

                      <td className="px-4 py-3">

                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-white ${
                            row.hasNoRecord ||
                            row.attendanceStatus !==
                              "PRESENT"
                              ? "bg-red-500"
                              : row.overtimeMins > 0
                              ? "bg-blue-500"
                              : "bg-emerald-500"
                          }`}
                        >
                          <Clock size={12} />

                          {fmtHours(
                            row.workDurationMins
                          )}
                        </span>
                      </td>

                      {/* ACTION */}

                      <td className="px-4 py-3 text-right pr-8">

                        <div className="flex items-center justify-end">

                          {/* =================================
                              APPROVED / REGULARIZED
                          ================================= */}

                          {isRegularized ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold whitespace-nowrap"
                              title="Regularization approved"
                            >
                              <CheckCircle2 size={14} />

                              Regularized
                            </span>
                          ) : row.hasNoRecord ? (

                            /* =================================
                               NO ATTENDANCE RECORD
                            ================================= */

                            <span className="text-[11px] text-gray-300 italic pr-1">
                              Nothing to edit
                            </span>

                          ) : (

                            /* =================================
                               PENDING / REJECTED / NONE
                               RBAC: only users with
                               attendance-admin:edit see this
                               button. Everyone else (e.g. a
                               view-only role) sees the row but
                               cannot open the edit modal.
                            ================================= */

                            <Can module="attendance-admin" action="edit">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditEmployee(row)
                                }
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
                                  isPending
                                    ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                                    : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600"
                                }`}
                                title={
                                  isPending
                                    ? "Edit pending regularization"
                                    : regularizationAction ===
                                      "REJECTED"
                                    ? "Submit regularization again"
                                    : "Regularize attendance"
                                }
                              >
                                {isPending ? (
                                  <Pencil size={13} />
                                ) : (
                                  <ClipboardEdit size={13} />
                                )}

                                {isPending
                                  ? "Edit"
                                  : "Regularize"}
                              </button>
                            </Can>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ==================================================
            PAGINATION
        ================================================== */}

        <div className="px-5 py-3 border-t border-gray-50 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">

          <span>
            Showing{" "}
            {total === 0
              ? 0
              : Math.min(
                  (currentPage - 1) *
                    rowsPerPage +
                    1,
                  total
                )}{" "}
            -{" "}
            {Math.min(
              currentPage * rowsPerPage,
              total
            )}{" "}
            of {total} entries
          </span>

          <div className="flex items-center gap-1">

            {/* PREVIOUS */}

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) =>
                  Math.max(page - 1, 1)
                )
              }
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>

            {/* PAGE NUMBERS */}

            {Array.from(
              {
                length: totalPages,
              },
              (_, index) => index + 1
            ).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() =>
                  setCurrentPage(page)
                }
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition ${
                  page === currentPage
                    ? "bg-orange-500 text-white shadow-sm border-orange-500"
                    : "border border-gray-200 hover:bg-gray-50 text-gray-600"
                }`}
              >
                {page}
              </button>
            ))}

            {/* NEXT */}

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(
                    page + 1,
                    totalPages
                  )
                )
              }
              disabled={
                currentPage === totalPages
              }
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================
          EDIT ATTENDANCE MODAL
      ==================================================== */}

      <EditAttendanceModal
        open={!!editEmployee}
        employee={
          editEmployee
            ? {
                ...editEmployee,

                name: `${editEmployee.firstName} ${editEmployee.lastName}`,

                department:
                  editEmployee.departmentName,

                date:
                  editEmployee.attendanceDate,

                checkIn:
                  fmtTime(
                    editEmployee.checkIn
                  ),

                checkOut:
                  fmtTime(
                    editEmployee.checkOut
                  ),

                breakTime:
                  editEmployee.shiftBreakMinutes
                    ? fmtMins(
                        editEmployee.shiftBreakMinutes
                      )
                    : "-",

                late:
                  editEmployee.isLate
                    ? fmtMins(
                        editEmployee.lateMinutes
                      )
                    : "-",

                hours:
                  fmtHours(
                    editEmployee.workDurationMins
                  ),

                status:
                  displayStatus(
                    editEmployee
                  ),

                avatar:
                  initials(
                    editEmployee.firstName,
                    editEmployee.lastName
                  ),

                avatarColor:
                  avatarColorFor(
                    editEmployee.employeeId
                  ),
              }
            : null
        }
        onClose={() =>
          setEditEmployee(null)
        }
        onSave={
          handleSaveAttendance
        }
      />
    </>
  );
};

export default AttendanceAdminTable;