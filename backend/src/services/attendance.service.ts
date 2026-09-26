import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../db/connection";
import { ApiError } from "../utils/apiError";
import {
  AttendanceRow,
  Shift,
  AdminAttendanceFilters,
  AdminAttendanceRow,
  AdminAttendanceSummary,
} from "../types/attendance.types";
import {
  getScheduledShiftWindow,
  diffMinutes,
} from "../utils/shiftTime";

import { isIpAllowed } from "../utils/allowedIps";

// ============================================================
// GET TODAY DATE (local date, no UTC shift)
// ============================================================

const getTodayDateStr = (): string => {
  const d = new Date();

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// ============================================================
// RESOLVE EMPLOYEE ID FROM LOGGED-IN USER
// ============================================================

export const resolveEmployeeId = async (
  userId: number,
): Promise<number> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT id
      FROM employee
      WHERE userId = ?
        AND status = '1'
        AND trashedAt IS NULL
      LIMIT 1
    `,
    [userId],
  );

  if (rows.length === 0) {
    throw ApiError.notFound(
      "No active employee record found for this account",
    );
  }

  return Number(rows[0].id);
};

// ============================================================
// GET ACTIVE SHIFT FOR EMPLOYEE
// ============================================================

export const getActiveShift = async (
  employeeId: number,
  dateStr: string,
): Promise<Shift | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        s.id,
        s.shiftName,
        s.shiftCode,
        s.startTime,
        s.endTime,
        s.breakMinutes,
        s.graceMinutes,
        s.isNightShift
      FROM employee_shift es
      INNER JOIN shift s ON s.id = es.shiftId
      WHERE es.employeeId = ?
        AND es.effectiveFrom <= ?
        AND (
          es.effectiveTo IS NULL
          OR es.effectiveTo >= ?
        )
        AND s.trashedAt IS NULL
      ORDER BY es.effectiveFrom DESC
      LIMIT 1
    `,
    [employeeId, dateStr, dateStr],
  );

  return rows.length > 0
    ? (rows[0] as unknown as Shift)
    : null;
};

// ============================================================
// GET SHIFT BY ID
// ============================================================

const getShiftById = async (
  shiftId: number,
): Promise<Shift | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        id,
        shiftName,
        shiftCode,
        startTime,
        endTime,
        breakMinutes,
        graceMinutes,
        isNightShift
      FROM shift
      WHERE id = ?
    `,
    [shiftId],
  );

  return rows.length > 0
    ? (rows[0] as unknown as Shift)
    : null;
};

// ============================================================
// GET TODAY'S ATTENDANCE
// ============================================================

export const getTodayAttendance = async (
  employeeId: number,
): Promise<{
  attendance: AttendanceRow;
  shift: Shift | null;
} | null> => {
  const dateStr = getTodayDateStr();

  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT *
      FROM attendance
      WHERE employeeId = ?
        AND attendanceDate = ?
      LIMIT 1
    `,
    [employeeId, dateStr],
  );

  if (rows.length === 0) {
    return null;
  }

  const attendance =
    rows[0] as unknown as AttendanceRow;

  const shift = attendance.shiftId
    ? await getShiftById(attendance.shiftId)
    : null;

  return {
    attendance,
    shift,
  };
};

// ============================================================
// PUNCH IN
// ============================================================

export const punchIn = async (
  employeeId: number,
  userId: number,
  location: string | null,
  ipAddress: string | null,
) => {
  const isDevelopmentLocalhost =
    process.env.NODE_ENV !== "production" &&
    ["127.0.0.1", "::1", "localhost"].includes(
      ipAddress ?? "",
    );

  if (
    !ipAddress ||
    (!isIpAllowed(ipAddress) &&
      !isDevelopmentLocalhost)
  ) {
    throw new ApiError(
      "Punch In is allowed only from the authorized office IP address",
      403,
    );
  }

  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const dateStr = getTodayDateStr();

    const [existing] =
      await connection.query<RowDataPacket[]>(
        `
          SELECT id, checkIn
          FROM attendance
          WHERE employeeId = ?
            AND attendanceDate = ?
          FOR UPDATE
        `,
        [employeeId, dateStr],
      );

    if (
      existing.length > 0 &&
      existing[0].checkIn
    ) {
      throw new ApiError(
        "Employee has already punched in today",
        409,
      );
    }

    const shift = await getActiveShift(
      employeeId,
      dateStr,
    );

    if (!shift) {
      throw ApiError.badRequest(
        "No shift assigned for today",
      );
    }

    const now = new Date();

    const {
      start: scheduledStart,
    } = getScheduledShiftWindow(
      dateStr,
      shift,
    );

    const rawLateMinutes = Math.max(
      0,
      diffMinutes(now, scheduledStart),
    );

    const lateMinutes = Math.max(
      0,
      rawLateMinutes - shift.graceMinutes,
    );

    const isLate =
      lateMinutes > 0 ? 1 : 0;

    const nowEpoch = Math.floor(
      Date.now() / 1000,
    );

    const [result] =
      await connection.query<ResultSetHeader>(
        `
          INSERT INTO attendance (
            employeeId,
            attendanceDate,
            shiftId,
            attendanceStatus,
            checkIn,
            isLate,
            lateMinutes,
            checkInSource,
            checkInLocation,
            checkInIp,
            createdAt,
            createdBy,
            updatedAt,
            updatedBy
          )
          VALUES (
            ?,
            ?,
            ?,
            'PRESENT',
            ?,
            ?,
            ?,
            'web',
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
          )
        `,
        [
          employeeId,
          dateStr,
          shift.id,
          now,
          isLate,
          lateMinutes,
          location,
          ipAddress,
          nowEpoch,
          userId,
          nowEpoch,
          userId,
        ],
      );

    await connection.commit();

    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT *
          FROM attendance
          WHERE id = ?
        `,
        [result.insertId],
      );

    return {
      attendance:
        rows[0] as unknown as AttendanceRow,
      shift,
    };
  } catch (error: any) {
    await connection.rollback();

    if (error?.code === "ER_DUP_ENTRY") {
      throw new ApiError(
        "Employee has already punched in today",
        409,
      );
    }

    throw error;
  } finally {
    connection.release();
  }
};

// ============================================================
// PUNCH OUT
// ============================================================

export const punchOut = async (
  employeeId: number,
  userId: number,
  location: string | null,
  ipAddress: string | null,
) => {
  const isDevelopmentLocalhost =
    process.env.NODE_ENV !== "production" &&
    ["127.0.0.1", "::1", "localhost"].includes(
      ipAddress ?? "",
    );

  if (
    !ipAddress ||
    (!isIpAllowed(ipAddress) &&
      !isDevelopmentLocalhost)
  ) {
    throw new ApiError(
      "Punch Out is allowed only from the authorized office IP address",
      403,
    );
  }

  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const dateStr = getTodayDateStr();

    const [rows] =
      await connection.query<RowDataPacket[]>(
        `
          SELECT *
          FROM attendance
          WHERE employeeId = ?
            AND attendanceDate = ?
          FOR UPDATE
        `,
        [employeeId, dateStr],
      );

    if (rows.length === 0) {
      throw ApiError.badRequest(
        "No punch-in found for today",
      );
    }

    const attendance =
      rows[0] as unknown as AttendanceRow;

    if (!attendance.checkIn) {
      throw ApiError.badRequest(
        "No punch-in found for today",
      );
    }

    if (attendance.checkOut) {
      throw new ApiError(
        "Employee has already punched out today",
        409,
      );
    }

    const shift = attendance.shiftId
      ? await getShiftById(
          attendance.shiftId,
        )
      : null;

    if (!shift) {
      throw ApiError.badRequest(
        "No shift assigned for today",
      );
    }

    const now = new Date();

    const checkInTime = new Date(
      attendance.checkIn,
    );

    const grossMinutes = diffMinutes(
      now,
      checkInTime,
    );

    const workDurationMins = Math.max(
      0,
      grossMinutes - shift.breakMinutes,
    );

    const {
      end: scheduledEnd,
    } = getScheduledShiftWindow(
      dateStr,
      shift,
    );

    const earlyMins = Math.max(
      0,
      diffMinutes(
        scheduledEnd,
        now,
      ),
    );

    const isEarlyDeparture =
      earlyMins > 0 ? 1 : 0;

    const overtimeMins = Math.max(
      0,
      diffMinutes(
        now,
        scheduledEnd,
      ),
    );

    const nowEpoch = Math.floor(
      Date.now() / 1000,
    );

    await connection.query(
      `
        UPDATE attendance
        SET
          checkOut = ?,
          workDurationMins = ?,
          isEarlyDeparture = ?,
          earlyDepartureMins = ?,
          overtimeMins = ?,
          checkOutSource = 'web',
          checkOutLocation = ?,
          checkOutIp = ?,
          updatedAt = ?,
          updatedBy = ?
        WHERE id = ?
      `,
      [
        now,
        workDurationMins,
        isEarlyDeparture,
        earlyMins,
        overtimeMins,
        location,
        ipAddress,
        nowEpoch,
        userId,
        attendance.id,
      ],
    );

    await connection.commit();

    const [updated] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT *
          FROM attendance
          WHERE id = ?
        `,
        [attendance.id],
      );

    return {
      attendance:
        updated[0] as unknown as AttendanceRow,
      shift,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ============================================================
// GET ATTENDANCE HISTORY (employee's own)
// ============================================================

export const getHistory = async (
  employeeId: number,
  page: number,
  limit: number,
  startDate?: string,
  endDate?: string,
) => {
  const safePage =
    Number.isFinite(page) && page > 0
      ? Math.floor(page)
      : 1;

  const safeLimit =
    Number.isFinite(limit) && limit > 0
      ? Math.min(Math.floor(limit), 100)
      : 10;

  const offset =
    (safePage - 1) * safeLimit;

  const conditions: string[] = [
    "a.employeeId = ?",
  ];

  const params: (
    | string
    | number
  )[] = [employeeId];

  if (startDate) {
    conditions.push(
      "a.attendanceDate >= ?",
    );
    params.push(startDate);
  }

  if (endDate) {
    conditions.push(
      "a.attendanceDate <= ?",
    );
    params.push(endDate);
  }

  const whereClause =
    conditions.join(" AND ");

  const [rows] =
    await pool.query<RowDataPacket[]>(
      `
        SELECT
          a.*,
          s.shiftName,
          s.startTime AS shiftStart,
          s.endTime AS shiftEnd,
          s.breakMinutes AS shiftBreakMinutes
        FROM attendance a
        LEFT JOIN shift s
          ON s.id = a.shiftId
        WHERE ${whereClause}
        ORDER BY
          a.attendanceDate DESC,
          a.id DESC
        LIMIT ? OFFSET ?
      `,
      [...params, safeLimit, offset],
    );

  const isDevelopmentLocalhost = (
    ip: string | null,
  ): boolean =>
    process.env.NODE_ENV !== "production" &&
    ["127.0.0.1", "::1", "localhost"].includes(
      ip ?? "",
    );

  const rowsWithIpFlags =
    rows.map((row) => ({
      ...row,
      isCheckInIpAllowed: row.checkInIp
        ? isIpAllowed(row.checkInIp) ||
          isDevelopmentLocalhost(
            row.checkInIp,
          )
        : null,
      isCheckOutIpAllowed:
        row.checkOutIp
          ? isIpAllowed(
              row.checkOutIp,
            ) ||
            isDevelopmentLocalhost(
              row.checkOutIp,
            )
          : null,
    }));

  const [countRows] =
    await pool.query<RowDataPacket[]>(
      `
        SELECT COUNT(*) AS total
        FROM attendance a
        WHERE ${whereClause}
      `,
      params,
    );

  const total = Number(
    countRows[0]?.total || 0,
  );

  return {
    rows: rowsWithIpFlags,
    total,
  };
};

// ============================================================
// ADMIN: LIST ATTENDANCE ACROSS ALL EMPLOYEES
// ============================================================

const VALID_ATTENDANCE_STATUSES = [
  "PRESENT",
  "ABSENT",
  "HALF_DAY",
  "ON_LEAVE",
  "HOLIDAY",
  "WEEKEND",
  "WORK_FROM_HOME",
];

// The Admin UI's "Late" filter isn't a real attendanceStatus value.
// Lateness is represented by isLate/lateMinutes.
const resolveStatusFilter = (
  rawStatus: string,
): {
  attendanceStatus: string;
  isLateOnly?: boolean;
} => {
  const cleaned =
    rawStatus
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_");

  if (cleaned === "LATE") {
    return {
      attendanceStatus: "PRESENT",
      isLateOnly: true,
    };
  }

  if (
    !VALID_ATTENDANCE_STATUSES.includes(
      cleaned,
    )
  ) {
    throw ApiError.badRequest(
      `Invalid status filter. Expected one of: ${VALID_ATTENDANCE_STATUSES.join(
        ", ",
      )}, Late`,
    );
  }

  return {
    attendanceStatus: cleaned,
  };
};

// ============================================================
// ATTACH IP FLAGS
// ============================================================

const attachIpFlags = (
  rows: RowDataPacket[],
): RowDataPacket[] => {
  const isDevelopmentLocalhost = (
    ip: string | null,
  ): boolean =>
    process.env.NODE_ENV !== "production" &&
    ["127.0.0.1", "::1", "localhost"].includes(
      ip ?? "",
    );

  return rows.map((row) => ({
    ...row,
    isCheckInIpAllowed: row.checkInIp
      ? isIpAllowed(row.checkInIp) ||
        isDevelopmentLocalhost(
          row.checkInIp,
        )
      : null,
    isCheckOutIpAllowed:
      row.checkOutIp
        ? isIpAllowed(row.checkOutIp) ||
          isDevelopmentLocalhost(
            row.checkOutIp,
          )
        : null,
  }));
};

// ============================================================
// ADMIN: GET ATTENDANCE LIST
// ============================================================

export const getAdminAttendanceList = async (
  filtersIn: AdminAttendanceFilters,
): Promise<{
  rows: AdminAttendanceRow[];
  total: number;
  date: string | null;
}> => {
  const safePage =
    Number.isFinite(filtersIn.page) &&
    filtersIn.page > 0
      ? Math.floor(filtersIn.page)
      : 1;

  const safeLimit =
    Number.isFinite(filtersIn.limit) &&
    filtersIn.limit > 0
      ? Math.min(
          Math.floor(filtersIn.limit),
          100,
        )
      : 10;

  const offset =
    (safePage - 1) * safeLimit;

  const todayStr =
    getTodayDateStr();

  const startDate =
    filtersIn.startDate ||
    todayStr;

  const endDate =
    filtersIn.endDate ||
    filtersIn.startDate ||
    todayStr;

  const isSingleDateView =
    startDate === endDate;

  const filters = {
    ...filtersIn,
    startDate,
    endDate,
  };

  if (isSingleDateView) {
    return {
      ...(await getAdminAttendanceForSingleDate(
        filters,
        safeLimit,
        offset,
        safePage,
      )),
      date: startDate,
    };
  }

  return {
    ...(await getAdminAttendanceForRange(
      filters,
      safeLimit,
      offset,
    )),
    date: null,
  };
};

// ============================================================
// ADMIN: SINGLE DATE ATTENDANCE
// ============================================================

const getAdminAttendanceForSingleDate =
  async (
    filters: AdminAttendanceFilters & {
      startDate: string;
    },
    safeLimit: number,
    offset: number,
    safePage: number,
  ): Promise<{
    rows: AdminAttendanceRow[];
    total: number;
  }> => {
    const conditions: string[] = [
      "e.status = '1'",
      "e.trashedAt IS NULL",
    ];

    const params: (
      | string
      | number
    )[] = [];

    // Date belongs inside LEFT JOIN.
    // This keeps employees without attendance records.
    const joinParams: (
      | string
      | number
    )[] = [filters.startDate];

    if (filters.employeeId) {
      conditions.push(
        "e.id = ?",
      );

      params.push(
        filters.employeeId,
      );
    }

    if (filters.departmentId) {
      conditions.push(
        "e.departmentId = ?",
      );

      params.push(
        filters.departmentId,
      );
    }

    if (filters.designationId) {
      conditions.push(
        "e.designationId = ?",
      );

      params.push(
        filters.designationId,
      );
    }

    if (filters.status) {
      const {
        attendanceStatus,
        isLateOnly,
      } = resolveStatusFilter(
        filters.status,
      );

      conditions.push(
        "a.attendanceStatus = ?",
      );

      params.push(
        attendanceStatus,
      );

      if (isLateOnly) {
        conditions.push(
          "a.isLate = 1",
        );
      }
    }

    if (filters.search) {
      conditions.push(
        `(
          u.firstName LIKE ?
          OR u.lastName LIKE ?
          OR e.employeeCode LIKE ?
          OR u.email LIKE ?
        )`,
      );

      const term =
        `%${filters.search.trim()}%`;

      params.push(
        term,
        term,
        term,
        term,
      );
    }

    const whereClause =
      conditions.join(" AND ");

    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT
            a.id,
            a.attendanceDate,
            a.shiftId,
            a.attendanceStatus,
            a.checkIn,
            a.checkOut,
            a.workDurationMins,
            a.isLate,
            a.lateMinutes,
            a.isEarlyDeparture,
            a.earlyDepartureMins,
            a.overtimeMins,
            a.checkInIp,
            a.checkOutIp,
            a.remarks,

            e.id AS employeeId,
            e.employeeCode,
            e.departmentId,
            e.designationId,

            u.firstName,
            u.lastName,
            u.email,

            d.departmentName,
            des.designationName,

            s.shiftName,
            s.startTime AS shiftStart,
            s.endTime AS shiftEnd,
            s.breakMinutes AS shiftBreakMinutes,

            (a.id IS NULL) AS hasNoRecord

          FROM employee e

          INNER JOIN users u
            ON u.id = e.userId

          LEFT JOIN department d
            ON d.id = e.departmentId

          LEFT JOIN designation des
            ON des.id = e.designationId

          LEFT JOIN attendance a
            ON a.employeeId = e.id
            AND a.attendanceDate = ?

          LEFT JOIN shift s
            ON s.id = a.shiftId

          WHERE ${whereClause}

          ORDER BY
            u.firstName ASC,
            u.lastName ASC

          LIMIT ? OFFSET ?
        `,
        [
          ...joinParams,
          ...params,
          safeLimit,
          offset,
        ],
      );

    const rowsWithIpFlags =
      attachIpFlags(rows).map(
        (r) => ({
          ...r,
          hasNoRecord:
            Boolean(r.hasNoRecord),
        }),
      ) as unknown as AdminAttendanceRow[];

    const [countRows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT COUNT(*) AS total

          FROM employee e

          INNER JOIN users u
            ON u.id = e.userId

          LEFT JOIN attendance a
            ON a.employeeId = e.id
            AND a.attendanceDate = ?

          WHERE ${whereClause}
        `,
        [
          ...joinParams,
          ...params,
        ],
      );

    const total = Number(
      countRows[0]?.total || 0,
    );

    return {
      rows: rowsWithIpFlags,
      total,
    };
  };

