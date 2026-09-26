import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../db/connection";
import { ApiError } from "../utils/apiError";
import { AttendanceRow, Shift } from "../types/attendance.types";
import {
  AttendanceRegularizationRow,
  RegularizationWithAttendance,
  RegularizationForReview,
  RegularizationStatus,
} from "../types/Attendanceregularization.types";
import { diffMinutes, getScheduledShiftWindow } from "../utils/shiftTime";

const getRegularizationById = async (
  id: number,
): Promise<AttendanceRegularizationRow | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM attendance_regularization WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows.length > 0 ? (rows[0] as unknown as AttendanceRegularizationRow) : null;
};

const toDateStr = (value: unknown): string => {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  const d = new Date(value as any);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getShiftById = async (shiftId: number): Promise<Shift | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        id, shiftName, shiftCode, startTime, endTime,
        breakMinutes, graceMinutes, isNightShift
      FROM shift
      WHERE id = ?
    `,
    [shiftId],
  );
  return rows.length > 0 ? (rows[0] as unknown as Shift) : null;
};

const VALID_REQUEST_TYPES = [
  "MISSING_CHECK_IN",
  "MISSING_CHECK_OUT",
  "MISSING_BOTH",
  "INCORRECT_CHECK_IN",
  "INCORRECT_CHECK_OUT",
  "WRONG_STATUS",
  "HALF_DAY",
  "OTHER",
];

const NEEDS_TIME_TYPES = [
  "MISSING_CHECK_IN",
  "MISSING_CHECK_OUT",
  "MISSING_BOTH",
  "INCORRECT_CHECK_IN",
  "INCORRECT_CHECK_OUT",
];

const NEEDS_STATUS_TYPES = ["WRONG_STATUS", "HALF_DAY"];

const validateRequestFields = (
  requestType: string,
  requestedCheckIn: string | null,
  requestedCheckOut: string | null,
  requestedStatus: string | null,
  reason: string,
) => {
  if (!VALID_REQUEST_TYPES.includes(requestType)) {
    throw ApiError.badRequest("Invalid requestType");
  }

  const needsTime = NEEDS_TIME_TYPES.includes(requestType);
  const needsStatus = NEEDS_STATUS_TYPES.includes(requestType);

  if (needsTime && !requestedCheckIn && !requestedCheckOut) {
    throw ApiError.badRequest(
      "Provide at least one of requestedCheckIn or requestedCheckOut",
    );
  }

  if (needsStatus && !requestedStatus) {
    throw ApiError.badRequest("requestedStatus is required for this request type");
  }

  if (!reason || !reason.trim()) {
    throw ApiError.badRequest("Reason is required");
  }

  if (reason.length > 500) {
    throw ApiError.badRequest("Reason must be 500 characters or fewer");
  }
};

export const submitRegularizationRequest = async (
  employeeId: number,
  userId: number,
  attendanceId: number,
  requestType: string,
  requestedCheckIn: string | null,
  requestedCheckOut: string | null,
  requestedStatus: string | null,
  reason: string,
): Promise<AttendanceRegularizationRow> => {
  if (!attendanceId) {
    throw ApiError.badRequest("attendanceId is required");
  }

  validateRequestFields(requestType, requestedCheckIn, requestedCheckOut, requestedStatus, reason);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [attRows] = await connection.query<RowDataPacket[]>(
      `SELECT * FROM attendance WHERE id = ? FOR UPDATE`,
      [attendanceId],
    );

    if (attRows.length === 0) {
      throw ApiError.notFound("Attendance record not found");
    }

    const attendance = attRows[0] as unknown as AttendanceRow;

    if (attendance.employeeId !== employeeId) {
      throw new ApiError("You can only regularize your own attendance", 403);
    }

    const [pendingRows] = await connection.query<RowDataPacket[]>(
      `
        SELECT id
        FROM attendance_regularization
        WHERE attendanceId = ?
          AND status = 'PENDING'
        FOR UPDATE
      `,
      [attendanceId],
    );

    if (pendingRows.length > 0) {
      throw new ApiError(
        "A regularization request for this date is already pending review. Edit the existing request instead of submitting a new one.",
        409,
      );
    }

    const nowEpoch = Math.floor(Date.now() / 1000);

    const [result] = await connection.query<ResultSetHeader>(
      `
        INSERT INTO attendance_regularization (
          attendanceId, employeeId, requestType, requestedCheckIn,
          requestedCheckOut, requestedStatus, reason, status,
          createdAt, createdBy, updatedAt, updatedBy
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?)
      `,
      [
        attendance.id,
        employeeId,
        requestType,
        requestedCheckIn ? new Date(requestedCheckIn) : null,
        requestedCheckOut ? new Date(requestedCheckOut) : null,
        requestedStatus,
        reason.trim(),
        nowEpoch,
        userId,
        nowEpoch,
        userId,
      ],
    );

    await connection.commit();

    const created = await getRegularizationById(result.insertId);

    if (!created) {
      throw new ApiError("Failed to create regularization request", 500);
    }

    return created;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ============================================================
// UPDATE REGULARIZATION REQUEST (edit while PENDING)
//
// FIXED: now takes `userId` separately from `employeeId`. The old
// version reused `employeeId` for the `updatedBy` audit column, but
// every other write in this file (createdBy on submit, updatedBy on
// approve/reject) stores users.id, not the employee record's own id.
// Reusing employeeId there was a silent audit-trail bug — it never
// affected the actual regularization logic, but any report or join
// reading "who last edited this" off updatedBy would get the wrong
// value.
// ============================================================

export const updateRegularizationRequest = async (
  employeeId: number,
  userId: number, // ADDED
  requestId: number,
  requestType: string,
  requestedCheckIn: string | null,
  requestedCheckOut: string | null,
  requestedStatus: string | null,
  reason: string,
): Promise<AttendanceRegularizationRow> => {
  if (!requestId) {
    throw ApiError.badRequest("requestId is required");
  }

  validateRequestFields(requestType, requestedCheckIn, requestedCheckOut, requestedStatus, reason);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT * FROM attendance_regularization WHERE id = ? FOR UPDATE`,
      [requestId],
    );

    if (rows.length === 0) {
      throw ApiError.notFound("Regularization request not found");
    }

    const existing = rows[0] as unknown as AttendanceRegularizationRow;

    if (existing.employeeId !== employeeId) {
      throw new ApiError("You can only edit your own regularization request", 403);
    }

    if (existing.status !== "PENDING") {
      throw new ApiError(
        `This request has already been ${existing.status.toLowerCase()} and can no longer be edited`,
        409,
      );
    }

    const nowEpoch = Math.floor(Date.now() / 1000);

    await connection.query(
      `
        UPDATE attendance_regularization
        SET
          requestType = ?,
          requestedCheckIn = ?,
          requestedCheckOut = ?,
          requestedStatus = ?,
          reason = ?,
          updatedAt = ?,
          updatedBy = ?
        WHERE id = ?
          AND status = 'PENDING'
      `,
      [
        requestType,
        requestedCheckIn ? new Date(requestedCheckIn) : null,
        requestedCheckOut ? new Date(requestedCheckOut) : null,
        requestedStatus,
        reason.trim(),
        nowEpoch,
        userId, // FIXED — was `employeeId`
        requestId,
      ],
    );

    await connection.commit();

    const updated = await getRegularizationById(requestId);

    if (!updated) {
      throw new ApiError("Failed to load updated regularization request", 500);
    }

    return updated;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const getMyRegularizationRequests = async (
  employeeId: number,
  page: number,
  limit: number,
  status?: RegularizationStatus,
): Promise<{ rows: RegularizationWithAttendance[]; total: number }> => {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit =
    Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
  const offset = (safePage - 1) * safeLimit;

  const statusClause = status ? "AND ar.status = ?" : "";
  const params: (string | number)[] = status
    ? [employeeId, status, safeLimit, offset]
    : [employeeId, safeLimit, offset];

  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        ar.*,
        a.attendanceDate,
        a.checkIn AS currentCheckIn,
        a.checkOut AS currentCheckOut,
        a.attendanceStatus AS currentStatus
      FROM attendance_regularization ar
      JOIN attendance a ON a.id = ar.attendanceId
      WHERE ar.employeeId = ?
        ${statusClause}
      ORDER BY ar.createdAt DESC
      LIMIT ? OFFSET ?
    `,
    params,
  );

  const countParams: (string | number)[] = status
    ? [employeeId, status]
    : [employeeId];

  const [countRows] = await pool.query<RowDataPacket[]>(
    `
      SELECT COUNT(*) AS total
      FROM attendance_regularization ar
      WHERE ar.employeeId = ?
        ${statusClause}
    `,
    countParams,
  );

  const total = Number(countRows[0]?.total || 0);

  return {
    rows: rows as unknown as RegularizationWithAttendance[],
    total,
  };
};

// ============================================================
// GET REGULARIZATION REQUESTS FOR REVIEW (HR / manager)
//
// FIXED: added optional startDate/endDate, filtered on
// a.attendanceDate (the date the request is ABOUT, not when it was
// submitted) so HR reviewing "August" sees requests concerning August
// attendance — consistent with how the employee side's month filter
// already works.
// ============================================================

export const getRegularizationRequestsForReview = async (
  page: number,
  limit: number,
  status?: RegularizationStatus,
  startDate?: string,
  endDate?: string,
): Promise<{ rows: RegularizationForReview[]; total: number }> => {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit =
    Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
  const offset = (safePage - 1) * safeLimit;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (status) {
    conditions.push("ar.status = ?");
    params.push(status);
  }

  if (startDate) {
    conditions.push("a.attendanceDate >= ?");
    params.push(startDate);
  }

  if (endDate) {
    conditions.push("a.attendanceDate <= ?");
    params.push(endDate);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        ar.*,
        a.attendanceDate,
        a.checkIn AS currentCheckIn,
        a.checkOut AS currentCheckOut,
        a.attendanceStatus AS currentStatus,
        u.firstName,
        u.lastName,
        e.employeeCode
      FROM attendance_regularization ar
      JOIN attendance a ON a.id = ar.attendanceId
      JOIN employee e ON e.id = ar.employeeId
      JOIN users u ON u.id = e.userId
      ${whereClause}
      ORDER BY ar.createdAt DESC
      LIMIT ? OFFSET ?
    `,
    [...params, safeLimit, offset],
  );

  const [countRows] = await pool.query<RowDataPacket[]>(
    `
      SELECT COUNT(*) AS total
      FROM attendance_regularization ar
      JOIN attendance a ON a.id = ar.attendanceId
      ${whereClause}
    `,
    params,
  );

  const total = Number(countRows[0]?.total || 0);

  return {
    rows: rows as unknown as RegularizationForReview[],
    total,
  };
};

