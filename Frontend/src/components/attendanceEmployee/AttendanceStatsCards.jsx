import React from "react";

import {
  TrendingUp,
  TrendingDown,
  Clock,
  CalendarDays,
  CalendarRange,
  Zap,
} from "lucide-react";

// ============================================================
// HELPERS
// ============================================================

const toMinutes = (value) => {
  if (value === null || value === undefined || value === "" || value === "-") {
    return 0;
  }

  if (typeof value === "number") {
    return Math.max(0, Math.round(value));
  }

  const stringValue = String(value).trim();

  // "8h 30m"
  const hmMatch = stringValue.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?$/i);

  if (hmMatch && (hmMatch[1] !== undefined || hmMatch[2] !== undefined)) {
    const hours = Number(hmMatch[1] || 0);
    const minutes = Number(hmMatch[2] || 0);

    return Math.max(0, hours * 60 + minutes);
  }

  // "08:30"
  if (stringValue.includes(":")) {
    const [hours, minutes] = stringValue.split(":").map(Number);

    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      return Math.max(0, hours * 60 + minutes);
    }
  }

  const numericValue = Number(stringValue);

  return Number.isNaN(numericValue) ? 0 : Math.max(0, Math.round(numericValue));
};

// ============================================================
// FORMAT MINUTES
// ============================================================

const formatHoursDisplay = (minutes) => {
  const totalMinutes = Math.max(0, Math.round(Number(minutes) || 0));

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours === 0 && mins === 0) {
    return "0h";
  }

  if (hours === 0) {
    return `${mins}m`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
};

// ============================================================
// DATE PARSER
// ============================================================

const parseDate = (value) => {
  if (!value) return null;

  // Already a Date
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  // YYYY-MM-DD
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

// ============================================================
// GET RECORD DATE
// ============================================================

const getRecordDate = (record) => {
  if (!record) return null;

  const value =
    record.attendanceDate ??
    record.date ??
    record.attendance?.attendanceDate ??
    record.attendance?.date ??
    record.raw?.attendanceDate ??
    record.raw?.date ??
    record.createdAt;

  return parseDate(value);
};

// ============================================================
// WORK MINUTES
// ============================================================

const getWorkMinutes = (record) => {
  if (!record) return 0;

  return toMinutes(
    record.workDurationMins ??
      record.workDuration ??
      record.hours ??
      record.productiveHours ??
      record.attendance?.workDurationMins ??
      record.attendance?.workDuration
  );
};

// ============================================================
// CALCULATE LIVE WORK MINUTES
// ============================================================
//
// FIXED: previously this checked `backendMinutes > 0` to decide whether
// to trust the backend value. That meant a *legitimately completed* shift
// where the backend computed exactly 0 productive minutes (e.g. break
// time >= time worked) got silently overridden by an unadjusted gross
// checkIn→checkOut diff instead. The correct signal for "has the backend
// finished computing this?" is whether checkOut exists / the field is
// non-null — not whether the number happens to be greater than zero.

const getLiveWorkMinutes = (attendance) => {
  if (!attendance) return 0;

  const backendValue = attendance.workDurationMins ?? attendance.workDuration;

  // Already punched out — trust the backend's final number (including a
  // legitimate 0) instead of recomputing gross time behind its back.
  if (attendance.checkIn && attendance.checkOut) {
    if (backendValue !== null && backendValue !== undefined) {
      return toMinutes(backendValue);
    }

    // Backend value missing for some reason — fall back to gross diff.
    const checkIn = new Date(attendance.checkIn);
    const checkOut = new Date(attendance.checkOut);

    if (!Number.isNaN(checkIn.getTime()) && !Number.isNaN(checkOut.getTime())) {
      return Math.max(
        0,
        Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000)
      );
    }

    return 0;
  }

  // Still punched in — count up live from check-in until now.
  if (attendance.checkIn && !attendance.checkOut) {
    const checkIn = new Date(attendance.checkIn);
    const now = new Date();

    if (!Number.isNaN(checkIn.getTime()) && now > checkIn) {
      return Math.max(
        0,
        Math.floor((now.getTime() - checkIn.getTime()) / 60000)
      );
    }
  }

  return 0;
};

// ============================================================
// OVERTIME
// ============================================================

const getOvertimeMinutes = (record) => {
  if (!record) return 0;

  return toMinutes(
    record.overtimeMins ??
      record.overtime ??
      record.attendance?.overtimeMins ??
      record.attendance?.overtime
  );
};

// ============================================================
// SAME DAY
// ============================================================

