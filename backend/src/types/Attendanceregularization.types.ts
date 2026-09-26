export type RegularizationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type RegularizationRequestType =
  | "MISSING_CHECK_IN"
  | "MISSING_CHECK_OUT"
  | "MISSING_BOTH"
  | "INCORRECT_CHECK_IN"
  | "INCORRECT_CHECK_OUT"
  | "WRONG_STATUS"
  | "HALF_DAY"
  | "OTHER";

export interface AttendanceRegularizationRow {
  id: number;
  attendanceId: number;
  employeeId: number;
  requestType: RegularizationRequestType;
  requestedCheckIn: Date | string | null;
  requestedCheckOut: Date | string | null;
  requestedStatus: string | null;
  reason: string;
  status: RegularizationStatus;
  reviewedBy: number | null;
  reviewedAt: number | null;
  reviewRemarks: string | null;
  createdAt: number | null;
  createdBy: number | null;
  updatedAt: number | null;
  updatedBy: number | null;
}

// Employee-facing view: joined with the attendance row it targets.
export interface RegularizationWithAttendance extends AttendanceRegularizationRow {
  attendanceDate: string;
  currentCheckIn: Date | string | null;
  currentCheckOut: Date | string | null;
  currentStatus?: string;
}

// Reviewer-facing view: also joined with employee name/code.
export interface RegularizationForReview extends RegularizationWithAttendance {
  firstName: string;
  lastName: string;
  employeeCode: string;
}