import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../db/connection";
import { ApiError } from "../utils/apiError";
import {
  LeaveSetting,
  LeaveBalanceRow,
  LeaveApplicationRow,
  ApplyLeaveInput,
  EmployeeLeaveFilters,
  AdminLeaveFilters,
  LeaveDayType,
} from "../types/leave.types";

const nowEpoch = (): number => Math.floor(Date.now() / 1000);

// ============================================================
// LEAVE TYPES (leave_setting)
// ============================================================

export const getActiveLeaveTypes = async (): Promise<LeaveSetting[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT id, leaveCode, leaveName, leavePerMonth, maxBalance,
             carryForward, maxCarryForward, allowHalfDay, isPaid, status
      FROM leave_setting
      WHERE status = '1' AND trashedAt IS NULL
      ORDER BY leaveName ASC
    `,
  );
  return rows as unknown as LeaveSetting[];
};

export const getAllLeaveSettings = async (): Promise<LeaveSetting[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT id, leaveCode, leaveName, leavePerMonth, maxBalance,
             carryForward, maxCarryForward, allowHalfDay, isPaid, status
      FROM leave_setting
      WHERE trashedAt IS NULL
      ORDER BY leaveName ASC
    `,
  );
  return rows as unknown as LeaveSetting[];
};

const getLeaveSettingById = async (id: number): Promise<LeaveSetting | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM leave_setting WHERE id = ? AND trashedAt IS NULL LIMIT 1`,
    [id],
  );
  return rows.length ? (rows[0] as unknown as LeaveSetting) : null;
};

const isLeaveCodeTaken = async (
  leaveCode: string,
  excludeId?: number,
): Promise<boolean> => {
  const params: unknown[] = [leaveCode];
  let sql = `SELECT id FROM leave_setting WHERE leaveCode = ? AND trashedAt IS NULL`;
  if (excludeId) {
    sql += ` AND id != ?`;
    params.push(excludeId);
  }
  const [rows] = await pool.query<RowDataPacket[]>(sql, params);
  return rows.length > 0;
};

export const createLeaveSetting = async (
  input: Partial<LeaveSetting> & { leaveCode: string; leaveName: string },
  userId: number,
): Promise<LeaveSetting> => {
  if (await isLeaveCodeTaken(input.leaveCode)) {
    throw ApiError.badRequest(`Leave code "${input.leaveCode}" already exists`);
  }

  const [result] = await pool.query<ResultSetHeader>(
    `
      INSERT INTO leave_setting
        (leaveCode, leaveName, leavePerMonth, maxBalance, carryForward,
         maxCarryForward, allowHalfDay, isPaid, status, createdAt, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, '1', ?, ?)
    `,
    [
      input.leaveCode,
      input.leaveName,
      input.leavePerMonth ?? 0,
      input.maxBalance ?? 0,
      input.carryForward ?? 0,
      input.maxCarryForward ?? 0,
      input.allowHalfDay ?? 1,
      input.isPaid ?? 1,
      nowEpoch(),
      userId,
    ],
  );

  const created = await getLeaveSettingById(result.insertId);
  if (!created) throw ApiError.badRequest("Failed to create leave setting");
  return created;
};

export const updateLeaveSetting = async (
  id: number,
  updates: Partial<LeaveSetting>,
  userId: number,
): Promise<LeaveSetting> => {
  const existing = await getLeaveSettingById(id);
  if (!existing) throw ApiError.notFound("Leave setting not found");

  if (
    updates.leaveCode &&
    updates.leaveCode !== existing.leaveCode &&
    (await isLeaveCodeTaken(updates.leaveCode, id))
  ) {
    throw ApiError.badRequest(`Leave code "${updates.leaveCode}" already exists`);
  }

  const fields: string[] = [];
  const params: unknown[] = [];

  const allowed: (keyof LeaveSetting)[] = [
    "leaveCode",
    "leaveName",
    "leavePerMonth",
    "maxBalance",
    "carryForward",
    "maxCarryForward",
    "allowHalfDay",
    "isPaid",
    "status",
  ];

  for (const field of allowed) {
    if (updates[field] !== undefined) {
      fields.push(`${field} = ?`);
      params.push(updates[field]);
    }
  }

  if (fields.length === 0) return existing;

  fields.push("updatedAt = ?", "updatedBy = ?");
  params.push(nowEpoch(), userId, id);

  await pool.query(
    `UPDATE leave_setting SET ${fields.join(", ")} WHERE id = ?`,
    params,
  );

  const updated = await getLeaveSettingById(id);
  if (!updated) throw ApiError.notFound("Leave setting not found");
  return updated;
};

// ============================================================
// LEAVE BALANCE
// ============================================================

export const getEmployeeBalance = async (
  employeeId: number,
): Promise<LeaveBalanceRow[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        lb.id, lb.employeeId, lb.leaveSettingId,
        ls.leaveCode, ls.leaveName,
        lb.creditedLeave, lb.usedLeave, lb.balanceLeave, lb.lastCreditDate
      FROM leave_balance lb
      INNER JOIN leave_setting ls ON ls.id = lb.leaveSettingId
      WHERE lb.employeeId = ? AND lb.trashedAt IS NULL AND ls.status = '1'
      ORDER BY ls.leaveName ASC
    `,
    [employeeId],
  );
  return rows as unknown as LeaveBalanceRow[];
};

