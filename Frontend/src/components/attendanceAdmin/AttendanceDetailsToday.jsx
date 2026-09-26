import { CalendarIcon } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { getAdminAttendanceSummary } from "../../services/attendanceAdminApi";

const STAT_DEFS = [
  { key: "present", label: "Present" },
  { key: "lateLogin", label: "Late Login" },
  { key: "onLeave", label: "On Leave" },
  { key: "halfDay", label: "Half Day" },
  { key: "absent", label: "Absent" },
];

const formatChange = (changePct) => {
  if (changePct === null || changePct === undefined) {
    return null;
  }

  const sign = changePct > 0 ? "+" : "";

  return `${sign}${changePct}%`;
};

const formatDate = (dateString) => {
  if (!dateString) return "";

  const [year, month, day] = String(dateString)
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    return dateString;
  }

  return new Date(year, month - 1, day).toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
};

const AttendanceDetailsToday = ({ filters = {} }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  /*
   * ==========================================================
   * SELECTED DATE
   * ==========================================================
   *
   * Priority:
   *
   * startDate
   *    ↓
   * date
   *    ↓
   * today
   */
  const selectedDate = useMemo(() => {
    return (
      filters.startDate ||
      filters.date ||
      new Date().toLocaleDateString("en-CA")
    );
  }, [filters.startDate, filters.date]);

  /*
   * ==========================================================
   * LOAD ATTENDANCE SUMMARY
   * ==========================================================
   *
   * IMPORTANT:
   * Pass a FLAT object.
   *
   * Correct:
   *
   * {
   *   date: "2026-09-15",
   *   startDate: "2026-09-15",
   *   endDate: "2026-09-15",
   *   departmentId: "",
   *   designationId: "",
   *   employeeId: "",
   *   status: "",
   *   search: ""
   * }
   *
   * NOT:
   *
   * {
   *   date: {
   *      startDate: "...",
   *      endDate: "..."
   *   }
   * }
   */
  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      try {
        setLoading(true);

        const summaryFilters = {
          date: selectedDate,

          startDate: filters.startDate || selectedDate,

          endDate: filters.endDate || selectedDate,

          departmentId:
            filters.departmentId || "",

          designationId:
            filters.designationId || "",

          employeeId:
            filters.employeeId || "",

          status:
            filters.status || "",

          search:
            filters.search || "",
        };

        const data =
          await getAdminAttendanceSummary(
            summaryFilters
          );

        if (!cancelled) {
          setSummary(data);
        }
      } catch (error) {
        if (!cancelled) {
          setSummary(null);

          toast.error(
            error?.response?.data?.message ||
              "Failed to load attendance summary"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, [
    selectedDate,
    filters.startDate,
    filters.endDate,
    filters.departmentId,
    filters.designationId,
    filters.employeeId,
    filters.status,
    filters.search,
  ]);

  /*
   * ==========================================================
   * DATE LABEL
   * ==========================================================
   */
  const dateLabel = useMemo(() => {
    if (
      filters.startDate &&
      filters.endDate &&
      filters.startDate !== filters.endDate
    ) {
      return `${formatDate(
        filters.startDate
      )} - ${formatDate(filters.endDate)}`;
    }

    return `Selected Date - ${formatDate(
      selectedDate
    )}`;
  }, [
    filters.startDate,
    filters.endDate,
    selectedDate,
  ]);

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">

      {/* =====================================================
          HEADER
      ====================================================== */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#0F265C]">
            Attendance Details
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? "Loading employee data…"
              : summary
              ? `Data from ${
                  summary.totalEmployees ?? 0
                } total no of employees`
              : "No attendance data available"}
          </p>
        </div>

        <div
          className="
            flex
            items-center
            gap-2
            px-3
            py-2
            bg-orange-50
            text-orange-500
            rounded-lg
            text-sm
            font-semibold
          "
        >
          <CalendarIcon size={14} />

          <span>{dateLabel}</span>
        </div>
      </div>

      {/* =====================================================
          STATS
      ====================================================== */}
      <div className="grid grid-cols-5 mt-6 border border-gray-200 rounded-md overflow-hidden">

        {STAT_DEFS.map(({ key, label }) => {
          const stat = summary?.[key];

          const changeLabel = stat
            ? formatChange(stat.changePct)
            : null;

          const positive =
            stat?.changePct !== null &&
            stat?.changePct !== undefined &&
            stat.changePct >= 0;

          return (
            <div
              key={key}
              className="
                px-4
                py-5
                border-r
                last:border-r-0
                border-gray-200
                flex
                justify-between
                items-end
              "
            >
              <div>
                <p className="text-gray-500 text-sm">
                  {label}
                </p>

                <h3 className="text-2xl font-semibold text-[#0F265C] mt-1">
                  {loading
                    ? "—"
                    : stat?.count ?? 0}
                </h3>
              </div>

              {changeLabel && (
                <span
                  className={`
                    px-2
                    py-[2px]
                    rounded
                    text-[11px]
                    font-semibold
                    text-white
                    ${
                      positive
                        ? "bg-green-500"
                        : "bg-red-500"
                    }
                  `}
                >
                  {changeLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttendanceDetailsToday;