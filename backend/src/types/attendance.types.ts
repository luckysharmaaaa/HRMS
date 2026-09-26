export interface Shift {
  id: number;
  shiftName: string;
  shiftCode: string | null;
  startTime: string;      // "09:00:00"
  endTime: string;        // "18:00:00"
  breakMinutes: number;
  graceMinutes: number;
  isNightShift: number;   // 0 | 1
}

export interface AttendanceRow {
  id: number;
  employeeId: number;
  attendanceDate: string;
  shiftId: number | null;
  attendanceStatus: string;
  checkIn: string | null;
  checkOut: string | null;
  workDurationMins: number | null;
  isLate: number;
  lateMinutes: number;
  isEarlyDeparture: number;
  earlyDepartureMins: number;
  overtimeMins: number;
  checkInLocation: string | null;
  checkOutLocation: string | null;
  remarks: string | null;
}

export interface PunchResult {
  attendance: AttendanceRow;
  shift: Shift | null;
}

// ============================================================
// ADMIN ATTENDANCE
// ============================================================

export interface AdminAttendanceFilters {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  employeeId?: number;
  departmentId?: number;
  designationId?: number;
  status?: string; // "Present" | "Absent" | "Half Day" | "On Leave" | "Holiday" | "Weekend" | "Work From Home" | "Late"
  search?: string;
}

// Attendance row joined with employee/user/department/designation/shift
// details, plus IP-validity flags — everything the Admin table needs in
// a single record, no extra client-side calls per row.
//
// id/attendanceStatus/checkIn/etc. are nullable here (unlike the base
// AttendanceRow) because on single-date "full roster" views (see
// getAdminAttendanceList), an employee with no attendance row yet still
// appears — with every attendance-derived field null, not a fabricated
// "Absent". Never treat a null attendanceStatus as Absent on the client.
export interface AdminAttendanceRow extends Omit<AttendanceRow, "id" | "attendanceStatus"> {
  id: number | null;
  attendanceStatus: string | null;
  employeeId: number;
  employeeCode: string | null;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: number | null;
  departmentName: string | null;
  designationId: number | null;
  designationName: string | null;
  shiftName: string | null;
  shiftStart: string | null;
  shiftEnd: string | null;
  shiftBreakMinutes: number | null;
  checkInIp: string | null;
  checkOutIp: string | null;
  isCheckInIpAllowed: boolean | null;
  isCheckOutIpAllowed: boolean | null;
  // True when this row came from the employee roster (no attendance
  // record yet) rather than an actual attendance row.
  hasNoRecord: boolean;
}

// Payload for the Edit action (PATCH /attendance/admin/:id).
// All fields optional — Admin may only be correcting one thing.
export interface AdminAttendanceUpdatePayload {
  attendanceStatus?: string; // one of VALID_ATTENDANCE_STATUSES
  checkIn?: string | null;   // ISO datetime string, or null to clear
  checkOut?: string | null;  // ISO datetime string, or null to clear
  remarks?: string | null;
}

// ============================================================
// ADMIN ATTENDANCE SUMMARY (dashboard stat strip)
// ============================================================

export interface AdminAttendanceStat {
  count: number;
  changePct: number | null; // null when the comparison period's count was 0 and the current one wasn't (undefined % change)
}

// `date` is a single YYYY-MM-DD when startDate === endDate (single-day
// view), and null when a multi-day range is selected — use startDate/
// endDate in that case instead. changePct on each stat now compares the
// selected range against an equally-long PRECEDING range (e.g. a 15-day
// selection is compared against the preceding 15 days), not just "yesterday".
export interface AdminAttendanceSummary {
  date: string | null;
  startDate: string;
  endDate: string;
  totalEmployees: number;
  present: AdminAttendanceStat;
  absent: AdminAttendanceStat;
  lateLogin: AdminAttendanceStat;
  onLeave: AdminAttendanceStat;
  halfDay: AdminAttendanceStat;
}