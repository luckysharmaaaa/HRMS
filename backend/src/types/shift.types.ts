export interface ShiftMaster {
  id: number;
  shiftName: string;
  shiftCode: string | null;
  startTime: string;
  endTime: string;
  durationHours: number;
  breakMinutes: number;
  graceMinutes: number;
  isNightShift: number;
  status: "0" | "1";
  createdAt: number | null;
  createdBy: number | null;
  updatedAt: number | null;
  updatedBy: number | null;
  trashedAt: number | null;
  trashedBy: number | null;
}

export interface CreateShiftInput {
  shiftName: string;
  shiftCode?: string | null;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  graceMinutes?: number;
  isNightShift?: boolean;
  status?: boolean;
  createdBy?: number | null;
}

export interface UpdateShiftInput {
  shiftName?: string;
  shiftCode?: string | null;
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
  graceMinutes?: number;
  isNightShift?: boolean;
  status?: boolean;
  updatedBy?: number | null;
}

export interface EmployeeShiftRow {
  id: number;
  employeeId: number;
  shiftId: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  assignedBy: number | null;
  notes: string | null;
  createdAt: number | null;
  createdBy: number | null;
  updatedAt: number | null;
  updatedBy: number | null;
}

export interface EmployeeShiftWithDetails extends EmployeeShiftRow {
  shiftName: string;
  shiftCode: string | null;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  graceMinutes: number;
  isNightShift: number;
}

export interface AssignShiftInput {
  shiftId: number;
  effectiveFrom: string;
  notes?: string | null;
  assignedBy?: number | null;
}