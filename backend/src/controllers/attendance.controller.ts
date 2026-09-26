import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { sendSuccess } from "../utils/response";
import * as attendanceService from "../services/attendance.service";

// ============================================================
// EMPLOYEE: GET TODAY'S ATTENDANCE
// ============================================================

export const getToday = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    const employeeId = await attendanceService.resolveEmployeeId(
      authReq.user.userId
    );

    const result = await attendanceService.getTodayAttendance(employeeId);

    // No attendance yet today is NOT an error.
    // Frontend can show "Punch In".
    sendSuccess(
      res,
      "Today's attendance fetched",
      result ?? null
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// EMPLOYEE: PUNCH IN
// ============================================================

export const punchIn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    const employeeId = await attendanceService.resolveEmployeeId(
      authReq.user.userId
    );

    const location = req.body?.location ?? null;

    // IP was set by attendanceIpCheck middleware
    const ipAddress = req.clientIp ?? null;

    const result = await attendanceService.punchIn(
      employeeId,
      authReq.user.userId,
      location,
      ipAddress
    );

    sendSuccess(
      res,
      "Punched in successfully",
      result,
      201
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// EMPLOYEE: PUNCH OUT
// ============================================================

export const punchOut = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    const employeeId = await attendanceService.resolveEmployeeId(
      authReq.user.userId
    );

    const location = req.body?.location ?? null;

    // IP was set by attendanceIpCheck middleware
    const ipAddress = req.clientIp ?? null;

    const result = await attendanceService.punchOut(
      employeeId,
      authReq.user.userId,
      location,
      ipAddress
    );

    sendSuccess(
      res,
      "Punched out successfully",
      result
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// EMPLOYEE: ATTENDANCE HISTORY
// ============================================================

export const getHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    const employeeId =
      await attendanceService.resolveEmployeeId(
        authReq.user.userId
      );

    const page = parseInt(
      (req.query.page as string) || "1",
      10
    );

    const limit = parseInt(
      (req.query.limit as string) || "10",
      10
    );

    const startDate =
      (req.query.startDate as string) || undefined;

    const endDate =
      (req.query.endDate as string) || undefined;

    const { rows, total } =
      await attendanceService.getHistory(
        employeeId,
        page,
        limit,
        startDate,
        endDate
      );

    sendSuccess(
      res,
      "Attendance history fetched",
      {
        data: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ADMIN: LIST ATTENDANCE ACROSS ALL EMPLOYEES
// ============================================================
//
// No date filter supplied -> defaults to TODAY.
//
// Supports:
// - Date range
// - Employee
// - Department
// - Designation
// - Status
// - Search
//
// ============================================================

export const getAdminAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(
      (req.query.page as string) || "1",
      10
    );

    const limit = parseInt(
      (req.query.limit as string) || "10",
      10
    );

    const startDate =
      (req.query.startDate as string) || undefined;

    const endDate =
      (req.query.endDate as string) || undefined;

    const employeeId = req.query.employeeId
      ? Number(req.query.employeeId)
      : undefined;

    const departmentId = req.query.departmentId
      ? Number(req.query.departmentId)
      : undefined;

    const designationId = req.query.designationId
      ? Number(req.query.designationId)
      : undefined;

    const status =
      (req.query.status as string) || undefined;

    const search =
      (req.query.search as string) || undefined;

    const {
      rows,
      total,
      date,
    } = await attendanceService.getAdminAttendanceList({
      page,
      limit,
      startDate,
      endDate,
      employeeId,
      departmentId,
      designationId,
      status,
      search,
    });

    sendSuccess(
      res,
      "Attendance records fetched",
      {
        date,
        data: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ADMIN: ATTENDANCE SUMMARY
// ============================================================
//
// Supports the SAME filters as the Attendance table:
//
// - date
// - startDate
// - endDate
// - employeeId
// - departmentId
// - designationId
// - status
// - search
//
// This keeps the summary cards synchronized with the table.
// ============================================================

export const getAdminAttendanceSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // ----------------------------------------------------------
    // Date filters
    // ----------------------------------------------------------

    const date =
      (req.query.date as string) || undefined;

    const startDate =
      (req.query.startDate as string) || undefined;

    const endDate =
      (req.query.endDate as string) || undefined;

    // ----------------------------------------------------------
    // Employee filter
    // ----------------------------------------------------------

    const employeeId = req.query.employeeId
      ? Number(req.query.employeeId)
      : undefined;

    // ----------------------------------------------------------
    // Department filter
    // ----------------------------------------------------------

    const departmentId = req.query.departmentId
      ? Number(req.query.departmentId)
      : undefined;

    // ----------------------------------------------------------
    // Designation filter
    // ----------------------------------------------------------

    const designationId = req.query.designationId
      ? Number(req.query.designationId)
      : undefined;

    // ----------------------------------------------------------
    // Status filter
    // ----------------------------------------------------------

    const status =
      (req.query.status as string) || undefined;

    // ----------------------------------------------------------
    // Search filter
    // ----------------------------------------------------------

    const search =
      (req.query.search as string) || undefined;

    // ----------------------------------------------------------
    // Resolve default date
    // ----------------------------------------------------------
    //
    // Priority:
    // 1. date
    // 2. startDate
    // 3. today's date
    //

    const dateStr =
      date ||
      startDate ||
      new Date().toLocaleDateString("en-CA");

    // ----------------------------------------------------------
    // Fetch summary
    // ----------------------------------------------------------

    const summary =
      await attendanceService.getAdminAttendanceSummary(
        dateStr,
        {
          startDate,
          endDate,
          employeeId,
          departmentId,
          designationId,
          status,
          search,
        }
      );

    sendSuccess(
      res,
      "Attendance summary fetched",
      summary
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ADMIN: EDIT ATTENDANCE RECORD
// ============================================================
//
// Action -> Edit in Attendance Admin UI
//
// Allowed fields:
// - attendanceStatus
// - checkIn
// - checkOut
// - remarks
//
// Any other frontend fields are ignored.
// ============================================================

const ALLOWED_UPDATE_FIELDS = [
  "attendanceStatus",
  "checkIn",
  "checkOut",
  "remarks",
];

export const updateAdminAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;

    const attendanceId = Number(
      req.params.id
    );

    // ----------------------------------------------------------
    // Validate attendance ID
    // ----------------------------------------------------------

    if (
      !Number.isFinite(attendanceId) ||
      attendanceId <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid attendance id",
      });

      return;
    }

    // ----------------------------------------------------------
    // Only allow approved update fields
    // ----------------------------------------------------------

    const updates: Record<string, unknown> = {};

    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (
        req.body?.[field] !== undefined
      ) {
        updates[field] = req.body[field];
      }
    }

    // ----------------------------------------------------------
    // Update attendance
    // ----------------------------------------------------------

    const updated =
      await attendanceService.updateAdminAttendanceRecord(
        attendanceId,
        updates,
        authReq.user.userId
      );

    // ----------------------------------------------------------
    // Return updated record
    // ----------------------------------------------------------

    sendSuccess(
      res,
      "Attendance record updated",
      updated
    );
  } catch (error) {
    next(error);
  }
};