// ============================================================
// ADMIN: MULTI-DAY RANGE ATTENDANCE
// ============================================================

const getAdminAttendanceForRange =
  async (
    filters: AdminAttendanceFilters & {
      startDate: string;
      endDate: string;
    },
    safeLimit: number,
    offset: number,
  ): Promise<{
    rows: AdminAttendanceRow[];
    total: number;
  }> => {
    const conditions: string[] = [
      "e.trashedAt IS NULL",
      "a.attendanceDate >= ?",
      "a.attendanceDate <= ?",
    ];

    const params: (
      | string
      | number
    )[] = [
      filters.startDate,
      filters.endDate,
    ];

    if (filters.employeeId) {
      conditions.push(
        "a.employeeId = ?",
      );

      params.push(
        filters.employeeId,
      );
    }

    if (filters.departmentId) {
      conditions.push(
        "e.departmentId = ?",
      );

      params.push(
        filters.departmentId,
      );
    }

    if (filters.designationId) {
      conditions.push(
        "e.designationId = ?",
      );

      params.push(
        filters.designationId,
      );
    }

    if (filters.status) {
      const {
        attendanceStatus,
        isLateOnly,
      } = resolveStatusFilter(
        filters.status,
      );

      conditions.push(
        "a.attendanceStatus = ?",
      );

      params.push(
        attendanceStatus,
      );

      if (isLateOnly) {
        conditions.push(
          "a.isLate = 1",
        );
      }
    }

    if (filters.search) {
      conditions.push(
        `(
          u.firstName LIKE ?
          OR u.lastName LIKE ?
          OR e.employeeCode LIKE ?
          OR u.email LIKE ?
        )`,
      );

      const term =
        `%${filters.search.trim()}%`;

      params.push(
        term,
        term,
        term,
        term,
      );
    }

    const whereClause =
      conditions.join(" AND ");

    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT
            a.*,

            e.employeeCode,
            e.departmentId,
            e.designationId,

            u.firstName,
            u.lastName,
            u.email,

            d.departmentName,
            des.designationName,

            s.shiftName,
            s.startTime AS shiftStart,
            s.endTime AS shiftEnd,
            s.breakMinutes AS shiftBreakMinutes,

            FALSE AS hasNoRecord

          FROM attendance a

          INNER JOIN employee e
            ON e.id = a.employeeId

          INNER JOIN users u
            ON u.id = e.userId

          LEFT JOIN department d
            ON d.id = e.departmentId

          LEFT JOIN designation des
            ON des.id = e.designationId

          LEFT JOIN shift s
            ON s.id = a.shiftId

          WHERE ${whereClause}

          ORDER BY
            a.attendanceDate DESC,
            a.id DESC

          LIMIT ? OFFSET ?
        `,
        [
          ...params,
          safeLimit,
          offset,
        ],
      );

    const rowsWithIpFlags =
      attachIpFlags(rows) as unknown as AdminAttendanceRow[];

    const [countRows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT COUNT(*) AS total

          FROM attendance a

          INNER JOIN employee e
            ON e.id = a.employeeId

          INNER JOIN users u
            ON u.id = e.userId

          WHERE ${whereClause}
        `,
        params,
      );

    const total = Number(
      countRows[0]?.total || 0,
    );

    return {
      rows: rowsWithIpFlags,
      total,
    };
  };

