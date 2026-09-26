// Shared formatting + labeling helpers for attendance regularization.
//
// Extracted from EmployeeRegularization.jsx so the admin review screen
// (RegularizationReview.jsx) renders the same date/time/type data the same
// way, instead of re-implementing its own (previously it was dumping raw
// String(requestedCheckIn) values). Import this from both screens.

export const REQUEST_TYPE_LABELS = {
  MISSING_CHECK_IN: "Missing Check In",
  MISSING_CHECK_OUT: "Missing Check Out",
  MISSING_BOTH: "Missing Check In & Out",
  INCORRECT_CHECK_IN: "Incorrect Check In",
  INCORRECT_CHECK_OUT: "Incorrect Check Out",
  WRONG_STATUS: "Wrong Attendance Status",
  HALF_DAY: "Half Day",
  OTHER: "Other",
};

export const formatDateLabel = (value) => {
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

export const formatTime = (value) => {
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
export const deriveRequestType = (request) => {
  if (request?.requestType && REQUEST_TYPE_LABELS[request.requestType]) {
    return REQUEST_TYPE_LABELS[request.requestType];
  }

  const { requestedCheckIn, requestedCheckOut } = request || {};

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