// Ensures a balance row exists for employee+leaveSetting; creates one at zero if missing.
const ensureBalanceRow = async (
  employeeId: number,
  leaveSettingId: number,
): Promise<LeaveBalanceRow> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM leave_balance WHERE employeeId = ? AND leaveSettingId = ? LIMIT 1`,
    [employeeId, leaveSettingId],
  );

  if (rows.length > 0) return rows[0] as unknown as LeaveBalanceRow;

  // First time this employee touches this leave type — grant the
  // leave type's full maxBalance as their initial credit. Without
  // this, every new balance row starts at 0/0/0 and Apply Leave
  // would always fail with "Insufficient leave balance".
  const leaveSetting = await getLeaveSettingById(leaveSettingId);
  const initialCredit = Number(leaveSetting?.maxBalance ?? 0);

  const [result] = await pool.query<ResultSetHeader>(
    `
      INSERT INTO leave_balance
        (employeeId, leaveSettingId, creditedLeave, usedLeave, balanceLeave, createdAt)
      VALUES (?, ?, ?, 0, ?, ?)
    `,
    [employeeId, leaveSettingId, initialCredit, initialCredit, nowEpoch()],
  );

  const [created] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM leave_balance WHERE id = ?`,
    [result.insertId],
  );
  return created[0] as unknown as LeaveBalanceRow;
};

// ============================================================
// DAY COUNT CALCULATION
// ============================================================

export const calcTotalDays = (
  startDate: string,
  endDate: string,
  dayType: LeaveDayType,
): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays =
    Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;

  if (diffDays <= 0) {
    throw ApiError.badRequest("End date must be on or after start date");
  }

  if (dayType !== "FULL_DAY") {
    if (diffDays !== 1) {
      throw ApiError.badRequest(
        "Half day leave must have the same start and end date",
      );
    }
    return 0.5;
  }

  return diffDays;
};

// ============================================================
// OVERLAP CHECK
// ============================================================

const hasOverlappingLeave = async (
  employeeId: number,
  startDate: string,
  endDate: string,
  excludeApplicationId?: number,
): Promise<boolean> => {
  const params: unknown[] = [employeeId, endDate, startDate];
  let sql = `
    SELECT id FROM leave_application
    WHERE employeeId = ?
      AND leaveStatus IN ('PENDING','APPROVED')
      AND trashedAt IS NULL
      AND startDate <= ?
      AND endDate >= ?
  `;

  if (excludeApplicationId) {
    sql += ` AND id != ?`;
    params.push(excludeApplicationId);
  }

  const [rows] = await pool.query<RowDataPacket[]>(sql, params);
  return rows.length > 0;
};

