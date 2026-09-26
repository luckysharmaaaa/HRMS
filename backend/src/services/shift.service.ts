import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../db/connection";
import { ApiError } from "../utils/apiError";
import { ShiftMaster, CreateShiftInput, UpdateShiftInput } from "../types/shift.types";

const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

export const computeDurationHours = (startTime: string, endTime: string): number => {
  const startMin = toMinutes(startTime);
  let endMin = toMinutes(endTime);
  if (endMin <= startMin) endMin += 24 * 60;
  return Math.round(((endMin - startMin) / 60) * 100) / 100;
};

export const getAllShifts = async (): Promise<ShiftMaster[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM shift WHERE trashedAt IS NULL ORDER BY id DESC`,
  );
  return rows as unknown as ShiftMaster[];
};

export const getShiftById = async (id: number): Promise<ShiftMaster | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM shift WHERE id = ? AND trashedAt IS NULL LIMIT 1`,
    [id],
  );
  return rows.length > 0 ? (rows[0] as unknown as ShiftMaster) : null;
};

export const createShift = async (input: CreateShiftInput): Promise<number> => {
  if (input.shiftCode) {
    const [dup] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM shift WHERE shiftCode = ? AND trashedAt IS NULL LIMIT 1`,
      [input.shiftCode],
    );
    if (dup.length > 0) throw ApiError.conflict("Shift code already exists");
  }

  const durationHours = computeDurationHours(input.startTime, input.endTime);

  const [result] = await pool.query<ResultSetHeader>(
    `
    INSERT INTO shift
      (shiftName, shiftCode, startTime, endTime, durationHours,
       breakMinutes, graceMinutes, isNightShift, status, createdAt, createdBy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.shiftName,
      input.shiftCode ?? null,
      input.startTime,
      input.endTime,
      durationHours,
      input.breakMinutes ?? 60,
      input.graceMinutes ?? 10,
      input.isNightShift ? 1 : 0,
      input.status === false ? "0" : "1",
      Math.floor(Date.now() / 1000),
      input.createdBy ?? null,
    ],
  );

  return result.insertId;
};

export const updateShift = async (id: number, input: UpdateShiftInput): Promise<void> => {
  const existing = await getShiftById(id);
  if (!existing) throw ApiError.notFound("Shift not found");

  if (input.shiftCode) {
    const [dup] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM shift WHERE shiftCode = ? AND id != ? AND trashedAt IS NULL LIMIT 1`,
      [input.shiftCode, id],
    );
    if (dup.length > 0) throw ApiError.conflict("Shift code already exists");
  }

  const startTime = input.startTime ?? existing.startTime;
  const endTime = input.endTime ?? existing.endTime;
  const durationHours = computeDurationHours(startTime, endTime);

  const [result] = await pool.query<ResultSetHeader>(
    `
    UPDATE shift
    SET
      shiftName = COALESCE(?, shiftName),
      shiftCode = COALESCE(?, shiftCode),
      startTime = COALESCE(?, startTime),
      endTime = COALESCE(?, endTime),
      durationHours = ?,
      breakMinutes = COALESCE(?, breakMinutes),
      graceMinutes = COALESCE(?, graceMinutes),
      isNightShift = COALESCE(?, isNightShift),
      status = COALESCE(?, status),
      updatedAt = ?,
      updatedBy = COALESCE(?, updatedBy)
    WHERE id = ?
    `,
    [
      input.shiftName ?? null,
      input.shiftCode ?? null,
      input.startTime ?? null,
      input.endTime ?? null,
      durationHours,
      input.breakMinutes ?? null,
      input.graceMinutes ?? null,
      input.isNightShift !== undefined ? (input.isNightShift ? 1 : 0) : null,
      input.status !== undefined ? (input.status ? "1" : "0") : null,
      Math.floor(Date.now() / 1000),
      input.updatedBy ?? null,
      id,
    ],
  );

  if (result.affectedRows === 0) throw ApiError.internal("Failed to update shift");
};

export const deleteShift = async (id: number, trashedBy: number | null): Promise<void> => {
  const existing = await getShiftById(id);
  if (!existing) throw ApiError.notFound("Shift not found");

  const [active] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM employee_shift WHERE shiftId = ? AND effectiveTo IS NULL LIMIT 1`,
    [id],
  );
  if (active.length > 0) {
    throw ApiError.conflict(
      "Cannot delete a shift that is currently assigned to one or more employees",
    );
  }

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE shift SET trashedAt = ?, trashedBy = ? WHERE id = ?`,
    [Math.floor(Date.now() / 1000), trashedBy, id],
  );

  if (result.affectedRows === 0) throw ApiError.internal("Failed to delete shift");
};