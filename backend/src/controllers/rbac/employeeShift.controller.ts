import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../types";
import { ApiError } from "../../utils/apiError";
import { sendSuccess } from "../../utils/response";
import * as employeeShiftService from "../../services/employeeShift.service";

export const getEmployeeShift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const employeeId = Number(req.params.employeeId);
    if (!employeeId) throw ApiError.badRequest("Invalid employee ID.");

    const shift = await employeeShiftService.getActiveEmployeeShift(employeeId);
    sendSuccess(res, "Employee shift fetched successfully", shift);
  } catch (error) {
    next(error);
  }
};

export const getEmployeeShiftHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const employeeId = Number(req.params.employeeId);
    if (!employeeId) throw ApiError.badRequest("Invalid employee ID.");

    const history = await employeeShiftService.getEmployeeShiftHistory(employeeId);
    sendSuccess(res, "Employee shift history fetched successfully", history);
  } catch (error) {
    next(error);
  }
};

export const assignEmployeeShift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const employeeId = Number(req.params.employeeId);
    if (!employeeId) throw ApiError.badRequest("Invalid employee ID.");

    const { shiftId, effectiveFrom, notes } = req.body;

    if (!shiftId || !effectiveFrom) {
      throw ApiError.badRequest("shiftId and effectiveFrom are required");
    }

    const id = await employeeShiftService.assignEmployeeShift(employeeId, {
      shiftId: Number(shiftId),
      effectiveFrom: String(effectiveFrom).slice(0, 10),
      notes: notes ?? null,
      assignedBy: authReq.user?.userId ?? null,
    });

    sendSuccess(res, "Shift assigned successfully", { employeeShiftId: id }, 201);
  } catch (error) {
    next(error);
  }
};