// ============================================================
// APPLY FOR LEAVE
// ============================================================

export const applyLeave = async (
  employeeId: number,
  userId: number,
  input: ApplyLeaveInput,
): Promise<LeaveApplicationRow> => {
  const leaveSetting = await getLeaveSettingById(input.leaveTypeId);
  if (!leaveSetting || leaveSetting.status !== "1") {
    throw ApiError.badRequest("Invalid or inactive leave type");
  }

  if (input.dayType !== "FULL_DAY" && !leaveSetting.allowHalfDay) {
    throw ApiError.badRequest("Half day is not allowed for this leave type");
  }

  const totalDays = calcTotalDays(
    input.startDate,
    input.endDate,
    input.dayType,
  );

  const overlapping = await hasOverlappingLeave(
    employeeId,
    input.startDate,
    input.endDate,
  );
  if (overlapping) {
    throw ApiError.badRequest(
      "You already have a leave request for these dates",
    );
  }

  if (leaveSetting.isPaid) {
    const balance = await ensureBalanceRow(employeeId, leaveSetting.id);
    if (balance.balanceLeave < totalDays) {
      throw ApiError.badRequest("Insufficient leave balance");
    }
  }

  const [result] = await pool.query<ResultSetHeader>(
    `
      INSERT INTO leave_application
        (employeeId, leaveTypeId, startDate, endDate, dayType, totalDays,
         reason, leaveStatus, createdAt, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `,
    [
      employeeId,
      input.leaveTypeId,
      input.startDate,
      input.endDate,
      input.dayType,
      totalDays,
      input.reason,
      nowEpoch(),
      userId,
    ],
  );

  const created = await getApplicationById(result.insertId);
  if (!created) throw ApiError.badRequest("Failed to create leave application");
  return created;
};

// ============================================================
// GET APPLICATION BY ID
// ============================================================

export const getApplicationById = async (
  id: number,
): Promise<LeaveApplicationRow | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM leave_application WHERE id = ? AND trashedAt IS NULL LIMIT 1`,
    [id],
  );
  return rows.length ? (rows[0] as unknown as LeaveApplicationRow) : null;
};

// ============================================================
// EDIT APPLICATION (only own PENDING requests)
// ============================================================

export const editApplication = async (
  id: number,
  employeeId: number,
  input: ApplyLeaveInput,
): Promise<LeaveApplicationRow> => {
  const existing = await getApplicationById(id);
  if (!existing) throw ApiError.notFound("Leave application not found");
  if (existing.employeeId !== employeeId) {
    throw ApiError.forbidden("You cannot edit this leave application");
  }
  if (existing.leaveStatus !== "PENDING") {
    throw ApiError.badRequest("Only pending requests can be edited");
  }

  const leaveSetting = await getLeaveSettingById(input.leaveTypeId);
  if (!leaveSetting || leaveSetting.status !== "1") {
    throw ApiError.badRequest("Invalid or inactive leave type");
  }

  const totalDays = calcTotalDays(
    input.startDate,
    input.endDate,
    input.dayType,
  );

  const overlapping = await hasOverlappingLeave(
    employeeId,
    input.startDate,
    input.endDate,
    id,
  );
  if (overlapping) {
    throw ApiError.badRequest(
      "You already have a leave request for these dates",
    );
  }

  if (leaveSetting.isPaid) {
    const balance = await ensureBalanceRow(employeeId, leaveSetting.id);
    if (balance.balanceLeave < totalDays) {
      throw ApiError.badRequest("Insufficient leave balance");
    }
  }

  await pool.query(
    `
      UPDATE leave_application
      SET leaveTypeId = ?, startDate = ?, endDate = ?, dayType = ?,
          totalDays = ?, reason = ?, updatedAt = ?
      WHERE id = ?
    `,
    [
      input.leaveTypeId,
      input.startDate,
      input.endDate,
      input.dayType,
      totalDays,
      input.reason,
      nowEpoch(),
      id,
    ],
  );

  const updated = await getApplicationById(id);
  if (!updated) throw ApiError.notFound("Leave application not found");
  return updated;
};

// ============================================================
// CANCEL APPLICATION
// ============================================================

export const cancelApplication = async (
  id: number,
  employeeId: number,
): Promise<LeaveApplicationRow> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT * FROM leave_application WHERE id = ? AND trashedAt IS NULL FOR UPDATE`,
      [id],
    );

    if (rows.length === 0) throw ApiError.notFound("Leave application not found");
    const existing = rows[0] as unknown as LeaveApplicationRow;

    if (existing.employeeId !== employeeId) {
      throw ApiError.forbidden("You cannot cancel this leave application");
    }
    if (!["PENDING", "APPROVED"].includes(existing.leaveStatus)) {
      throw ApiError.badRequest("This request cannot be cancelled");
    }
    if (existing.leaveStatus === "APPROVED" && existing.startDate <= todayStr()) {
      throw ApiError.badRequest(
        "Approved leave that has already started cannot be cancelled",
      );
    }

    // Reverse balance + attendance if it was already approved
    if (existing.leaveStatus === "APPROVED") {
      await connection.query(
        `
          UPDATE leave_balance
          SET usedLeave = usedLeave - ?, balanceLeave = balanceLeave + ?, updatedAt = ?
          WHERE employeeId = ? AND leaveSettingId = ?
        `,
        [existing.totalDays, existing.totalDays, nowEpoch(), employeeId, existing.leaveTypeId],
      );

      await connection.query(
        `DELETE FROM attendance WHERE leaveApplicationId = ?`,
        [id],
      );
    }

    await connection.query(
      `UPDATE leave_application SET leaveStatus = 'CANCELLED', updatedAt = ? WHERE id = ?`,
      [nowEpoch(), id],
    );

    await connection.commit();

    const updated = await getApplicationById(id);
    if (!updated) throw ApiError.notFound("Leave application not found");
    return updated;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ============================================================
