import React, { useState } from "react";

import {
  Search,
  X,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MinusCircle,
  ClipboardEdit,
  MessageSquareText,
  Send,
  Pencil,
} from "lucide-react";

import MonthYearPicker from "../user/MonthYearPicker";

const STATUS_OPTIONS = ["Present", "Absent", "Late", "Half Day"];

const STATUS_CONFIG = {
  Present: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-100",
    Icon: CheckCircle2,
  },

  Absent: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-100",
    Icon: XCircle,
  },

  Late: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
    Icon: AlertCircle,
  },

  "Half Day": {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100",
    Icon: MinusCircle,
  },

  "-": {
    bg: "bg-gray-50",
    text: "text-gray-400",
    border: "border-gray-100",
    Icon: MinusCircle,
  },
};

// UI: fixed min-width so Present / Absent / Half Day badges all occupy the
// same footprint and the Status column doesn't visually jitter row to row.
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["-"];

  const { Icon } = cfg;

  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 min-w-[86px] px-2.5 py-1 rounded-lg text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <Icon size={11} className="shrink-0" />
      {status || "-"}
    </span>
  );
};

const REG_STATUS_CONFIG = {
  PENDING: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
    label: "Pending review",
  },

  APPROVED: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-100",
    label: "Approved",
  },

  REJECTED: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-100",
    label: "Rejected",
  },
};

const RegularizationPill = ({ status }) => {
  const cfg = REG_STATUS_CONFIG[status];

  if (!cfg) return null;

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {cfg.label}
    </span>
  );
};

const IpStatus = ({ ip, isValid }) => {
  if (!ip) {
    return <span className="text-[10px] font-medium text-gray-300">-</span>;
  }

  if (isValid === true) {
    return (
      <p className="mt-1 text-[10px] font-semibold text-emerald-600">
        ✓ Verified
      </p>
    );
  }

  if (isValid === false) {
    return (
      <p className="mt-1 text-[10px] font-semibold text-red-500">✕ Invalid IP</p>
    );
  }

  return (
    <p className="mt-1 text-[10px] font-semibold text-gray-500">
      IP Not Verified
    </p>
  );
};

const parseHoursToMinutes = (hours) => {
  if (hours === null || hours === undefined || hours === "" || hours === "-") {
    return 0;
  }

  if (typeof hours === "number") {
    return Math.max(0, Math.round(hours));
  }

  const value = String(hours).trim();

  const longForm = value.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?$/i);

  if (longForm && (longForm[1] || longForm[2])) {
    const h = Number(longForm[1] || 0);
    const m = Number(longForm[2] || 0);

    return h * 60 + m;
  }

  if (value.includes(":")) {
    const [h, m] = value.split(":").map(Number);

    if (!Number.isNaN(h) && !Number.isNaN(m)) {
      return Math.max(0, h * 60 + m);
    }
  }

  const decimalHours = Number(value);

  return Number.isNaN(decimalHours)
    ? 0
    : Math.max(0, Math.round(decimalHours * 60));
};

// UI: same min-width treatment as StatusBadge so the Prod. Hours column
// stays aligned whether the value is "-" or "10h 05m".
const HoursBadge = ({ hours }) => {
  const totalMinutes = parseHoursToMinutes(hours);

  if (!totalMinutes) {
    return (
      <span className="inline-flex items-center justify-center gap-1 min-w-[76px] px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-400">
        <Clock size={11} className="shrink-0" />-
      </span>
    );
  }

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  const formattedHours = `${h}h ${String(m).padStart(2, "0")}m`;

  const decimalHours = totalMinutes / 60;

  const [gradient, textColor] =
    decimalHours >= 9
      ? ["from-blue-500 to-blue-600", "text-white"]
      : decimalHours >= 8
      ? ["from-emerald-500 to-emerald-600", "text-white"]
      : ["from-red-500 to-red-600", "text-white"];

  return (
    <span
      className={`inline-flex items-center justify-center gap-1 min-w-[76px] px-2.5 py-1 rounded-lg text-xs font-bold bg-linear-to-r ${gradient} ${textColor} shadow-sm tabular-nums`}
    >
      <Clock size={11} className="shrink-0" />
      {formattedHours}
    </span>
  );
};

