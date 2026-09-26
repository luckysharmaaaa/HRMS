// ```javascript
import {
  formatTime,
  mapStatusLabel,
  minsToShort,
} from "./attendanceFormat";

const pad2 = (n) => String(n).padStart(2, "0");

// ── Create map of attendance records by date ──────────────────────────────────

const buildRecordMap = (records) => {
  const map = new Map();

  records.forEach((row) => {
    if (!row?.attendanceDate) return;

    const key = row.attendanceDate.slice(0, 10);

    map.set(key, row);
  });

  return map;
};

// ── Create map of latest regularization request per attendanceId ─────────────
//
// The regularization API returns rows ordered by createdAt DESC (see
// getMyRegularizationRequests), so the first row seen per attendanceId here
// is always the most recent one — that's what the table should reflect.

const buildRegularizationMap = (regularizations) => {
  const map = new Map();

  (regularizations || []).forEach((reg) => {
    if (!reg?.attendanceId) return;

    if (!map.has(reg.attendanceId)) {
      map.set(reg.attendanceId, reg);
    }
  });

  return map;
};

// ── Parse MySQL datetime as local time ────────────────────────────────────────

const parseLocalDateTime = (str) => {
  if (!str) return null;

  const parsed = new Date(str.replace(" ", "T"));

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// ── Calculate Check Out - Check In ────────────────────────────────────────────

const computeDurationLabel = (checkIn, checkOut) => {
  const inTime = parseLocalDateTime(checkIn);
  const outTime = parseLocalDateTime(checkOut);

  if (!inTime || !outTime) return "-";

  let diffMs = outTime - inTime;

  // Handle overnight attendance.
  if (diffMs < 0) {
    diffMs += 24 * 60 * 60 * 1000;
  }

  if (diffMs <= 0) return "-";

  const totalMins = Math.round(diffMs / 60000);

  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;

  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;

  return `${h}h ${m}m`;
};

// ── Convert YYYY-MM-DD into local Date ───────────────────────────────────────

const parseLocalDate = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);

  return new Date(y, m - 1, d);
};

// ── Format date for UI ────────────────────────────────────────────────────────

const formatDisplayDate = (dateStr) => {
  return parseLocalDate(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ── Get today's date in local timezone ────────────────────────────────────────

const getTodayLocalStr = () => {
  const now = new Date();

  return `${now.getFullYear()}-${pad2(
    now.getMonth() + 1
  )}-${pad2(now.getDate())}`;
};

// ── Format productive minutes ────────────────────────────────────────────────

const formatMinutes = (minutes) => {
  const totalMinutes = Number(minutes);

  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return "-";
  }

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) {
    return `${m}m`;
  }

  if (m === 0) {
    return `${h}h`;
  }

  return `${h}h ${m}m`;
};

// ── Empty row ─────────────────────────────────────────────────────────────────

const emptyRow = (dateStr, dayOfWeek) => ({
  id: dateStr,

  date: formatDisplayDate(dateStr),

  dayOfWeek,

  checkIn: "-",

  checkOut: "-",

  status: "-",

  breakTime: "-",

  late: "-",

  overtime: "-",

  period: "-",

  hours: "-",

  checkInIp: null,

  checkInIpValid: null,

  checkOutIp: null,

  checkOutIpValid: null,

  // No attendance row exists yet for this date, so there's nothing to
  // regularize — keep the shape consistent with real rows.
  regularization: null,

  raw: dateStr,
});

// ── Build complete month attendance ───────────────────────────────────────────
//
// `regularizations` is optional and defaults to an empty array so existing
// callers that don't pass it keep working exactly as before (every row's
// `regularization` field will simply be null, same as today).