// ============================================================
// NORMALIZE DATETIME FOR MYSQL
// ============================================================
//
// MySQL DATETIME expects:
//
// YYYY-MM-DD HH:mm:ss
//
// Example:
//
// 2026-09-15 11:28:00
//
// This prevents errors such as:
//
// Incorrect datetime value:
// '2026-09-15T05:58:00.000Z'
//
// ============================================================

const normalizeMySqlDateTime = (
  value:
    | string
    | Date
    | null
    | undefined,
): string | null => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  // Already MySQL DATETIME format
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(
      value.trim(),
    )
  ) {
    return value.trim();
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest(
      "checkIn/checkOut must be valid datetimes",
    );
  }

  const pad = (num: number) =>
    String(num).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(
    date.getDate(),
  )} ${pad(
    date.getHours(),
  )}:${pad(
    date.getMinutes(),
  )}:${pad(
    date.getSeconds(),
  )}`;
};

// ============================================================
// ADMIN: EDIT AN ATTENDANCE RECORD
// ============================================================

export const updateAdminAttendanceRecord =
  async (
    attendanceId: number,
    updates: {
      attendanceStatus?: string;
      checkIn?: string | null;
      checkOut?: string | null;
      remarks?: string | null;
    },
    userId: number,
  ) => {
    // --------------------------------------------------------
    // 1. GET EXISTING RECORD
    // --------------------------------------------------------

    const [existingRows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT *
          FROM attendance
          WHERE id = ?
          LIMIT 1
        `,
        [attendanceId],
      );

    if (existingRows.length === 0) {
      throw ApiError.notFound(
        "Attendance record not found",
      );
    }

    const existing =
      existingRows[0] as unknown as AttendanceRow;

    // --------------------------------------------------------
    // 2. STATUS
    // --------------------------------------------------------

    const nextStatus =
      updates.attendanceStatus
        ? resolveStatusFilter(
            updates.attendanceStatus,
          ).attendanceStatus
        : existing.attendanceStatus;

    // --------------------------------------------------------
    // 3. NORMALIZE CHECK-IN / CHECK-OUT
    // --------------------------------------------------------

    const nextCheckIn =
      updates.checkIn !== undefined
        ? normalizeMySqlDateTime(
            updates.checkIn,
          )
        : normalizeMySqlDateTime(
            existing.checkIn,
          );

    const nextCheckOut =
      updates.checkOut !== undefined
        ? normalizeMySqlDateTime(
            updates.checkOut,
          )
        : normalizeMySqlDateTime(
            existing.checkOut,
          );

    // --------------------------------------------------------
    // 4. VALIDATE CHECK-IN / CHECK-OUT
    // --------------------------------------------------------

    if (
      nextCheckIn &&
      nextCheckOut
    ) {
      const checkInDate =
        new Date(nextCheckIn);

      const checkOutDate =
        new Date(nextCheckOut);

      if (
        Number.isNaN(
          checkInDate.getTime(),
        ) ||
        Number.isNaN(
          checkOutDate.getTime(),
        )
      ) {
        throw ApiError.badRequest(
          "checkIn/checkOut must be valid datetimes",
        );
      }

      if (
        checkOutDate <= checkInDate
      ) {
        throw ApiError.badRequest(
          "checkOut cannot be at or before checkIn",
        );
      }
    }

    // --------------------------------------------------------
    // 5. EXISTING CALCULATED VALUES
    // --------------------------------------------------------

    let workDurationMins =
      existing.workDurationMins;

    let overtimeMins =
      existing.overtimeMins;

    let isEarlyDeparture =
      existing.isEarlyDeparture;

    let earlyDepartureMins =
      existing.earlyDepartureMins;

    let isLate =
      existing.isLate;

    let lateMinutes =
      existing.lateMinutes;

    // --------------------------------------------------------
    // 6. GET SHIFT
    // --------------------------------------------------------

    const shift =
      existing.shiftId
        ? await getShiftById(
            existing.shiftId,
          )
        : null;

    // --------------------------------------------------------
    // 7. RECALCULATE ATTENDANCE VALUES
    // --------------------------------------------------------

    if (shift) {
      // ------------------------------------------------------
      // Calculate Late Login
      // ------------------------------------------------------

      if (nextCheckIn) {
        const checkInDate =
          new Date(nextCheckIn);

        const {
          start: scheduledStart,
        } = getScheduledShiftWindow(
          existing.attendanceDate,
          shift,
        );

        const rawLateMinutes =
          Math.max(
            0,
            diffMinutes(
              checkInDate,
              scheduledStart,
            ),
          );

        const actualLateMinutes =
          Math.max(
            0,
            rawLateMinutes -
              shift.graceMinutes,
          );

        isLate =
          actualLateMinutes > 0
            ? 1
            : 0;

        lateMinutes =
          actualLateMinutes;
      } else {
        isLate = 0;
        lateMinutes = 0;
      }

      // ------------------------------------------------------
      // Calculate Duration / Early Departure / Overtime
      // ------------------------------------------------------

      if (
        nextCheckIn &&
        nextCheckOut
      ) {
        const checkInDate =
          new Date(nextCheckIn);

        const checkOutDate =
          new Date(nextCheckOut);

        const grossMinutes =
          diffMinutes(
            checkOutDate,
            checkInDate,
          );

        workDurationMins =
          Math.max(
            0,
            grossMinutes -
              shift.breakMinutes,
          );

        const {
          end: scheduledEnd,
        } =
          getScheduledShiftWindow(
            existing.attendanceDate,
            shift,
          );

        // Employee left before shift end
        const earlyMins =
          Math.max(
            0,
            diffMinutes(
              scheduledEnd,
              checkOutDate,
            ),
          );

        isEarlyDeparture =
          earlyMins > 0
            ? 1
            : 0;

        earlyDepartureMins =
          earlyMins;

        // Employee worked after shift end
        overtimeMins =
          Math.max(
            0,
            diffMinutes(
              checkOutDate,
              scheduledEnd,
            ),
          );
      } else {
        // Incomplete attendance
        workDurationMins = null;
        overtimeMins = 0;
        isEarlyDeparture = 0;
        earlyDepartureMins = 0;
      }
    }

    // --------------------------------------------------------
    // 8. UPDATED TIMESTAMP
    // --------------------------------------------------------

    const nowEpoch = Math.floor(
      Date.now() / 1000,
    );

    // --------------------------------------------------------
    // 9. UPDATE DATABASE
    // --------------------------------------------------------

    await pool.query(
      `
        UPDATE attendance
        SET
          attendanceStatus = ?,
          checkIn = ?,
          checkOut = ?,
          workDurationMins = ?,
          isLate = ?,
          lateMinutes = ?,
          isEarlyDeparture = ?,
          earlyDepartureMins = ?,
          overtimeMins = ?,
          remarks = ?,
          updatedAt = ?,
          updatedBy = ?
        WHERE id = ?
      `,
      [
        nextStatus,
        nextCheckIn,
        nextCheckOut,
        workDurationMins,
        isLate,
        lateMinutes,
        isEarlyDeparture,
        earlyDepartureMins,
        overtimeMins,
        updates.remarks !==
        undefined
          ? updates.remarks
          : existing.remarks,
        nowEpoch,
        userId,
        attendanceId,
      ],
    );

    // --------------------------------------------------------
    // 10. RETURN UPDATED RECORD
    // --------------------------------------------------------

    const [updatedRows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT *
          FROM attendance
          WHERE id = ?
        `,
        [attendanceId],
      );

    return updatedRows[0] as unknown as AttendanceRow;
  };

// ============================================================
// ADMIN: ATTENDANCE SUMMARY
// ============================================================

interface StatusCounts {
  present: number;
  absent: number;
  lateLogin: number;
  onLeave: number;
  halfDay: number;
}

// ============================================================
// DATE MATH HELPERS
// ============================================================

// Shift a YYYY-MM-DD string by N days (N can be negative)
const shiftDateStr = (
  dateStr: string,
  days: number,
): string => {
  const [y, m, d] = dateStr
    .split("-")
    .map(Number);

  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Inclusive day count between two YYYY-MM-DD strings
const daysBetweenInclusive = (
  start: string,
  end: string,
): number => {
  const [sy, sm, sd] = start
    .split("-")
    .map(Number);

  const [ey, em, ed] = end
    .split("-")
    .map(Number);

  const startDate = new Date(
    sy,
    sm - 1,
    sd,
  );

  const endDate = new Date(
    ey,
    em - 1,
    ed,
  );

  const diffMs =
    endDate.getTime() -
    startDate.getTime();

  return (
    Math.round(
      diffMs / (1000 * 60 * 60 * 24),
    ) + 1
  );
};

// ============================================================
// PERCENTAGE CHANGE
// ============================================================

const pctChange = (
  current: number,
  previous: number,
): number | null => {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return Math.round(
    ((current - previous) /
      previous) *
      100,
  );
};

// ============================================================
// ADMIN SUMMARY FILTER TYPE
// ============================================================

interface AdminAttendanceSummaryFilters {
  startDate?: string;
  endDate?: string;
  employeeId?: number;
  departmentId?: number;
  designationId?: number;
  status?: string;
  search?: string;
}

// ============================================================
// ADMIN: ATTENDANCE SUMMARY
// ============================================================
//
// Range-aware:
// - Aggregates attendanceDate BETWEEN startDate AND endDate
//   (this also correctly covers a single day, since
//   startDate === endDate in that case).
// - "Previous period" comparison shifts back by the SAME
//   NUMBER OF DAYS as the selected range, immediately
//   preceding startDate. E.g. a 15-day selection is compared
//   against the preceding 15 days, not just one day back.
//
// ============================================================

export const getAdminAttendanceSummary =
  async (
    dateStr: string,
    filters: AdminAttendanceSummaryFilters = {},
  ): Promise<AdminAttendanceSummary> => {
    // --------------------------------------------------------
    // Resolve effective date range
    // --------------------------------------------------------

    const rangeStart =
      filters.startDate ||
      dateStr ||
      getTodayDateStr();

    const rangeEnd =
      filters.endDate ||
      rangeStart;

    // --------------------------------------------------------
    // Employee filters
    // --------------------------------------------------------

    const employeeConditions: string[] = [
      "e.status = '1'",
      "e.trashedAt IS NULL",
    ];

    const employeeParams: (
      | string
      | number
    )[] = [];

    if (filters.employeeId) {
      employeeConditions.push(
        "e.id = ?",
      );

      employeeParams.push(
        filters.employeeId,
      );
    }

    if (filters.departmentId) {
      employeeConditions.push(
        "e.departmentId = ?",
      );

      employeeParams.push(
        filters.departmentId,
      );
    }

    if (filters.designationId) {
      employeeConditions.push(
        "e.designationId = ?",
      );

      employeeParams.push(
        filters.designationId,
      );
    }

    if (filters.search) {
      employeeConditions.push(
        `(
          u.firstName LIKE ?
          OR u.lastName LIKE ?
          OR e.employeeCode LIKE ?
          OR u.email LIKE ?
        )`,
      );

      const term =
        `%${filters.search.trim()}%`;

      employeeParams.push(
        term,
        term,
        term,
        term,
      );
    }

    const employeeWhere =
      employeeConditions.join(
        " AND ",
      );

    // --------------------------------------------------------
    // Build attendance WHERE for a given date range
    // --------------------------------------------------------

    const buildAttendanceWhere = (
      start: string,
      end: string,
    ): {
      where: string;
      params: (string | number)[];
    } => {
      const conditions: string[] = [
        "a.attendanceDate >= ?",
        "a.attendanceDate <= ?",
      ];

      const params: (
        | string
        | number
      )[] = [start, end];

      if (filters.status) {
        const {
          attendanceStatus,
          isLateOnly,
        } = resolveStatusFilter(
          filters.status,
        );

        conditions.push(
          "a.attendanceStatus = ?",
        );

        params.push(
          attendanceStatus,
        );

        if (isLateOnly) {
          conditions.push(
            "a.isLate = 1",
          );
        }
      }

      return {
        where: conditions.join(
          " AND ",
        ),
        params,
      };
    };

    // --------------------------------------------------------
    // Run grouped counts for a date range
    // --------------------------------------------------------

    const runCounts = async (
      start: string,
      end: string,
    ): Promise<StatusCounts> => {
      const { where, params } =
        buildAttendanceWhere(
          start,
          end,
        );

      const [rows] =
        await pool.query<RowDataPacket[]>(
          `
            SELECT
              a.attendanceStatus,
              a.isLate,
              COUNT(*) AS cnt

            FROM attendance a

            INNER JOIN employee e
              ON e.id = a.employeeId

            INNER JOIN users u
              ON u.id = e.userId

            WHERE
              ${where}
              AND ${employeeWhere}

            GROUP BY
              a.attendanceStatus,
              a.isLate
          `,
          [
            ...params,
            ...employeeParams,
          ],
        );

      const counts: StatusCounts = {
        present: 0,
        absent: 0,
        lateLogin: 0,
        onLeave: 0,
        halfDay: 0,
      };

      for (const row of rows) {
        const count = Number(
          row.cnt || 0,
        );

        if (
          row.attendanceStatus ===
          "PRESENT"
        ) {
          counts.present += count;

          if (
            Number(row.isLate) === 1
          ) {
            counts.lateLogin += count;
          }
        }

        if (
          row.attendanceStatus ===
          "ABSENT"
        ) {
          counts.absent += count;
        }

        if (
          row.attendanceStatus ===
          "ON_LEAVE"
        ) {
          counts.onLeave += count;
        }

        if (
          row.attendanceStatus ===
          "HALF_DAY"
        ) {
          counts.halfDay += count;
        }
      }

      return counts;
    };

    // --------------------------------------------------------
    // Current period counts
    // --------------------------------------------------------

    const counts = await runCounts(
      rangeStart,
      rangeEnd,
    );

    // --------------------------------------------------------
    // Total filtered employees
    // --------------------------------------------------------

    const [
      employeeCountRows,
    ] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT COUNT(*) AS total

          FROM employee e

          INNER JOIN users u
            ON u.id = e.userId

          WHERE ${employeeWhere}
        `,
        employeeParams,
      );

    const totalEmployees =
      Number(
        employeeCountRows[0]
          ?.total || 0,
      );

    // --------------------------------------------------------
    // Previous period: same span, immediately preceding
    // --------------------------------------------------------

    const spanDays =
      daysBetweenInclusive(
        rangeStart,
        rangeEnd,
      );

    const previousEnd =
      shiftDateStr(rangeStart, -1);

    const previousStart =
      shiftDateStr(
        previousEnd,
        -(spanDays - 1),
      );

    const previousCounts =
      await runCounts(
        previousStart,
        previousEnd,
      );

    // --------------------------------------------------------
    // Build stat
    // --------------------------------------------------------

    const build = (
      key: keyof StatusCounts,
    ) => ({
      count: counts[key],
      changePct: pctChange(
        counts[key],
        previousCounts[key],
      ),
    });

    // --------------------------------------------------------
    // Final response
    // --------------------------------------------------------

    return {
      date:
        rangeStart === rangeEnd
          ? rangeStart
          : null,

      startDate: rangeStart,
      endDate: rangeEnd,

      totalEmployees,

      present: build("present"),

      absent: build("absent"),

      lateLogin: build(
        "lateLogin",
      ),

      onLeave: build(
        "onLeave",
      ),

      halfDay: build(
        "halfDay",
      ),
    };
  };