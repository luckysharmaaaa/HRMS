import React, { useEffect, useState } from "react";
import { Clock, Coffee, Zap, Activity, Target } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DAILY_TARGET_MINUTES = 9 * 60;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const toMinutes = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Math.max(0, Math.round(value));
  }

  if (typeof value === "string" && value.includes(":")) {
    const parts = value.split(":").map(Number);

    if (parts.length >= 2 && parts.every((part) => !Number.isNaN(part))) {
      return parts[0] * 60 + parts[1];
    }
  }

  const numericValue = Number(value);

  return Number.isNaN(numericValue) ? 0 : Math.max(0, Math.round(numericValue));
};

const parseTimeToMinutes = (value) => {
  if (!value) return null;

  if (typeof value === "number") {
    return value;
  }

  const stringValue = String(value).trim();

  // HH:mm or HH:mm:ss
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(stringValue)) {
    const [hours, minutes] = stringValue.split(":").map(Number);

    return hours * 60 + minutes;
  }

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return date.getHours() * 60 + date.getMinutes();
  }

  return null;
};

const formatDuration = (minutes) => {
  const total = Math.max(0, Math.round(minutes || 0));

  const hours = Math.floor(total / 60);
  const mins = total % 60;

  return `${String(hours).padStart(2, "0")}h ${String(mins).padStart(
    2,
    "0"
  )}m`;
};

const getTodayAttendance = (today) => {
  if (!today) return null;

  return today.attendance || today;
};

// ─────────────────────────────────────────────────────────────────────────────
// Build today's attendance summary
// ─────────────────────────────────────────────────────────────────────────────