export const approveRegularizationRequest = async (
  requestId: number,
  reviewerUserId: number,
  reviewRemarks: string | null,
): Promise<AttendanceRegularizationRow> => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [reqRows] = await connection.query<RowDataPacket[]>(
      `SELECT * FROM attendance_regularization WHERE id = ? FOR UPDATE`,
      [requestId],
    );

    if (reqRows.length === 0) {
      throw ApiError.notFound("Regularization request not found");
    }

    const request = reqRows[0] as unknown as AttendanceRegularizationRow;

    if (request.status !== "PENDING") {
      throw new ApiError(`Request already ${request.status.toLowerCase()}`, 409);
    }

    const [attRows] = await connection.query<RowDataPacket[]>(
      `SELECT * FROM attendance WHERE id = ? FOR UPDATE`,
      [request.attendanceId],
    );

    if (attRows.length === 0) {
      throw ApiError.notFound("Linked attendance record no longer exists");
    }

    const attendance = attRows[0] as unknown as AttendanceRow;

    const newCheckIn = request.requestedCheckIn
      ? new Date(request.requestedCheckIn)
      : attendance.checkIn;

    const newCheckOut = request.requestedCheckOut
      ? new Date(request.requestedCheckOut)
      : attendance.checkOut;

    const newAttendanceStatus = request.requestedStatus || attendance.attendanceStatus;

    let workDurationMins = attendance.workDurationMins;
    let isLate = attendance.isLate;
    let lateMinutes = attendance.lateMinutes;
    let isEarlyDeparture = attendance.isEarlyDeparture;
    let earlyDepartureMins = attendance.earlyDepartureMins;
    let overtimeMins = attendance.overtimeMins;

    const shift = attendance.shiftId ? await getShiftById(attendance.shiftId) : null;

    if (shift && newCheckIn && newCheckOut) {
      const dateStr = toDateStr(attendance.attendanceDate);
      const { start: scheduledStart, end: scheduledEnd } = getScheduledShiftWindow(
        dateStr,
        shift,
      );

      const checkInDate = new Date(newCheckIn);
      const checkOutDate = new Date(newCheckOut);

      const grossMinutes = diffMinutes(checkOutDate, checkInDate);
      workDurationMins = Math.max(0, grossMinutes - shift.breakMinutes);

      const rawLateMinutes = Math.max(0, diffMinutes(checkInDate, scheduledStart));
      lateMinutes = Math.max(0, rawLateMinutes - shift.graceMinutes);
      isLate = lateMinutes > 0 ? 1 : 0;

      earlyDepartureMins = Math.max(0, diffMinutes(scheduledEnd, checkOutDate));
      isEarlyDeparture = earlyDepartureMins > 0 ? 1 : 0;

      overtimeMins = Math.max(0, diffMinutes(checkOutDate, scheduledEnd));
    }

    const nowEpoch = Math.floor(Date.now() / 1000);

    await connection.query(
      `
        UPDATE attendance
        SET
          checkIn = ?, checkOut = ?, workDurationMins = ?,
          isLate = ?, lateMinutes = ?,
          isEarlyDeparture = ?, earlyDepartureMins = ?,
          overtimeMins = ?, attendanceStatus = ?,
          isRegularized = 1, regularizedBy = ?, regularizedAt = ?,
          regularizationNote = ?, updatedAt = ?, updatedBy = ?
        WHERE id = ?
      `,
      [
        newCheckIn, newCheckOut, workDurationMins,
        isLate, lateMinutes,
        isEarlyDeparture, earlyDepartureMins,
        overtimeMins, newAttendanceStatus,
        reviewerUserId, nowEpoch,
        request.reason, nowEpoch, reviewerUserId,
        attendance.id,
      ],
    );

    await connection.query(
      `
        UPDATE attendance_regularization
        SET status = 'APPROVED', reviewedBy = ?, reviewedAt = ?,
            reviewRemarks = ?, updatedAt = ?, updatedBy = ?
        WHERE id = ?
      `,
      [reviewerUserId, nowEpoch, reviewRemarks, nowEpoch, reviewerUserId, requestId],
    );

    await connection.commit();

    const updated = await getRegularizationById(requestId);

    if (!updated) {
      throw new ApiError("Failed to load updated regularization request", 500);
    }

    return updated;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ============================================================
