import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronRight, HomeIcon, FileText, FileSpreadsheet, ChevronDown, BarChart3,
} from "lucide-react";
import { toast } from "react-toastify";

import PunchCard from "../components/attendanceEmployee/PunchCard";
import AttendanceStatsCards from "../components/attendanceEmployee/AttendanceStatsCards";
import TimelineBar from "../components/attendanceEmployee/TimelineBar";
import EmployeeAttendanceTable from "../components/attendanceEmployee/EmployeeAttendanceTable";
import EmployeeRegularization from "../components/attendanceEmployee/EmployeeRegularization";
import AttendanceReportModal from "../components/attendanceAdmin/AttendanceReportModal";

import {
  getTodayAttendance, punchIn, punchOut, getAttendanceHistory,
} from "../services/attendanceApi";
import {
  submitRegularization,
  updateRegularization,
  getMyRegularizations,
} from "../services/regularizationApi";

import { formatTime, minsToHrsMins } from "../utils/attendanceFormat";
import { buildMonthAttendance } from "../utils/monthAttendance";
import { useAuth } from "../context/AuthContext";

const now = new Date();


// YYYY-MM-DD for a given year/month, first or last day
const monthBounds = (year, month) => {
  const pad2 = (n) => String(n).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  return {
    startDate: `${year}-${pad2(month)}-01`,
    endDate: `${year}-${pad2(month)}-${pad2(lastDay)}`,
  };
};

const AttendanceEmployee = () => {
  const { user } = useAuth();
  // const { user } = useAuth();
const regularizationRef = useRef(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [myRegularizations, setMyRegularizations] = useState([]);
  const [punching, setPunching] = useState(false);

  // Selected calendar month — this is now the single source of truth for
  // both the backend fetch and buildMonthAttendance's grid.
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const loadAll = useCallback(async () => {
    try {
      const { startDate, endDate } = monthBounds(selectedYear, selectedMonth);
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();

      const [todayRes, historyRes, regularizationRes] = await Promise.all([
        getTodayAttendance(),
        getAttendanceHistory(1, lastDay, { startDate, endDate }),
        getMyRegularizations(1, 100),
      ]);

      setToday(todayRes?.data || null);
      setHistory(historyRes?.data?.data || []);
      setMyRegularizations(regularizationRes?.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load attendance");
    }
  }, [selectedYear, selectedMonth]);

  // Reload whenever the selected month changes, or on mount
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleMonthChange = (year, month) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };
  const handleGoToRegularization = () => {
    regularizationRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };



  const handlePunchIn = async () => {
    setPunching(true);
    try {
      const res = await punchIn();
      toast.success(res?.message || "Punched in successfully");
      await loadAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Punch in failed");
    } finally {
      setPunching(false);
    }
  };

  const handlePunchOut = async () => {
    setPunching(true);
    try {
      const res = await punchOut();
      toast.success(res?.message || "Punched out successfully");
      await loadAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Punch out failed");
    } finally {
      setPunching(false);
    }
  };

  // FIXED: previously this always called submitRegularization, even when
  // the modal built an isEdit/regularizationId payload for a PENDING
  // request. That hit the backend's duplicate-pending guard and threw a
  // 409 every time someone tried to edit. Now routes to the update
  // endpoint (same row, PATCH) when payload.isEdit is true.
  const handleSubmitRegularization = async (payload) => {
    try {
      const { isEdit, regularizationId, attendanceId, ...body } = payload;

      if (isEdit && regularizationId) {
        await updateRegularization(regularizationId, body);
        toast.success("Regularization request updated");
      } else {
        await submitRegularization({ attendanceId, ...body });
        toast.success("Regularization request submitted");
      }

      await loadAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit regularization request");
      throw error;
    }
  };

  const punchCardUser = {
    name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Employee",
    avatar: `${(user?.firstName || "U")[0]}${(user?.lastName || "")[0] || ""}`.toUpperCase(),
    department: "",
    role: "",
    punchedIn: !!today?.attendance?.checkIn && !today?.attendance?.checkOut,
    completed: !!today?.attendance?.checkIn && !!today?.attendance?.checkOut,
    punchInTime: formatTime(today?.attendance?.checkIn),
    punchOutTime: formatTime(today?.attendance?.checkOut),
    checkInRaw: today?.attendance?.checkIn || null,
    checkOutRaw: today?.attendance?.checkOut || null,
    workDurationMins: today?.attendance?.workDurationMins ?? null,
    productionHours: minsToHrsMins(today?.attendance?.workDurationMins),
    progressPercent: 0,
    shiftStart: today?.shift?.startTime || "-",
    shiftEnd: today?.shift?.endTime || "-",
    location: "Office",
  };


  // Grid now reflects whichever month the user picked, not always "now"
  const tableRecords = buildMonthAttendance(
    history,
    selectedYear,
    selectedMonth,
    myRegularizations
  );


  return (
    <div className="min-w-0">
      <div className="space-y-4 min-w-0">
        {/* HEADER — stacks under the title on phones, sits beside it from sm */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F265C]">
              Employee Attendance
            </h1>
            <nav className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400 leading-none flex-wrap">
              <HomeIcon size={12} className="shrink-0" />
              <ChevronRight size={12} className="shrink-0" />
              <span>Attendance</span>
              <ChevronRight size={12} className="shrink-0" />
              <span className="text-orange-500 font-medium">Employee Attendance</span>
            </nav>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="dropdown dropdown-end flex-1 sm:flex-none">
              <label tabIndex={0} className="w-full flex items-center justify-center gap-2 h-10 px-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer">
                <FileText size={15} />
                <span>Export</span>
                <ChevronDown size={13} />
              </label>
              <ul tabIndex={0} className="dropdown-content menu bg-white border border-gray-100 rounded-xl shadow-xl z-50 w-48 p-1.5 mt-2">
                <li>
                  <a className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                    <FileText size={15} className="text-red-500 shrink-0" />
                    <span className="font-medium">Export as PDF</span>
                  </a>
                </li>
                <li>
                  <a className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                    <FileSpreadsheet size={15} className="text-green-600 shrink-0" />
                    <span className="font-medium">Export as Excel</span>
                  </a>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setReportOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-orange-300/30"
            >
              <BarChart3 size={15} />
              Report
            </button>
          </div>
        </div>

        {/* PUNCH CARD + STATS
            Phone/tablet : punch card on top, stats stacked beneath.
            xl and up    : original 1 + 3 column split. */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 items-start min-w-0">
          <div className="xl:col-span-1 min-w-0 max-w-sm w-full mx-auto xl:max-w-none xl:mx-0">
            <PunchCard
              user={punchCardUser}
              onPunchIn={punching ? undefined : handlePunchIn}
              onPunchOut={punching ? undefined : handlePunchOut}
            />
          </div>

          <div className="xl:col-span-3 flex flex-col gap-4 min-w-0">
            <AttendanceStatsCards history={history} today={today} />
            <TimelineBar today={today} />
          </div>
        </div>

        <EmployeeAttendanceTable
          records={tableRecords}
          year={selectedYear}
          month={selectedMonth}
          onMonthChange={handleMonthChange}
          onSubmitRegularization={handleSubmitRegularization}
          onGoToRegularization={handleGoToRegularization}
        />

        {/* <EmployeeRegularization requests={myRegularizations} /> */}
        <EmployeeRegularization
          requests={myRegularizations}
          regularizationRef={regularizationRef}
        />
      </div>

      <AttendanceReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
};

export default AttendanceEmployee;