const buildTimeline = (today) => {
  const attendance = getTodayAttendance(today);

  if (!attendance) {
    return {
      totalWorking: "00h 00m",
      totalWorkingMinutes: 0,
      productive: "00h 00m",
      productiveMinutes: 0,
      breakHours: "00h 00m",
      breakMinutes: 0,
      overtime: "00h 00m",
      overtimeMinutes: 0,
    };
  }

  const checkIn = parseTimeToMinutes(attendance.checkIn);
  const checkOut = parseTimeToMinutes(attendance.checkOut);

  const workDurationMins = toMinutes(
    attendance.workDurationMins ?? attendance.workDuration
  );

  const overtimeMins = toMinutes(
    attendance.overtimeMins ?? attendance.overtime
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Calculate current elapsed time when employee is still punched in
  // ───────────────────────────────────────────────────────────────────────────

  let effectiveCheckOut = checkOut;

  if (checkIn !== null && effectiveCheckOut === null) {
    const now = new Date();

    effectiveCheckOut = now.getHours() * 60 + now.getMinutes();

    // Overnight shift support
    if (effectiveCheckOut < checkIn) {
      effectiveCheckOut += 24 * 60;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Gross elapsed time
  // ───────────────────────────────────────────────────────────────────────────

  let grossMinutes = 0;

  if (checkIn !== null && effectiveCheckOut !== null) {
    grossMinutes = effectiveCheckOut - checkIn;

    if (grossMinutes < 0) {
      grossMinutes += 24 * 60;
    }
  }

  // Backend work duration is already break-adjusted.
  // While punched in, use live gross time.
  const productiveMinutes =
    workDurationMins > 0 ? workDurationMins : grossMinutes;

  const totalWorkingMinutes =
    grossMinutes > 0 ? grossMinutes : productiveMinutes;

  // Break = gross time - productive time
  const actualBreakMinutes = Math.max(
    0,
    totalWorkingMinutes - productiveMinutes
  );

  // Overtime is a subset of productive time.
  const cappedOvertime = Math.min(overtimeMins, productiveMinutes);

  return {
    totalWorking: formatDuration(totalWorkingMinutes),
    totalWorkingMinutes,

    productive: formatDuration(productiveMinutes),
    productiveMinutes,

    breakHours: formatDuration(actualBreakMinutes),
    breakMinutes: actualBreakMinutes,

    overtime: formatDuration(cappedOvertime),
    overtimeMinutes: cappedOvertime,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Small metric card
// ─────────────────────────────────────────────────────────────────────────────

const StatPill = ({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
  textColor,
  bgColor,
}) => {
  return (
    <div
      className={`flex items-center gap-3 min-w-0 px-4 py-3 rounded-xl border ${bgColor} transition-all duration-200`}
    >
      {/* Icon */}
      <div
        className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${iconBg}`}
      >
        <Icon size={15} strokeWidth={2.2} className={iconColor} />
      </div>

      {/* Content */}
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-gray-400 leading-none mb-1.5">
          {label}
        </p>

        <p
          className={`text-sm font-black leading-none whitespace-nowrap tabular-nums ${textColor}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const TimelineBar = ({ today = null }) => {
  // Used only to refresh the live duration while employee is punched in.
  const [, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const timeline = buildTimeline(today);

  // ───────────────────────────────────────────────────────────────────────────
  // Progress towards 9 hour target
  // ───────────────────────────────────────────────────────────────────────────

  const progressPercent =
    DAILY_TARGET_MINUTES > 0
      ? Math.min(
          100,
          Math.round(
            (timeline.totalWorkingMinutes / DAILY_TARGET_MINUTES) * 100
          )
        )
      : 0;

  const remainingMinutes = Math.max(
    0,
    DAILY_TARGET_MINUTES - timeline.totalWorkingMinutes
  );

  const remainingText =
    remainingMinutes > 0
      ? `${formatDuration(remainingMinutes)} remaining`
      : "Target completed";

  return (
    <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* ────────────────────────────────────────────────────────────────────
          HEADER — px-6 py-4 to match the attendance/regularization card
          headers, so all three panels share one header height.
      ──────────────────────────────────────────────────────────────────── */}

      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 shrink-0">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
            <Activity size={16} className="text-orange-500" strokeWidth={2.2} />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-[#0F265C] leading-tight">
              Today's Timeline
            </p>

            <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
              Attendance summary
            </p>
          </div>
        </div>

        {/* Right summary */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Total */}
          <div className="hidden sm:flex items-center gap-1.5 h-7 px-3 rounded-lg bg-slate-50 border border-slate-100">
            <Clock size={12} className="text-[#0F265C]" />

            <span className="text-[11px] font-bold text-[#0F265C] tabular-nums">
              {timeline.totalWorking}
            </span>
          </div>

          {/* Target */}
          <div className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-orange-50 border border-orange-100">
            <Target size={12} className="text-orange-500" />

            <span className="text-[11px] font-bold text-orange-600 tabular-nums">
              {progressPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────
          CONTENT
      ──────────────────────────────────────────────────────────────────── */}

      <div className="flex-1 px-6 py-4 flex flex-col justify-center">
        {/* Three attendance metrics */}
        <div className="grid grid-cols-3 gap-3">
          <StatPill
            icon={Activity}
            label="Productive"
            value={timeline.productive}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            textColor="text-emerald-700"
            bgColor="bg-emerald-50/50 border-emerald-100"
          />

          <StatPill
            icon={Coffee}
            label="Break"
            value={timeline.breakHours}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            textColor="text-amber-700"
            bgColor="bg-amber-50/50 border-amber-100"
          />

          <StatPill
            icon={Zap}
            label="Overtime"
            value={timeline.overtime}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            textColor="text-blue-700"
            bgColor="bg-blue-50/50 border-blue-100"
          />
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            Small target footer
            Uses otherwise empty space without repeating Punch Card data.
        ────────────────────────────────────────────────────────────────── */}

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <Target size={12} className="text-gray-400 shrink-0" />

            <span className="text-[10px] text-gray-400">Daily target</span>

            <span className="text-[10px] font-bold text-[#0F265C] tabular-nums">
              09h 00m
            </span>
          </div>

          <span
            className={`text-[10px] font-semibold whitespace-nowrap ${
              remainingMinutes > 0 ? "text-gray-400" : "text-emerald-600"
            }`}
          >
            {remainingText}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimelineBar;