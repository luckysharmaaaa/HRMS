import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { resolveEmployeeId } from "../services/attendance.service";
import {
  submitRegularizationRequest,
  updateRegularizationRequest,
  getMyRegularizationRequests,
  getRegularizationRequestsForReview,
  approveRegularizationRequest,
  rejectRegularizationRequest,
} from "../services/Attendanceregularization.service";
import { RegularizationStatus } from "../types/Attendanceregularization.types";

// ============================================================
// SUBMIT REGULARIZATION REQUEST
// ============================================================

export const submitRegularization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authReq = req as AuthRequest;
    const employeeId = await resolveEmployeeId(authReq.user.userId);

    const {
      attendanceId,
      requestType,
      requestedCheckIn,
      requestedCheckOut,
      requestedStatus,
      reason,
    } = req.body;

    const request = await submitRegularizationRequest(
      employeeId,
      authReq.user.userId,
      Number(attendanceId),
      requestType,
      requestedCheckIn ?? null,
      requestedCheckOut ?? null,
      requestedStatus ?? null,
      reason,
    );

    return res.status(201).json({ success: true, data: request });
  } catch (error) {
    return next(error);
  }
};

// ============================================================
// UPDATE REGULARIZATION REQUEST (edit while PENDING — Part 9)
// ============================================================

// FIXED: now also passes authReq.user.userId through, matching the
// updated updateRegularizationRequest signature (see service —
// updatedBy was previously getting employeeId instead of userId).
export const updateRegularization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authReq = req as AuthRequest;
    const employeeId = await resolveEmployeeId(authReq.user.userId);
    const requestId = Number(req.params.id);

    const {
      requestType,
      requestedCheckIn,
      requestedCheckOut,
      requestedStatus,
      reason,
    } = req.body;

    const updated = await updateRegularizationRequest(
      employeeId,
      authReq.user.userId, // ADDED
      requestId,
      requestType,
      requestedCheckIn ?? null,
      requestedCheckOut ?? null,
      requestedStatus ?? null,
      reason,
    );

    return res.json({ success: true, data: updated });
  } catch (error) {
    return next(error);
  }
};

// ============================================================
// GET MY REGULARIZATION REQUESTS
// ============================================================

export const getMyRegularizations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authReq = req as AuthRequest;
    const employeeId = await resolveEmployeeId(authReq.user.userId);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const status = req.query.status as RegularizationStatus | undefined;

    const { rows, total } = await getMyRegularizationRequests(
      employeeId,
      page,
      limit,
      status,
    );

    return res.json({ success: true, data: rows, total, page, limit });
  } catch (error) {
    return next(error);
  }
};

// ============================================================
// GET REGULARIZATION REQUESTS FOR REVIEW (HR / manager)
// ============================================================

export const getRegularizationsForReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const status = req.query.status as RegularizationStatus | undefined;

    // ADDED: month-filter passthrough. Without these, RegularizationReview's
    // MonthYearPicker on the frontend has nothing to actually filter by —
    // the request would always return every request regardless of the
    // month HR selected.
    const startDate = (req.query.startDate as string) || undefined;
    const endDate = (req.query.endDate as string) || undefined;

    const { rows, total } = await getRegularizationRequestsForReview(
      page,
      limit,
      status,
      startDate,
      endDate,
    );

    return res.json({ success: true, data: rows, total, page, limit });
  } catch (error) {
    return next(error);
  }
};

// ============================================================
// APPROVE REGULARIZATION REQUEST
// ============================================================

export const approveRegularization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authReq = req as AuthRequest;
    const requestId = Number(req.params.id);
    const { reviewRemarks } = req.body;

    const updated = await approveRegularizationRequest(
      requestId,
      authReq.user.userId,
      reviewRemarks ?? null,
    );

    return res.json({ success: true, data: updated });
  } catch (error) {
    return next(error);
  }
};

// ============================================================
// REJECT REGULARIZATION REQUEST
// ============================================================

export const rejectRegularization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authReq = req as AuthRequest;
    const requestId = Number(req.params.id);
    const { reviewRemarks } = req.body;

    if (!reviewRemarks || !String(reviewRemarks).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "reviewRemarks is required when rejecting" });
    }

    const updated = await rejectRegularizationRequest(
      requestId,
      authReq.user.userId,
      reviewRemarks,
    );

    return res.json({ success: true, data: updated });
  } catch (error) {
    return next(error);
  }
};