// REJECT REGULARIZATION REQUEST
//
// FIXED: now wrapped in the same transaction + row-lock pattern as
// approveRegularizationRequest. The old version read the row without
// locking it, then wrote unconditionally — two concurrent
// approve/reject clicks on the same request could both have
// "succeeded" with no error to either caller. The added
// `AND status = 'PENDING'` on the UPDATE is a second belt-and-braces
// guard even under the lock.
// ============================================================

export const rejectRegularizationRequest = async (
  requestId: number,
  reviewerUserId: number,
  reviewRemarks: string,
): Promise<AttendanceRegularizationRow> => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT * FROM attendance_regularization WHERE id = ? FOR UPDATE`,
      [requestId],
    );

    if (rows.length === 0) {
      throw ApiError.notFound("Regularization request not found");
    }

    const request = rows[0] as unknown as AttendanceRegularizationRow;

    if (request.status !== "PENDING") {
      throw new ApiError(`Request already ${request.status.toLowerCase()}`, 409);
    }

    const nowEpoch = Math.floor(Date.now() / 1000);

    await connection.query(
      `
        UPDATE attendance_regularization
        SET status = 'REJECTED', reviewedBy = ?, reviewedAt = ?,
            reviewRemarks = ?, updatedAt = ?, updatedBy = ?
        WHERE id = ?
          AND status = 'PENDING'
      `,
      [reviewerUserId, nowEpoch, reviewRemarks, nowEpoch, reviewerUserId, requestId],
    );

    await connection.commit();

    const updated = await getRegularizationById(requestId);

    if (!updated) {
      throw new ApiError("Failed to load updated regularization request", 500);
    }

    return updated;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};