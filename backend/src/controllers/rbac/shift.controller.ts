import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../types";
import { ApiError } from "../../utils/apiError";
import { sendSuccess } from "../../utils/response";
import * as shiftService from "../../services/shift.service";

export const getShifts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const shifts = await shiftService.getAllShifts();
    sendSuccess(res, "Shifts fetched successfully", shifts);
  } catch (error) {
    next(error);
  }
};

export const getShift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!id) throw ApiError.badRequest("Invalid shift ID.");

    const shift = await shiftService.getShiftById(id);
    if (!shift) throw ApiError.notFound("Shift not found");

    sendSuccess(res, "Shift fetched successfully", shift);
  } catch (error) {
    next(error);
  }
};

export const createShift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { shiftName, shiftCode, startTime, endTime, breakMinutes, graceMinutes, isNightShift, status } = req.body;

    if (!shiftName || !startTime || !endTime) {
      throw ApiError.badRequest("shiftName, startTime and endTime are required");
    }

    const shiftId = await shiftService.createShift({
      shiftName,
      shiftCode,
      startTime,
      endTime,
      breakMinutes,
      graceMinutes,
      isNightShift,
      status,
      createdBy: authReq.user?.userId ?? null,
    });

    sendSuccess(res, "Shift created successfully", { shiftId }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateShift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const id = Number(req.params.id);
    if (!id) throw ApiError.badRequest("Invalid shift ID.");

    const { shiftName, shiftCode, startTime, endTime, breakMinutes, graceMinutes, isNightShift, status } = req.body;

    await shiftService.updateShift(id, {
      shiftName,
      shiftCode,
      startTime,
      endTime,
      breakMinutes,
      graceMinutes,
      isNightShift,
      status,
      updatedBy: authReq.user?.userId ?? null,
    });

    sendSuccess(res, "Shift updated successfully", {}, 200);
  } catch (error) {
    next(error);
  }
};

export const deleteShift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const id = Number(req.params.id);
    if (!id) throw ApiError.badRequest("Invalid shift ID.");

    await shiftService.deleteShift(id, authReq.user?.userId ?? null);

    sendSuccess(res, "Shift deleted successfully", {}, 200);
  } catch (error) {
    next(error);
  }
};