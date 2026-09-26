// Shared formatting + labeling helpers for attendance regularization.
//
// Extracted from EmployeeRegularization.jsx so the admin review screen
// (RegularizationReview.jsx) renders the same date/time/type data the same
// way, instead of re-implementing its own (previously it was dumping raw
// String(requestedCheckIn) values). Import this from both screens.

export type RegularizationRequestType =
  | "MISSING_CHECK_IN"
  | "MISSING_CHECK_OUT"
  | "MISSING_BOTH"
  | "INCORRECT_CHECK_IN"
  | "INCORRECT_CHECK_OUT"
  | "WRONG_STATUS"
  | "HALF_DAY"
  | "OTHER";

export type RegularizationRequestedStatus =
  | "PRESENT"
  | "ABSENT"
  | "HALF_DAY"
  | "ON_LEAVE"
  | "HOLIDAY"
  | "WEEKEND"
  | "WORK_FROM_HOME";

export type RegularizationStatus = "PENDING" | "APPROVED" | "REJECTED";

// Minimal shape this module needs. Extend/import your real
// AttendanceRegularizationRow type here instead if you have one on the
// frontend already (e.g. shared with the backend via a types package) --
// this local type exists only so the file is self-contained.
export interface RegularizationRequestLike {
  requestType?: RegularizationRequestType | null;
  requestedCheckIn?: string | Date | null;
  requestedCheckOut?: string | Date | null;
  requestedStatus?: RegularizationRequestedStatus | null;
  attendanceDate?: string | Date | null;
  status?: RegularizationStatus;
  reason?: string | null;
  reviewRemarks?: string | null;
  createdAt?: number | string | Date | null;
}

export const REQUEST_TYPE_LABELS: Record<RegularizationRequestType, string> = {
  MISSING_CHECK_IN: "Missing Check In",
  MISSING_CHECK_OUT: "Missing Check Out",
  MISSING_BOTH: "Missing Check In & Out",
  INCORRECT_CHECK_IN: "Incorrect Check In",
  INCORRECT_CHECK_OUT: "Incorrect Check Out",
  WRONG_STATUS: "Wrong Attendance Status",
  HALF_DAY: "Half Day",
  OTHER: "Other",
};

export const formatDateLabel = (
  value?: string | Date | null,
): string => {
  if (!value) return "-";

  const date =
    value instanceof Date
      ? value
      : new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatTime = (
  value?: string | Date | null,
): string | null => {
  if (!value) return null;

  const normalized = String(value).replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Prefers the requestType column (added by the 2026_09_02 migration).
// Falls back to deriving from check-in/out presence for any rows created
// before that column existed.
export const deriveRequestType = (
  request?: RegularizationRequestLike | null,
): string => {
  if (request?.requestType && REQUEST_TYPE_LABELS[request.requestType]) {
    return REQUEST_TYPE_LABELS[request.requestType];
  }

  const requestedCheckIn = request?.requestedCheckIn;
  const requestedCheckOut = request?.requestedCheckOut;

  if (requestedCheckIn && requestedCheckOut) {
    return "Missed Check In & Check Out";
  }
  if (requestedCheckIn) {
    return "Missed Check In";
  }
  if (requestedCheckOut) {
    return "Missed Check Out";
  }
  return "-";
};