// EMPLOYEE: OWN APPLICATIONS LIST
// ============================================================

export const getEmployeeApplications = async (
  employeeId: number,
  filters: EmployeeLeaveFilters,
): Promise<{ rows: LeaveApplicationRow[]; total: number }> => {
  const safeLimit = Math.min(Math.max(filters.limit, 1), 100);
  const offset = (Math.max(filters.page, 1) - 1) * safeLimit;

  const conditions = ["la.employeeId = ?", "la.trashedAt IS NULL"];
  const params: unknown[] = [employeeId];

  if (filters.leaveTypeId) {
    conditions.push("la.leaveTypeId = ?");
    params.push(filters.leaveTypeId);
  }
  if (filters.status) {
    conditions.push("la.leaveStatus = ?");
    params.push(filters.status);
  }
  if (filters.startDate) {
    conditions.push("la.endDate >= ?");
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push("la.startDate <= ?");
    params.push(filters.endDate);
  }

  const where = conditions.join(" AND ");

  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT la.*, ls.leaveCode, ls.leaveName
      FROM leave_application la
      INNER JOIN leave_setting ls ON ls.id = la.leaveTypeId
      WHERE ${where}
      ORDER BY la.createdAt DESC
      LIMIT ? OFFSET ?
    `,
    [...params, safeLimit, offset],
  );

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM leave_application la WHERE ${where}`,
    params,
  );

  return {
    rows: rows as unknown as LeaveApplicationRow[],
    total: Number(countRows[0]?.total || 0),
  };
};

// ============================================================
// ADMIN: ALL APPLICATIONS LIST
// ============================================================

