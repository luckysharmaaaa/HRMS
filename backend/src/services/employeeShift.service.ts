import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../db/connection";
import { ApiError } from "../utils/apiError";
import { EmployeeShiftWithDetails, AssignShiftInput } from "../types/shift.types";

const SHIFT_JOIN_COLUMNS = `
  es.id, es.employeeId, es.shiftId, es.effectiveFrom, es.effectiveTo,
  es.assignedBy, es.notes, es.createdAt, es.createdBy, es.updatedAt, es.updatedBy,
  s.shiftName, s.shiftCode, s.startTime, s.endTime,
  s.breakMinutes, s.graceMinutes, s.isNightShift
`;

// Currently active mapping (effectiveTo IS NULL) — same "active means
// NULL effectiveTo" rule used everywhere else in your schema.
export const getActiveEmployeeShift = async (
  employeeId: number,
): Promise<EmployeeShiftWithDetails | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT ${SHIFT_JOIN_COLUMNS}
    FROM employee_shift es
    INNER JOIN shift s ON s.id = es.shiftId
    WHERE es.employeeId = ?
      AND es.effectiveTo IS NULL
      AND s.trashedAt IS NULL
    ORDER BY es.effectiveFrom DESC
    LIMIT 1
    `,
    [employeeId],
  );

  return rows.length > 0 ? (rows[0] as unknown as EmployeeShiftWithDetails) : null;
};

export const getEmployeeShiftHistory = async (
  employeeId: number,
): Promise<EmployeeShiftWithDetails[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT ${SHIFT_JOIN_COLUMNS}
    FROM employee_shift es
    INNER JOIN shift s ON s.id = es.shiftId
    WHERE es.employeeId = ?
    ORDER BY es.effectiveFrom DESC
    `,
    [employeeId],
  );

  return rows as unknown as EmployeeShiftWithDetails[];
};

// Assign or change an employee's shift, inside a transaction: closes
// any existing active mapping (effectiveTo = day before the new
// effectiveFrom) and inserts the new one, so the employee is never
// left with two simultaneously-active mappings.
export const assignEmployeeShift = async (
  employeeId: number,
  input: AssignShiftInput,
): Promise<number> => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [employeeRows] = await connection.query<RowDataPacket[]>(
      `SELECT id FROM employee WHERE id = ? AND trashedAt IS NULL LIMIT 1`,
      [employeeId],
    );
    if (employeeRows.length === 0) {
      throw ApiError.notFound("Employee not found");
    }

    const [shiftRows] = await connection.query<RowDataPacket[]>(
      `SELECT id FROM shift WHERE id = ? AND trashedAt IS NULL AND status = '1' LIMIT 1`,
      [input.shiftId],
    );
    if (shiftRows.length === 0) {
      throw ApiError.notFound("Shift not found or inactive");
    }

    const [activeRows] = await connection.query<RowDataPacket[]>(
      `SELECT id, effectiveFrom FROM employee_shift WHERE employeeId = ? AND effectiveTo IS NULL FOR UPDATE`,
      [employeeId],
    );

    if (activeRows.length > 0) {
      const effectiveToDate = new Date(input.effectiveFrom);
      effectiveToDate.setDate(effectiveToDate.getDate() - 1);
      const effectiveTo = effectiveToDate.toISOString().slice(0, 10);

const currentEffectiveFrom =
  activeRows[0].effectiveFrom instanceof Date
    ? activeRows[0].effectiveFrom.toISOString().slice(0, 10)
    : String(activeRows[0].effectiveFrom).slice(0, 10);

if (effectiveTo < currentEffectiveFrom) {        throw ApiError.badRequest(
          "New effective date must be after the current shift's start date",
        );
      }

      await connection.query<ResultSetHeader>(
        `UPDATE employee_shift SET effectiveTo = ?, updatedAt = ? WHERE id = ?`,
        [effectiveTo, Math.floor(Date.now() / 1000), activeRows[0].id],
      );
    }

    const nowEpoch = Math.floor(Date.now() / 1000);

    const [result] = await connection.query<ResultSetHeader>(
      `
      INSERT INTO employee_shift
        (employeeId, shiftId, effectiveFrom, effectiveTo, assignedBy, notes, createdAt, createdBy)
      VALUES (?, ?, ?, NULL, ?, ?, ?, ?)
      `,
      [
        employeeId,
        input.shiftId,
        input.effectiveFrom,
        input.assignedBy ?? null,
        input.notes ?? null,
        nowEpoch,
        input.assignedBy ?? null,
      ],
    );

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};