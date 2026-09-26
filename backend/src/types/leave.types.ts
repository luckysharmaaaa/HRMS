export type LeaveDayType = "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF";

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface LeaveSetting {
  id: number;
  leaveCode: string;
  leaveName: string;
  leavePerMonth: number;
  maxBalance: number;
  carryForward: boolean;
  maxCarryForward: number;
  allowHalfDay: boolean;
  isPaid: boolean;
  status: "0" | "1";
}

export interface LeaveBalanceRow {
  id: number;
  employeeId: number;
  leaveSettingId: number;
  leaveCode: string;
  leaveName: string;
  creditedLeave: number;
  usedLeave: number;
  balanceLeave: number;
  lastCreditDate: string | null;
}

export interface LeaveApplicationRow {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  dayType: LeaveDayType;
  totalDays: number;
  reason: string | null;
  leaveStatus: LeaveStatus;
  approvedBy: number | null;
  approvedAt: number | null;
  remarks: string | null;
  createdAt: number | null;
  updatedAt: number | null;
}

export interface ApplyLeaveInput {
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  dayType: LeaveDayType;
  reason: string;
}

export interface EmployeeLeaveFilters {
  page: number;
  limit: number;
  leaveTypeId?: number;
  status?: LeaveStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface AdminLeaveFilters extends EmployeeLeaveFilters {
  employeeId?: number;
  departmentId?: number;
}