export const getAdminApplications = async (
  filters: AdminLeaveFilters,
): Promise<{ rows: LeaveApplicationRow[]; total: number }> => {
  const safeLimit = Math.min(Math.max(filters.limit, 1), 100);
  const offset = (Math.max(filters.page, 1) - 1) * safeLimit;

  const conditions = ["la.trashedAt IS NULL", "e.trashedAt IS NULL"];
  const params: unknown[] = [];

  if (filters.employeeId) {
    conditions.push("la.employeeId = ?");
    params.push(filters.employeeId);
  }
  if (filters.departmentId) {
    conditions.push("e.departmentId = ?");
    params.push(filters.departmentId);
  }
  if (filters.leaveTypeId) {
    conditions.push("la.leaveTypeId = ?");
    params.push(filters.leaveTypeId);
  }
  if (filters.status) {
    conditions.push("la.leaveStatus = ?");
    params.push(filters.status);
  }
  if (filters.startDate) {
    conditions.push("la.endDate >= ?");
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push("la.startDate <= ?");
    params.push(filters.endDate);
  }
  if (filters.search) {
    conditions.push(
      `(u.firstName LIKE ? OR u.lastName LIKE ? OR e.employeeCode LIKE ?)`,
    );
    const term = `%${filters.search.trim()}%`;
    params.push(term, term, term);
  }

  const where = conditions.join(" AND ");

  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        la.*, ls.leaveCode, ls.leaveName,
        e.employeeCode, u.firstName, u.lastName, e.departmentId
      FROM leave_application la
      INNER JOIN leave_setting ls ON ls.id = la.leaveTypeId
      INNER JOIN employee e ON e.id = la.employeeId
      INNER JOIN users u ON u.id = e.userId
      WHERE ${where}
      ORDER BY la.createdAt DESC
      LIMIT ? OFFSET ?
    `,
    [...params, safeLimit, offset],
  );

  const [countRows] = await pool.query<RowDataPacket[]>(
    `
      SELECT COUNT(*) AS total
      FROM leave_application la
      INNER JOIN employee e ON e.id = la.employeeId
      INNER JOIN users u ON u.id = e.userId
      WHERE ${where}
    `,
    params,
  );

  return {
    rows: rows as unknown as LeaveApplicationRow[],
    total: Number(countRows[0]?.total || 0),
  };
};

// ============================================================
// ADMIN: APPROVE APPLICATION
// ============================================================

export const approveApplication = async (
  id: number,
  reviewerUserId: number,
  reviewerEmployeeId: number,
  remarks?: string,
): Promise<LeaveApplicationRow> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT * FROM leave_application WHERE id = ? AND trashedAt IS NULL FOR UPDATE`,
      [id],
    );
    if (rows.length === 0) throw ApiError.notFound("Leave application not found");
    const application = rows[0] as unknown as LeaveApplicationRow;

    if (application.leaveStatus !== "PENDING") {
      throw ApiError.badRequest("Only pending requests can be approved");
    }

    const [settingRows] = await connection.query<RowDataPacket[]>(
      `SELECT * FROM leave_setting WHERE id = ?`,
      [application.leaveTypeId],
    );
    const leaveSetting = settingRows[0] as unknown as LeaveSetting;

    if (leaveSetting?.isPaid) {
      await connection.query(
        `
          INSERT INTO leave_balance (employeeId, leaveSettingId, creditedLeave, usedLeave, balanceLeave, createdAt)
          VALUES (?, ?, 0, ?, -?, ?)
          ON DUPLICATE KEY UPDATE
            usedLeave = usedLeave + ?, balanceLeave = balanceLeave - ?, updatedAt = ?
        `,
        [
          application.employeeId,
          application.leaveTypeId,
          application.totalDays,
          application.totalDays,
          nowEpoch(),
          application.totalDays,
          application.totalDays,
          nowEpoch(),
        ],
      );
    }

    await connection.query(
      `
        UPDATE leave_application
        SET leaveStatus = 'APPROVED', approvedBy = ?, approvedAt = ?, remarks = ?, updatedAt = ?
        WHERE id = ?
      `,
      [reviewerEmployeeId, nowEpoch(), remarks ?? null, nowEpoch(), id],
    );

    // Create ON_LEAVE attendance rows for each date in range
    const dates = getDateRange(application.startDate, application.endDate);
    for (const dateStr of dates) {
      await connection.query(
        `
          INSERT INTO attendance
            (employeeId, attendanceDate, attendanceStatus, leaveApplicationId, createdAt, createdBy, updatedAt, updatedBy)
          VALUES (?, ?, 'ON_LEAVE', ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            attendanceStatus = 'ON_LEAVE', leaveApplicationId = ?, updatedAt = ?, updatedBy = ?
        `,
        [
          application.employeeId,
          dateStr,
          id,
          nowEpoch(),
          reviewerUserId,
          nowEpoch(),
          reviewerUserId,
          id,
          nowEpoch(),
          reviewerUserId,
        ],
      );
    }

    await connection.commit();

    const updated = await getApplicationById(id);
    if (!updated) throw ApiError.notFound("Leave application not found");
    return updated;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ============================================================