export const buildMonthAttendance = (
  records,
  year,
  month,
  regularizations = []
) => {
  const recordMap = buildRecordMap(records || []);
  const regularizationMap = buildRegularizationMap(regularizations);

  const daysInMonth = new Date(
    year,
    month,
    0
  ).getDate();

  const todayStr = getTodayLocalStr();

  const rows = [];

  for (
    let day = 1;
    day <= daysInMonth;
    day += 1
  ) {
    const dateStr = `${year}-${pad2(month)}-${pad2(day)}`;

    const dayOfWeek = parseLocalDate(
      dateStr
    ).toLocaleDateString("en-US", {
      weekday: "short",
    });

    const isFuture = dateStr > todayStr;

    // Only use attendance data for today/past dates.
    const realRow = !isFuture
      ? recordMap.get(dateStr)
      : null;

    // ── Real attendance record ──────────────────────────────────────────────

    if (realRow) {
      const workDurationMins = Number(
        realRow.workDurationMins
      );

      /*
       * BREAK LOGIC
       *
       * Break time comes directly from the backend:
       *
       *     realRow.shiftBreakMinutes
       *
       * Examples:
       *
       *     60  -> 1h
       *     45  -> 45m
       *     90  -> 1h 30m
       *
       * We do NOT calculate break from:
       *
       *     CheckOut - CheckIn
       *
       * because the backend already knows the employee's
       * configured shift break.
       */

      const breakMinutes = Number(
        realRow.shiftBreakMinutes
      );

      // ── Regularization status for this attendance row ──────────────────────
      //
      // Looked up by attendanceId (realRow.id), not by date, since that's
      // the actual foreign key the backend uses.

      const regRow = regularizationMap.get(realRow.id);

      rows.push({
        id: realRow.id,

        date: formatDisplayDate(dateStr),

        dayOfWeek,

        // ── Check In ────────────────────────────────────────────────────────

        checkIn:
          formatTime(realRow.checkIn) || "-",

        // ── Check Out ───────────────────────────────────────────────────────

        checkOut:
          formatTime(realRow.checkOut) || "-",

        // ── Status ──────────────────────────────────────────────────────────

        status: mapStatusLabel(realRow),

        // ── BREAK ───────────────────────────────────────────────────────────

        breakTime: minsToShort(
          Number.isFinite(breakMinutes)
            ? breakMinutes
            : null
        ),

        // ── Late ────────────────────────────────────────────────────────────

        late: minsToShort(
          realRow.lateMinutes
        ),

        // ── Overtime ────────────────────────────────────────────────────────

        overtime: minsToShort(
          realRow.overtimeMins
        ),

        // ── Total Period ────────────────────────────────────────────────────
        // Check Out - Check In

        period: computeDurationLabel(
          realRow.checkIn,
          realRow.checkOut
        ),

        // ── Productive Hours ────────────────────────────────────────────────

        hours: formatMinutes(
          workDurationMins
        ),

        // ── Check In IP ─────────────────────────────────────────────────────

        checkInIp:
          realRow.checkInIp || null,

        checkInIpValid:
          realRow.isCheckInIpAllowed ?? null,

        // ── Check Out IP ────────────────────────────────────────────────────

        checkOutIp:
          realRow.checkOutIp || null,

        checkOutIpValid:
          realRow.isCheckOutIpAllowed ?? null,

        // ── Regularization ──────────────────────────────────────────────────
        // Consumed by EmployeeAttendanceTable's canRegularize() / status pill
        // AND by RegularizationModal's pre-fill logic when editing a PENDING
        // request (Part 13/14).
        //
        // FIXED: previously only { id, status, reviewRemarks } were included.
        // The modal's edit pre-fill reads existingRequest.requestType,
        // .requestedCheckIn, .requestedCheckOut, .requestedStatus and
        // .reason — all of which were silently undefined before, so
        // re-opening a pending request for editing showed the *original*
        // attendance times and the auto-detected type instead of what the
        // employee had actually requested. Now the full set the modal
        // needs is passed through.

        regularization: regRow
          ? {
              id: regRow.id,
              status: regRow.status,
              requestType: regRow.requestType || null,
              requestedCheckIn: regRow.requestedCheckIn || null,
              requestedCheckOut: regRow.requestedCheckOut || null,
              requestedStatus: regRow.requestedStatus || null,
              reason: regRow.reason || null,
              reviewRemarks: regRow.reviewRemarks || null,
            }
          : null,

        // Used by date filter
        raw: dateStr,
      });

      continue;
    }

    // ── Future date ──────────────────────────────────────────────────────────

    if (isFuture) {
      rows.push(
        emptyRow(
          dateStr,
          dayOfWeek
        )
      );

      continue;
    }

    // ── Past date with no attendance ─────────────────────────────────────────

    rows.push({
      ...emptyRow(
        dateStr,
        dayOfWeek
      ),

      status: "Absent",
    });
  }

  return rows;
};
// ```