const isSameDay = (date1, date2) => {
  if (!(date1 instanceof Date)) return false;
  if (!(date2 instanceof Date)) return false;

  if (Number.isNaN(date1.getTime()) || Number.isNaN(date2.getTime())) {
    return false;
  }

  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// ============================================================
// START OF WEEK
// ROLLING 7-DAY WINDOW: today minus 6 days, through today.
//
// FIXED: this used to be a calendar Mon-Sun week. That meant on every
// Monday, "this week" only contained a single day (today) — so
// "Hours This Week" was always numerically identical to "Hours Today"
// until Tuesday. A rolling last-7-days window always spans multiple
// days, so the two cards no longer coincidentally match.
// ============================================================

const getStartOfWeek = (date) => {
  if (!(date instanceof Date)) return null;

  const start = new Date(date);

  if (Number.isNaN(start.getTime())) {
    return null;
  }

  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  return start;
};

// ============================================================
// END OF WEEK
// End of the rolling window = end of today.
// ============================================================

const getEndOfWeek = (date) => {
  if (!(date instanceof Date)) return null;

  const end = new Date(date);

  if (Number.isNaN(end.getTime())) {
    return null;
  }

  end.setHours(23, 59, 59, 999);

  return end;
};

// ============================================================
// CURRENT WEEK
// ============================================================

const isInCurrentWeek = (date, now) => {
  if (!(date instanceof Date)) return false;
  if (!(now instanceof Date)) return false;

  if (Number.isNaN(date.getTime()) || Number.isNaN(now.getTime())) {
    return false;
  }

  const start = getStartOfWeek(now);
  const end = getEndOfWeek(now);

  if (!start || !end) return false;

  return date >= start && date <= end;
};

// ============================================================
// CURRENT MONTH
// ============================================================

const isInCurrentMonth = (date, now) => {
  if (!(date instanceof Date)) return false;
  if (!(now instanceof Date)) return false;

  if (Number.isNaN(date.getTime()) || Number.isNaN(now.getTime())) {
    return false;
  }

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
};

// ============================================================
// WORKING DAYS ELAPSED
// ============================================================

const getWorkingDaysElapsed = (now) => {
  if (!(now instanceof Date)) return 0;

  if (Number.isNaN(now.getTime())) {
    return 0;
  }

  let workingDays = 0;

  for (let day = 1; day <= now.getDate(); day++) {
    const date = new Date(now.getFullYear(), now.getMonth(), day);

    const dayOfWeek = date.getDay();

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }

  return workingDays;
};

// ============================================================
// STAT CARD
// ============================================================
// UI: fixed internal rhythm (p-5 / gap-4) and h-full so all four cards
// are exactly the same height regardless of label length, and the
// value/label block always sits on the same baseline across the row.

const StatCard = ({
  label,
  value,
  total,
  unit,
  trend,
  trendLabel,
  positive = true,
  gradient,
  iconBg,
  icon: Icon,
  bar,
}) => {
  const safeBar = Math.min(100, Math.max(0, Number(bar) || 0));

  return (
    <div className="group relative h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden p-5 flex flex-col justify-between gap-4">
      {/* Top accent */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient}`}
      />

      {/* Icon + trend */}
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-xl border flex items-center justify-center ${iconBg}`}
        >
          <Icon size={18} />
        </div>

        {trend && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${
              positive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-500"
            }`}
          >
            {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trend}
          </div>
        )}
      </div>

      {/* Value */}
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-[#0F265C] leading-none tabular-nums">
            {value}
          </span>

          <span className="text-xs font-semibold text-gray-400 leading-none">
            / {total} {unit}
          </span>
        </div>

        <p className="text-xs text-gray-400 font-medium mt-2">{label}</p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
            style={{
              width: `${safeBar}%`,
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400 font-medium">
            {trendLabel}
          </span>

          <span className="text-[10px] font-bold text-gray-500 tabular-nums">
            {Math.round(safeBar)}%
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const AttendanceStatsCards = ({ history = [], today = null }) => {
  const now = new Date();

  // ==========================================================
  // TARGETS
  // ==========================================================
  // NOTE: DAILY_TARGET_MINUTES must stay in sync with the same
  // constant in PunchCard.jsx, so the ring % there always agrees
  // with the "Hours Today" card here.

  const DAILY_TARGET_MINUTES = 9 * 60;
  const WEEKLY_TARGET_MINUTES = 40 * 60;
  const OVERTIME_REFERENCE_MINUTES = 28 * 60;

  // ==========================================================
  // TODAY
  // ==========================================================

  const todayFromTodayAPI = getLiveWorkMinutes(today?.attendance);

  const todayFromHistory = history.reduce((total, record) => {
    const date = getRecordDate(record);

    if (isSameDay(date, now)) {
      return total + getWorkMinutes(record);
    }

    return total;
  }, 0);

  // Use today's API value if available.
  // Otherwise use history.
  const todayMinutes = Math.max(todayFromTodayAPI, todayFromHistory);

  // ==========================================================
  // CURRENT WEEK
  // ==========================================================

  let weekMinutes = history.reduce((total, record) => {
    const date = getRecordDate(record);

    if (isInCurrentWeek(date, now)) {
      return total + getWorkMinutes(record);
    }

    return total;
  }, 0);

  // IMPORTANT:
  // Add today's live attendance if it is not already
  // included in history.
  const todayAlreadyInHistory = history.some((record) => {
    const date = getRecordDate(record);
    return isSameDay(date, now);
  });

  if (!todayAlreadyInHistory) {
    weekMinutes += todayMinutes;
  } else {
    // If history has today but its duration is old/0,
    // make sure today's current value is reflected.
    const historyTodayMinutes = history.reduce((total, record) => {
      const date = getRecordDate(record);

      if (isSameDay(date, now)) {
        return total + getWorkMinutes(record);
      }

      return total;
    }, 0);

    if (todayMinutes > historyTodayMinutes) {
      weekMinutes = weekMinutes - historyTodayMinutes + todayMinutes;
    }
  }

  // ==========================================================
  // CURRENT MONTH
  // ==========================================================

  let monthMinutes = history.reduce((total, record) => {
    const date = getRecordDate(record);

    if (isInCurrentMonth(date, now)) {
      return total + getWorkMinutes(record);
    }

    return total;
  }, 0);

  // Make sure today's attendance is included.
  const monthTodayMinutes = history.reduce((total, record) => {
    const date = getRecordDate(record);

    if (isSameDay(date, now)) {
      return total + getWorkMinutes(record);
    }

    return total;
  }, 0);

  if (todayMinutes > monthTodayMinutes) {
    monthMinutes = monthMinutes - monthTodayMinutes + todayMinutes;
  }

  // ==========================================================
  // CURRENT MONTH OVERTIME
  // ==========================================================

  const overtimeMinutes = history.reduce((total, record) => {
    const date = getRecordDate(record);

    if (isInCurrentMonth(date, now)) {
      return total + getOvertimeMinutes(record);
    }

    return total;
  }, 0);

  // ==========================================================
  // MONTH TARGET
  // ==========================================================

  const workingDaysElapsed = getWorkingDaysElapsed(now);

  const monthlyTargetMinutes = workingDaysElapsed * DAILY_TARGET_MINUTES;

  // ==========================================================
  // PROGRESS
  // ==========================================================

  const todayBar =
    DAILY_TARGET_MINUTES > 0
      ? (todayMinutes / DAILY_TARGET_MINUTES) * 100
      : 0;

  const weekBar =
    WEEKLY_TARGET_MINUTES > 0
      ? (weekMinutes / WEEKLY_TARGET_MINUTES) * 100
      : 0;

  const monthBar =
    monthlyTargetMinutes > 0
      ? (monthMinutes / monthlyTargetMinutes) * 100
      : 0;

  const overtimeBar =
    OVERTIME_REFERENCE_MINUTES > 0
      ? (overtimeMinutes / OVERTIME_REFERENCE_MINUTES) * 100
      : 0;

  // ==========================================================
  // STATS
  // ==========================================================

  const stats = [
    {
      id: "today",
      label: "Hours Today",
      value: formatHoursDisplay(todayMinutes),
      total: "9",
      unit: "hrs",
      trend: "",
      trendLabel: "today",
      positive: true,
      gradient: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-50 text-blue-600 border-blue-100",
      icon: Clock,
      bar: todayBar,
    },

    {
      id: "week",
      label: "Hours This Week",
      value: formatHoursDisplay(weekMinutes),
      total: "40",
      unit: "hrs",
      trend: "",
      trendLabel: "last 7 days",
      positive: true,
      gradient: "from-violet-500 to-violet-600",
      iconBg: "bg-violet-50 text-violet-600 border-violet-100",
      icon: CalendarDays,
      bar: weekBar,
    },

    {
      id: "month",
      label: "Hours This Month",
      value: formatHoursDisplay(monthMinutes),
      total: formatHoursDisplay(monthlyTargetMinutes),
      unit: "hrs",
      trend: "",
      trendLabel: "current month",
      positive: true,
      gradient: "from-cyan-500 to-cyan-600",
      iconBg: "bg-cyan-50 text-cyan-600 border-cyan-100",
      icon: CalendarRange,
      bar: monthBar,
    },

    {
      id: "overtime",
      label: "Overtime Month",
      value: formatHoursDisplay(overtimeMinutes),
      total: "28",
      unit: "hrs",
      trend: "",
      trendLabel: "current month",
      positive: true,
      gradient: "from-rose-500 to-pink-600",
      iconBg: "bg-rose-50 text-rose-500 border-rose-100",
      icon: Zap,
      bar: overtimeBar,
    },
  ];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
      {stats.map((stat) => (
        <StatCard key={stat.id} {...stat} />
      ))}
    </div>
  );
};

export default AttendanceStatsCards;