const EmptyState = () => (
  <tr>
    <td colSpan={9}>
      <div className="py-20 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
          <CalendarDays size={24} className="text-gray-300" />
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-500">
            No records found
          </p>

          <p className="text-xs text-gray-400 mt-1">
            Try adjusting your filters
          </p>
        </div>
      </div>
    </td>
  </tr>
);

const REQUEST_TYPES = [
  { value: "MISSING_CHECK_IN", label: "Missing Check In" },
  { value: "MISSING_CHECK_OUT", label: "Missing Check Out" },
  { value: "MISSING_BOTH", label: "Missing Check In & Out" },
  { value: "INCORRECT_CHECK_IN", label: "Incorrect Check In" },
  { value: "INCORRECT_CHECK_OUT", label: "Incorrect Check Out" },
  { value: "WRONG_STATUS", label: "Wrong Attendance Status" },
  { value: "HALF_DAY", label: "Half Day" },
  { value: "OTHER", label: "Other" },
];

const STATUS_INPUT_OPTIONS = ["PRESENT", "ABSENT", "LATE", "HALF_DAY"];

/* ============================================================
   TIME HELPERS
============================================================ */

const toTimeInputValue = (value) => {
  if (!value || value === "-") return "";

  const str = String(value).trim();

  if (/^\d{2}:\d{2}$/.test(str)) {
    return str;
  }

  if (/^\d{2}:\d{2}:\d{2}/.test(str)) {
    return str.substring(0, 5);
  }

  const amPmMatch = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (amPmMatch) {
    let hours = Number(amPmMatch[1]);
    const minutes = amPmMatch[2];
    const period = amPmMatch[3].toUpperCase();

    if (period === "PM" && hours !== 12) {
      hours += 12;
    }

    if (period === "AM" && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  if (str.includes("T")) {
    const timePart = str.split("T")[1];

    if (timePart) {
      const match = timePart.match(/^(\d{2}):(\d{2})/);

      if (match) {
        return `${match[1]}:${match[2]}`;
      }
    }
  }

  const parsed = new Date(str);

  if (!Number.isNaN(parsed.getTime())) {
    return `${String(parsed.getHours()).padStart(2, "0")}:${String(
      parsed.getMinutes()
    ).padStart(2, "0")}`;
  }

  return "";
};

const getDateOnly = (value) => {
  if (!value) return "";

  const str = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  if (str.includes("T")) {
    return str.split("T")[0];
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getRegularizationId = (regularization) => {
  if (!regularization) return null;

  return (
    regularization.id ??
    regularization.regularizationId ??
    regularization.requestId ??
    null
  );
};

/* ============================================================
   TODAY HELPER
============================================================ */

const isToday = (dateValue) => {
  const recordDate = getDateOnly(dateValue);

  if (!recordDate) return false;

  const today = new Date();

  const todayString = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return recordDate === todayString;
};

/* ============================================================
   REGULARIZATION MODAL
============================================================ */

const RegularizationModal = ({ record, onClose, onSubmit }) => {
  const existingRequest = record.regularization || null;

  const isEdit = existingRequest?.status === "PENDING";

  const missingCheckIn = !record.checkIn || record.checkIn === "-";

  const missingCheckOut = !record.checkOut || record.checkOut === "-";

  const defaultType =
    missingCheckIn && missingCheckOut
      ? "MISSING_BOTH"
      : missingCheckIn
      ? "MISSING_CHECK_IN"
      : missingCheckOut
      ? "MISSING_CHECK_OUT"
      : "OTHER";

  const initialRequestType =
    existingRequest?.requestType || existingRequest?.type || defaultType;

  const initialCheckIn =
    toTimeInputValue(existingRequest?.requestedCheckIn) ||
    toTimeInputValue(record.checkIn);

  const initialCheckOut =
    toTimeInputValue(existingRequest?.requestedCheckOut) ||
    toTimeInputValue(record.checkOut);

  const initialStatus = existingRequest?.requestedStatus || "";

  const initialReason = existingRequest?.reason || "";

  const [requestType, setRequestType] = useState(initialRequestType);

  const [checkIn, setCheckIn] = useState(initialCheckIn);

  const [checkOut, setCheckOut] = useState(initialCheckOut);

  const [requestedStatus, setRequestedStatus] = useState(initialStatus);

  const [reason, setReason] = useState(initialReason);

  const [error, setError] = useState("");

  const needsStatus = ["WRONG_STATUS", "HALF_DAY"].includes(requestType);

  const needsCheckIn = [
    "MISSING_CHECK_IN",
    "MISSING_BOTH",
    "INCORRECT_CHECK_IN",
  ].includes(requestType);

  const needsCheckOut = [
    "MISSING_CHECK_OUT",
    "MISSING_BOTH",
    "INCORRECT_CHECK_OUT",
  ].includes(requestType);

  const combineDateTime = (dateValue, timeValue) => {
    const date = getDateOnly(dateValue);

    if (!date || !timeValue) {
      return null;
    }

    return `${date}T${timeValue}:00`;
  };

  const handleSubmit = () => {
    setError("");

    if (needsCheckIn && !checkIn) {
      setError("Enter the check-in time.");
      return;
    }

    if (needsCheckOut && !checkOut) {
      setError("Enter the check-out time.");
      return;
    }

    if (needsStatus && !requestedStatus) {
      setError("Select the requested status.");
      return;
    }

    if (!reason.trim()) {
      setError("Reason is required.");
      return;
    }

    const payload = {
      attendanceId: record.attendanceId ?? record.id,

      regularizationId: isEdit ? getRegularizationId(existingRequest) : null,

      isEdit,

      requestType,

      requestedCheckIn: checkIn ? combineDateTime(record.raw, checkIn) : null,

      requestedCheckOut: checkOut ? combineDateTime(record.raw, checkOut) : null,

      requestedStatus: needsStatus ? requestedStatus : null,

      reason: reason.trim(),
    };

    onSubmit(payload);
  };

  // UI: one shared class for every control in this modal so selects,
  // time inputs and the textarea all line up on the same 42px grid.
  const fieldShell =
    "mt-2 flex items-center gap-2 h-[42px] border border-gray-200 rounded-lg px-3 bg-white focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-100 transition";

  const labelClass =
    "text-[11px] font-bold text-gray-500 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center shrink-0">
              <ClipboardEdit size={16} className="text-orange-500" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#0F265C]">
                {isEdit ? "Edit regularization" : "Regularize attendance"}
              </h2>

              <p className="text-[11px] text-gray-400 mt-0.5">
                {record.date} · {record.dayOfWeek}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* CURRENT ATTENDANCE */}
        <div className="px-6 pt-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 border border-gray-100 px-3.5 py-3">
              <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                Recorded In
              </p>

              <p className="mt-1.5 text-sm font-semibold text-gray-700">
                {record.checkIn || "-"}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-100 px-3.5 py-3">
              <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                Recorded Out
              </p>

              <p className="mt-1.5 text-sm font-semibold text-gray-700">
                {record.checkOut || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="px-6 py-5 space-y-5">
          {/* REQUEST TYPE */}
          <div>
            <label className={labelClass}>Request type</label>

            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="mt-2 w-full h-[42px] border border-gray-200 rounded-lg px-3 text-sm text-gray-700 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 bg-white transition"
            >
              {REQUEST_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* CHECK IN / CHECK OUT */}
          <div className="grid grid-cols-2 gap-4">
            {/* CHECK IN */}
            <div>
              <label className={labelClass}>Check In</label>

              <div className={fieldShell}>
                <Clock size={14} className="text-gray-400 shrink-0" />

                <input
                  type="time"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="outline-none text-sm flex-1 bg-transparent text-gray-700"
                />
              </div>

              <p className="mt-1.5 text-[10px] text-gray-400">
                Existing:{" "}
                <span className="font-semibold text-gray-500">
                  {record.checkIn && record.checkIn !== "-"
                    ? record.checkIn
                    : "Not punched"}
                </span>
              </p>
            </div>

            {/* CHECK OUT */}
            <div>
              <label className={labelClass}>Check Out</label>

              <div className={fieldShell}>
                <Clock size={14} className="text-gray-400 shrink-0" />

                <input
                  type="time"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="outline-none text-sm flex-1 bg-transparent text-gray-700"
                />
              </div>

              <p className="mt-1.5 text-[10px] text-gray-400">
                Existing:{" "}
                <span className="font-semibold text-gray-500">
                  {record.checkOut && record.checkOut !== "-"
                    ? record.checkOut
                    : "Not punched"}
                </span>
              </p>
            </div>
          </div>

          {/* STATUS */}
          {needsStatus && (
            <div>
              <label className={labelClass}>Requested status</label>

              <select
                value={requestedStatus}
                onChange={(e) => setRequestedStatus(e.target.value)}
                className="mt-2 w-full h-[42px] border border-gray-200 rounded-lg px-3 text-sm text-gray-700 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 bg-white transition"
              >
                <option value="">Select status</option>

                {STATUS_INPUT_OPTIONS.map((statusValue) => (
                  <option key={statusValue} value={statusValue}>
                    {statusValue.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* REASON */}
          <div>
            <label className={labelClass}>Reason</label>

            <div className="mt-2 flex items-start gap-2 border border-gray-200 rounded-lg px-3 py-3 bg-white focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-100 transition">
              <MessageSquareText
                size={14}
                className="text-gray-400 shrink-0 mt-0.5"
              />

              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Explain what happened, e.g. forgot to punch out before leaving"
                className="outline-none text-sm flex-1 bg-transparent text-gray-700 placeholder-gray-400 resize-none leading-relaxed"
              />
            </div>

            <p className="mt-1.5 text-[11px] text-gray-400 text-right tabular-nums">
              {reason.length}/500
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <p className="text-xs font-semibold text-red-500">{error}</p>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-50 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold text-white bg-[#0F265C] hover:bg-[#0F265C]/90 transition shadow-sm"
          >
            <Send size={14} />

            {isEdit ? "Update request" : "Submit request"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   EMPLOYEE ATTENDANCE TABLE
============================================================ */

const EmployeeAttendanceTable = ({
  records = [],
  year,
  month,
  onMonthChange,
  onSubmitRegularization,
  onGoToRegularization,
}) => {
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  const [activeRecord, setActiveRecord] = useState(null);

  /* ==========================================================
     FILTER
  ========================================================== */

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();

    const matchSearch =
      r.date?.toLowerCase().includes(q) || r.status?.toLowerCase().includes(q);

    const matchStatus = status ? r.status === status : true;

    return matchSearch && matchStatus;
  });

  /* ==========================================================
     COUNTS
  ========================================================== */

  const presentCount = records.filter((r) => r.status === "Present").length;

  const absentCount = records.filter((r) => r.status === "Absent").length;

  const lateCount = records.filter((r) => r.status === "Late").length;

  /* ==========================================================
     CAN REGULARIZE
  ========================================================== */

  const canRegularize = (r) => {
    if (!r.raw) return false;

    /*
     * Future date cannot be regularized
     */
    if (new Date(r.raw) > new Date()) {
      return false;
    }

    /*
     * Approved request cannot be changed
     */
    if (r.regularization?.status === "APPROVED") {
      return false;
    }

    /*
     * Pending request can always be edited
     * until HR/Admin approves it.
     */
    if (r.regularization?.status === "PENDING") {
      return true;
    }

    /*
     * Rejected or no request:
     * allow regularization only when
     * check-in or check-out is missing.
     */
    const missingCheckIn = !r.checkIn || r.checkIn === "-";

    const missingCheckOut = !r.checkOut || r.checkOut === "-";

    return missingCheckIn || missingCheckOut;
  };

  /* ==========================================================
     MODAL SUBMIT
  ========================================================== */

  const handleModalSubmit = async (payload) => {
    try {
      await onSubmitRegularization?.(payload);

      setActiveRecord(null);
    } catch (error) {
      console.error("Regularization request failed:", error);
    }
  };

  /* ==========================================================
     ACTION BUTTON
  ========================================================== */

  const renderAction = (record) => {
    const regStatus = record.regularization?.status;

    /*
     * APPROVED
     *
     * Cannot edit.
     */
    if (regStatus === "APPROVED") {
      return <RegularizationPill status="APPROVED" />;
    }

    /*
     * PENDING
     *
     * Can be edited multiple times
     * until HR/Admin approves it.
     */
    if (regStatus === "PENDING") {
      return (
        <div className="inline-flex items-center gap-2">
          <RegularizationPill status="PENDING" />

          <button
            type="button"
            title="Edit regularization"
            onClick={() => setActiveRecord(record)}
            className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-[#0F265C] border border-gray-200 bg-white hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition shrink-0"
          >
            <Pencil size={13} />
          </button>
        </div>
      );
    }

    /*
     * REJECTED
     *
     * User can submit again.
     */
    if (regStatus === "REJECTED") {
      return (
        <button
          type="button"
          onClick={() => setActiveRecord(record)}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-semibold text-orange-600 border border-orange-100 bg-orange-50 hover:bg-orange-100 transition"
        >
          <ClipboardEdit size={11} />
          Regularize
        </button>
      );
    }

    /*
     * NO REQUEST
     */
    if (canRegularize(record)) {
      return (
        <button
          type="button"
          onClick={() => setActiveRecord(record)}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-semibold text-orange-600 border border-orange-100 bg-orange-50 hover:bg-orange-100 transition"
        >
          <ClipboardEdit size={11} />
          Regularize
        </button>
      );
    }

    return <span className="text-xs text-gray-300">-</span>;
  };

  /* ==========================================================
     UI
  ========================================================== */

  // UI: shared header-cell + summary-chip classes so every column header
  // and every count chip is identical in size and weight.
  const thClass =
    "px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap";

  const chipClass =
    "inline-flex items-center gap-1.5 h-7 px-3 text-xs font-semibold rounded-full border";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center shrink-0">
            <CalendarDays size={16} className="text-orange-500" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-[#0F265C]">My Attendance</h2>

            <p className="text-[11px] text-gray-400 mt-0.5">
              Personal attendance history — full month
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`${chipClass} bg-emerald-50 border-emerald-100 text-emerald-700`}
          >
            <CheckCircle2 size={11} />
            {presentCount} Present
          </span>

          <span
            className={`${chipClass} bg-amber-50 border-amber-100 text-amber-600`}
          >
            <AlertCircle size={11} />
            {lateCount} Late
          </span>

          <span className={`${chipClass} bg-red-50 border-red-100 text-red-600`}>
            <XCircle size={11} />
            {absentCount} Absent
          </span>

          {/* CLICKABLE REGULARIZATION */}
          <button
            type="button"
            onClick={onGoToRegularization}
            className={`${chipClass} bg-red-50 border-red-100 text-red-600 cursor-pointer hover:bg-red-100 hover:border-red-200 transition`}
            title="View my regularization requests"
          >
            <ClipboardEdit size={11} />
            Regularization
          </button>
        </div>
      </div>

      {/* FILTERS — every control pinned to the same 38px height */}
      <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-center gap-2">
        <MonthYearPicker year={year} month={month} onChange={onMonthChange} />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-[38px] border border-gray-200 rounded-lg px-3 text-xs font-medium text-gray-600 outline-none focus:border-orange-400 bg-white hover:border-gray-300 transition cursor-pointer"
        >
          <option value="">All Statuses</option>

          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 h-[38px] border border-gray-200 rounded-lg px-3 bg-white hover:border-gray-300 transition w-56 focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-100">
            <Search size={14} className="text-gray-400 shrink-0" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="outline-none text-xs flex-1 placeholder-gray-400 bg-transparent"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-gray-400 hover:text-gray-600 shrink-0"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/50">
            <tr className="text-left border-b border-gray-100">
              <th className={thClass}>Date</th>
              <th className={thClass}>Check In</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Check Out</th>
              <th className={thClass}>Break</th>
              <th className={thClass}>Late</th>
              <th className={thClass}>Overtime</th>
              <th className={thClass}>Prod. Hours</th>
              <th className={thClass}>Regularization</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              filtered.map((r, idx) => {
                const todayRecord = isToday(r.raw);

                return (
                  <tr
                    key={r.id ?? r.attendanceId ?? idx}
                    className={`group transition-colors hover:bg-orange-50/30 ${
                      todayRecord
                        ? "bg-orange-50/70 border-l-4 border-l-orange-500"
                        : idx % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50/30"
                    } border-b border-gray-50 last:border-0`}
                  >
                    {/* DATE */}
                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                            todayRecord
                              ? "bg-orange-100 border-orange-200"
                              : "bg-[#0F265C]/5 border-[#0F265C]/10"
                          }`}
                        >
                          <span
                            className={`text-[10px] font-black tabular-nums ${
                              todayRecord ? "text-orange-600" : "text-[#0F265C]"
                            }`}
                          >
                            {r.date?.split(" ")[0]}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm font-semibold whitespace-nowrap ${
                                todayRecord
                                  ? "text-orange-600"
                                  : "text-gray-800"
                              }`}
                            >
                              {r.date}
                            </p>

                            {todayRecord && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wide bg-orange-100 text-orange-600 border border-orange-200">
                                TODAY
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {r.dayOfWeek}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* CHECK IN */}
                    <td className="px-6 py-4 align-middle">
                      <div>
                        <span
                          className={`text-sm font-semibold ${
                            r.checkIn !== "-" ? "text-gray-700" : "text-gray-300"
                          }`}
                        >
                          {r.checkIn || "-"}
                        </span>

                        <IpStatus ip={r.checkInIp} isValid={r.checkInIpValid} />
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4 align-middle">
                      <StatusBadge status={r.status} />
                    </td>

                    {/* CHECK OUT */}
                    <td className="px-6 py-4 align-middle">
                      <div>
                        <span
                          className={`text-sm font-semibold ${
                            r.checkOut !== "-"
                              ? "text-gray-600"
                              : "text-gray-300"
                          }`}
                        >
                          {r.checkOut || "-"}
                        </span>

                        <IpStatus
                          ip={r.checkOutIp}
                          isValid={r.checkOutIpValid}
                        />
                      </div>
                    </td>

                    {/* BREAK */}
                    <td className="px-6 py-4 align-middle">
                      <span
                        className={`text-sm tabular-nums ${
                          r.breakTime !== "-"
                            ? "text-amber-600 font-medium"
                            : "text-gray-300"
                        }`}
                      >
                        {r.breakTime || "-"}
                      </span>
                    </td>

                    {/* LATE */}
                    <td className="px-6 py-4 align-middle">
                      <span
                        className={`text-sm tabular-nums ${
                          r.late !== "-"
                            ? "text-red-500 font-semibold"
                            : "text-gray-300"
                        }`}
                      >
                        {r.late || "-"}
                      </span>
                    </td>

                    {/* OVERTIME */}
                    <td className="px-6 py-4 align-middle">
                      <span
                        className={`text-sm tabular-nums ${
                          r.overtime !== "-"
                            ? "text-blue-500 font-semibold"
                            : "text-gray-300"
                        }`}
                      >
                        {r.overtime || "-"}
                      </span>
                    </td>

                    {/* PRODUCTIVE HOURS */}
                    <td className="px-6 py-4 align-middle">
                      <HoursBadge hours={r.hours} />
                    </td>

                    {/* REGULARIZATION */}
                    <td className="px-6 py-4 align-middle">
                      {renderAction(r)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="px-6 py-4 border-t border-gray-100">
        <span className="text-xs text-gray-400 font-medium">
          Showing{" "}
          <span className="font-bold text-gray-600">{filtered.length}</span> days
          this month
        </span>
      </div>

      {/* MODAL */}
      {activeRecord && (
        <RegularizationModal
          record={activeRecord}
          onClose={() => setActiveRecord(null)}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
};

export default EmployeeAttendanceTable;