// ADMIN: REJECT APPLICATION
// ============================================================

export const rejectApplication = async (
  id: number,
  reviewerEmployeeId: number,
  remarks: string,
): Promise<LeaveApplicationRow> => {
  const existing = await getApplicationById(id);
  if (!existing) throw ApiError.notFound("Leave application not found");
  if (existing.leaveStatus !== "PENDING") {
    throw ApiError.badRequest("Only pending requests can be rejected");
  }

  await pool.query(
    `
      UPDATE leave_application
      SET leaveStatus = 'REJECTED', approvedBy = ?, approvedAt = ?, remarks = ?, updatedAt = ?
      WHERE id = ?
    `,
    [reviewerEmployeeId, nowEpoch(), remarks, nowEpoch(), id],
  );

  const updated = await getApplicationById(id);
  if (!updated) throw ApiError.notFound("Leave application not found");
  return updated;
};

// ============================================================
// EMPLOYEE: LEAVE SUMMARY (stat cards)
// ============================================================

export const getEmployeeLeaveSummary = async (employeeId: number) => {
  const balances = await getEmployeeBalance(employeeId);

  const totalAllocated = balances.reduce((sum, b) => sum + Number(b.creditedLeave), 0);
  const totalUsed = balances.reduce((sum, b) => sum + Number(b.usedLeave), 0);
  const totalRemaining = balances.reduce((sum, b) => sum + Number(b.balanceLeave), 0);

  const [pendingRows] = await pool.query<RowDataPacket[]>(
    `
      SELECT COUNT(*) AS total FROM leave_application
      WHERE employeeId = ? AND leaveStatus = 'PENDING' AND trashedAt IS NULL
    `,
    [employeeId],
  );

  return {
    totalAllocated,
    totalUsed,
    totalRemaining,
    pendingRequests: Number(pendingRows[0]?.total || 0),
  };
};

// ============================================================
// ADMIN: LEAVE SUMMARY (stat cards)
// ============================================================

export const getAdminLeaveSummary = async () => {
  const [statusRows] = await pool.query<RowDataPacket[]>(
    `
      SELECT leaveStatus, COUNT(*) AS total
      FROM leave_application
      WHERE trashedAt IS NULL
      GROUP BY leaveStatus
    `,
  );

  const counts: Record<string, number> = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    CANCELLED: 0,
  };
  for (const row of statusRows) {
    counts[row.leaveStatus] = Number(row.total);
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const [onLeaveRows] = await pool.query<RowDataPacket[]>(
    `
      SELECT COUNT(*) AS total FROM leave_application
      WHERE leaveStatus = 'APPROVED'
        AND trashedAt IS NULL
        AND startDate <= ? AND endDate >= ?
    `,
    [todayStr, todayStr],
  );

  return {
    pending: counts.PENDING,
    approved: counts.APPROVED,
    rejected: counts.REJECTED,
    onLeaveToday: Number(onLeaveRows[0]?.total || 0),
  };
};

// ============================================================
// DATE RANGE HELPER
// ============================================================

const getDateRange = (start: string, end: string): string[] => {
  const dates: string[] = [];
  const current = new Date(start);
  const last = new Date(end);

  while (current <= last) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};