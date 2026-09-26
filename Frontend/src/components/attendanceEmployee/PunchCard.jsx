import React, { useState, useEffect } from "react";
import {
  Fingerprint,
  LogIn,
  LogOut,
  Briefcase,
  Wifi,
} from "lucide-react";

// ── Live production-minutes target ───────────────────────────────────────
// Keep this in sync with AttendanceStatsCards.DAILY_TARGET_MINUTES (9h/day)
// so the ring % here always agrees with the "Hours Today" card next to it.
const DAILY_TARGET_MINUTES = 9 * 60;

// ── Minutes helpers (mirrors the logic already used in TimelineBar /
//    AttendanceStatsCards, so all three widgets always agree) ─────────────

const toMinutesSafe = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};

const formatDuration = (minutes) => {
  const total = Math.max(0, Math.round(minutes || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${m}m`;
};

// Backend only fills `workDurationMins` in once Punch Out happens.
// While the employee is still punched in, count up live from checkIn
// to `now` instead of showing a frozen "0h 0m" all day.
const getLiveProductionMinutes = (user, now) => {
  const backendMinutes = toMinutesSafe(user?.workDurationMins);

  if (backendMinutes > 0) {
    return backendMinutes;
  }

  if (user?.checkInRaw && !user?.checkOutRaw) {
    const checkIn = new Date(user.checkInRaw);

    if (!Number.isNaN(checkIn.getTime()) && now > checkIn) {
      return Math.max(
        0,
        Math.floor((now.getTime() - checkIn.getTime()) / 60000)
      );
    }
  }

  return 0;
};

// ── Elapsed-time helpers (for the header's main display) ──────────────────
// This is separate from getLiveProductionMinutes (which the ring % still
// uses, untouched). This one tracks seconds, purely for the ticking
// "elapsed since Punch In" display in the header.

const getElapsedSeconds = (user, now) => {
  // Punched out — elapsed is the fixed Punch In → Punch Out duration.
  if (user?.checkInRaw && user?.checkOutRaw) {
    const checkIn = new Date(user.checkInRaw);
    const checkOut = new Date(user.checkOutRaw);

    if (
      !Number.isNaN(checkIn.getTime()) &&
      !Number.isNaN(checkOut.getTime())
    ) {
      return Math.max(
        0,
        Math.floor((checkOut.getTime() - checkIn.getTime()) / 1000)
      );
    }

    return 0;
  }

  // Still punched in — count up live from checkIn to now.
  if (user?.checkInRaw && !user?.checkOutRaw) {
    const checkIn = new Date(user.checkInRaw);

    if (!Number.isNaN(checkIn.getTime()) && now > checkIn) {
      return Math.max(
        0,
        Math.floor((now.getTime() - checkIn.getTime()) / 1000)
      );
    }
  }

  return 0;
};

const formatElapsed = (totalSeconds) => {
  const total = Math.max(0, Math.round(totalSeconds || 0));

  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(
    2,
    "0"
  )}:${String(s).padStart(2, "0")}`;
};

// ── Animated circular ring ──────────────────────────────────────────────────

const CircularRing = ({
  percent = 0,
  size = 108,
  strokeWidth = 7,
  children,
}) => {
  const safePercent = Math.min(100, Math.max(0, Number(percent) || 0));

  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (safePercent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90 absolute inset-0"
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />

        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
          strokeLinecap="round"
          style={{
            transition: "stroke-dasharray 0.8s ease-in-out",
          }}
        />

        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="60%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
      </svg>

      {/* Avatar */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>

      {/* Percentage — pinned to the ring's own corner with a small pill
          background so it never visually drifts from the ring. */}
      <div
        className="absolute text-[9px] font-bold text-orange-500 bg-white/90 rounded-full px-1.5 py-0.5 tabular-nums shadow-sm"
        style={{
          bottom: -2,
          right: -2,
        }}
      >
        {Math.round(safePercent)}%
      </div>
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────

const PunchCard = ({ user, onPunchIn, onPunchOut }) => {
  const [now, setNow] = useState(new Date());

  /*
   * punchedOutToday is used to distinguish:
   *
   * 1. Before Punch In
   *    punchedIn = false
   *    punchedOutToday = false
   *    → Punch In
   *
   * 2. After Punch In
   *    punchedIn = true
   *    punchedOutToday = false
   *    → Punch Out
   *
   * 3. After Punch Out
   *    punchedOutToday = true
   *    → Punch Out
   */

  const [punchedOutToday, setPunchedOutToday] = useState(
    Boolean(user?.punchedOut)
  );

  // ── Live ticker ───────────────────────────────────────────────────────────
  // Drives both the ring % (via getLiveProductionMinutes) and the header's
  // elapsed-time display (via getElapsedSeconds) below — needs to tick
  // every second while the employee is punched in.

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  // ── Sync Punch Out state with backend data ────────────────────────────────

  useEffect(() => {
    if (user?.punchedOut !== undefined) {
      setPunchedOutToday(Boolean(user.punchedOut));
      return;
    }

    if (user?.checkOut || user?.punchOutTime) {
      setPunchedOutToday(true);
    }
  }, [user?.punchedOut, user?.checkOut, user?.punchOutTime]);

  // ── Greeting ──────────────────────────────────────────────────────────────

  const h = now.getHours();

  const greeting =
    h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";

  // ── Current date ──────────────────────────────────────────────────────────

  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  // ── Session time display (was: continuously running clock, then Punch
  //    In time) — now shows ELAPSED TIME since Punch In. ────────────────────
  //   - Not punched in yet        → "--:--"
  //   - Punched in                → live ticking HH:MM:SS since Punch In
  //   - Punched out               → fixed HH:MM:SS total (Punch In → Punch Out)

  const hasPunchedInToday = Boolean(user?.punchedIn) || punchedOutToday;

  const elapsedSeconds = getElapsedSeconds(user, now);

  const sessionTimeValue = hasPunchedInToday
    ? formatElapsed(elapsedSeconds)
    : "--:--";

  const sessionStatusLabel = punchedOutToday
    ? "Total time · shift completed"
    : user?.punchedIn
      ? "Elapsed since punch in"
      : "Not punched in yet";

  // ── Live production minutes / ring % ───────────────────────────────────────
  // Recomputed every render, which happens every second thanks to the
  // clock interval above — so this always reflects "right now", not just
  // whatever was true the last time the page fetched /attendance/today.

  const liveProductionMinutes = getLiveProductionMinutes(user, now);

  const liveProgressPercent =
    DAILY_TARGET_MINUTES > 0
      ? (liveProductionMinutes / DAILY_TARGET_MINUTES) * 100
      : 0;

  // ── Punch In ──────────────────────────────────────────────────────────────

  const handlePunchIn = async () => {
    if (user?.punchedIn) {
      return;
    }

    if (punchedOutToday) {
      return;
    }

    try {
      await onPunchIn?.();
    } catch (error) {
      console.error("Punch In failed:", error);
    }
  };

  // ── Punch Out ─────────────────────────────────────────────────────────────

  const handlePunchOut = async () => {
    if (punchedOutToday) {
      return;
    }

    if (!user?.punchedIn) {
      return;
    }

    try {
      await onPunchOut?.();

      // Only mark as punched out after successful API call
      setPunchedOutToday(true);
    } catch (error) {
      console.error("Punch Out failed:", error);
    }
  };

  // ── Decide which action to perform ────────────────────────────────────────

  const handlePunch = () => {
    // Already punched out today
    if (punchedOutToday) {
      return;
    }

    if (user?.punchedIn) {
      handlePunchOut();
    } else {
      handlePunchIn();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl flex flex-col bg-white border border-gray-100 shadow-sm">
      {/* ================================================================
          HEADER — shows elapsed time since Punch In, not a live clock
      ================================================================= */}

      <div className="relative bg-gradient-to-br from-[#0F265C] via-[#1a3a7c] to-[#0f265c] px-5 pt-5 pb-10">
        {/* Decorative circle */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />

        {/* Decorative circle */}
        <div className="absolute bottom-0 left-3 w-10 h-10 bg-orange-500/10 rounded-full translate-y-1/2" />

        {/* Session time information */}
        <div className="relative text-center space-y-1.5">
          <p className="text-white/60 text-[10px] font-medium tracking-wide uppercase">
            {greeting}
          </p>

          <p className="text-white text-[28px] font-black tracking-tight leading-none tabular-nums">
            {sessionTimeValue}
          </p>

          <p className="text-white/50 text-[10px]">
            {sessionStatusLabel} · {dateStr}
          </p>
        </div>
      </div>

      {/* ================================================================
          AVATAR RING
      ================================================================= */}

      <div className="flex justify-center -mt-8 relative z-10">
        <CircularRing percent={liveProgressPercent}>
          <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-black shadow-lg ring-4 ring-white">
            {user?.avatar || "U"}
          </div>
        </CircularRing>
      </div>

      {/* ================================================================
          CONTENT — one consistent gap-3 rhythm between every block
      ================================================================= */}

      <div className="flex flex-col px-5 pt-3 pb-5 gap-3">
        {/* Employee Name */}

        <div className="text-center">
          <p className="text-[#0F265C] font-bold text-sm leading-tight">
            {user?.name || "Employee"}
          </p>

          {/* <p className="text-gray-400 text-[11px] mt-0.5">
            {user?.role || "-"}
          </p> */}
        </div>

        {/* ================================================================
            DEPARTMENT / LOCATION
        ================================================================= */}

        <div className="flex items-center justify-center gap-2 flex-wrap">
          {/* Department */}

          <span className="inline-flex items-center gap-1 h-6 px-2.5 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-semibold rounded-full">
            <Briefcase size={10} />
            {user?.department || "-"}
          </span>

          {/* Location */}

          <span className="inline-flex items-center gap-1 h-6 px-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-semibold rounded-full">
            <Wifi size={10} />
            {user?.location || "Office"}
          </span>
        </div>

        {/* ================================================================
            PUNCH IN / PUNCH OUT
            (actual clock times from the API — unchanged)
        ================================================================= */}

        <div className="grid grid-cols-2 gap-2">
          {/* Punch In */}

          <div className="bg-emerald-50 border border-emerald-100/80 rounded-lg px-2 py-2.5 text-center">
            <p className="text-[9px] font-semibold text-emerald-500 uppercase tracking-wide mb-1">
              Punch In
            </p>

            <p className="text-xs font-black text-emerald-700 tabular-nums">
              {user?.punchInTime || "--:--"}
            </p>
          </div>

          {/* Punch Out */}

          <div className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-2.5 text-center">
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Punch Out
            </p>

            <p className="text-xs font-black text-[#0F265C] tabular-nums">
              {user?.punchOutTime || "--:--"}
            </p>
          </div>
        </div>

        {/* ================================================================
            SHIFT
        ================================================================= */}

        <div className="flex items-center justify-between gap-3 h-10 px-3 bg-slate-50 border border-slate-100 rounded-lg">
          <div className="flex items-center gap-1.5">
            <Briefcase size={12} className="text-slate-400 shrink-0" />

            <span className="text-[11px] font-semibold text-slate-500">
              Shift
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] min-w-0">
            <Fingerprint size={10} className="text-slate-400 shrink-0" />

            <span className="font-semibold text-[#0F265C] truncate">
              {user?.shiftStart || "-"}
              {user?.shiftEnd && user.shiftEnd !== "-"
                ? ` – ${user.shiftEnd}`
                : ""}
            </span>
          </div>
        </div>

        {/* ================================================================
            PUNCH BUTTON
        ================================================================= */}

        <button
          type="button"
          onClick={handlePunch}
          disabled={punchedOutToday}
          className={`w-full flex items-center justify-center gap-2 h-11 rounded-lg text-sm font-bold transition-all duration-200 active:scale-95 shadow-lg ${
            user?.punchedIn || punchedOutToday
              ? "bg-gradient-to-r from-[#0F265C] to-[#1a3a7c] hover:from-[#0a1d4a] text-white shadow-blue-900/25"
              : "bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white shadow-orange-500/30"
          } ${punchedOutToday ? "cursor-not-allowed opacity-80" : ""}`}
        >
          {user?.punchedIn || punchedOutToday ? (
            <>
              <LogOut size={15} />
              Punch Out
            </>
          ) : (
            <>
              <LogIn size={15} />
              Punch In
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PunchCard;