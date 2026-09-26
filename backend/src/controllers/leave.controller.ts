import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { sendSuccess } from "../utils/response";
import { ApiError } from "../utils/apiError";
import * as leaveService from "../services/leave.service";
import { resolveEmployeeId } from "../services/attendance.service";
import { LeaveDayType, LeaveStatus } from "../types/leave.types";

const VALID_DAY_TYPES: LeaveDayType[] = ["FULL_DAY", "FIRST_HALF", "SECOND_HALF"];
const VALID_STATUSES: LeaveStatus[] = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

// ============================================================
// VALIDATE APPLY/EDIT PAYLOAD
// ============================================================

const parseApplyPayload = (body: any) => {
  const leaveTypeId = Number(body?.leaveTypeId);
  const startDate = body?.startDate;
  const endDate = body?.endDate;
  const dayType: LeaveDayType = body?.dayType || "FULL_DAY";
  const reason = (body?.reason || "").trim();

  if (!Number.isFinite(leaveTypeId) || leaveTypeId <= 0) {
    throw ApiError.badRequest("leaveTypeId is required");
  }
  if (!startDate || !endDate) {
    throw ApiError.badRequest("startDate and endDate are required");
  }
  if (!VALID_DAY_TYPES.includes(dayType)) {
    throw ApiError.badRequest("Invalid dayType");
  }
  if (!reason) {
    throw ApiError.badRequest("Reason is required");
  }

  return { leaveTypeId, startDate, endDate, dayType, reason };
};

// ============================================================
// LEAVE TYPES
// ============================================================

export const getLeaveTypes = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const types = await leaveService.getActiveLeaveTypes();
    sendSuccess(res, "Leave types fetched", types);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// LEAVE BALANCE (self)
// ============================================================

export const getMyBalance = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const employeeId = await resolveEmployeeId(authReq.user.userId);
    const balance = await leaveService.getEmployeeBalance(employeeId);
    sendSuccess(res, "Leave balance fetched", balance);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// APPLY FOR LEAVE
// ============================================================

export const applyLeave = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const employeeId = await resolveEmployeeId(authReq.user.userId);
    const payload = parseApplyPayload(req.body);

    const result = await leaveService.applyLeave(
      employeeId,
      authReq.user.userId,
      payload,
    );

    sendSuccess(res, "Leave application submitted", result, 201);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// EMPLOYEE: OWN APPLICATIONS LIST
// ============================================================

export const getMyApplications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const employeeId = await resolveEmployeeId(authReq.user.userId);

    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const leaveTypeId = req.query.leaveTypeId
      ? Number(req.query.leaveTypeId)
      : undefined;
    const status = req.query.status as LeaveStatus | undefined;
    const startDate = (req.query.startDate as string) || undefined;
    const endDate = (req.query.endDate as string) || undefined;

    if (status && !VALID_STATUSES.includes(status)) {
      throw ApiError.badRequest("Invalid status filter");
    }

    const { rows, total } = await leaveService.getEmployeeApplications(
      employeeId,
      { page, limit, leaveTypeId, status, startDate, endDate },
    );

    sendSuccess(res, "Leave applications fetched", {
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET APPLICATION DETAIL (own)
// ============================================================

export const getApplicationDetail = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const employeeId = await resolveEmployeeId(authReq.user.userId);
    const id = Number(req.params.id);

    const application = await leaveService.getApplicationById(id);
    if (!application) throw ApiError.notFound("Leave application not found");
    if (application.employeeId !== employeeId) {
      throw ApiError.forbidden("You cannot view this leave application");
    }

    sendSuccess(res, "Leave application fetched", application);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// EDIT OWN PENDING APPLICATION
// ============================================================

export const editApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const employeeId = await resolveEmployeeId(authReq.user.userId);
    const id = Number(req.params.id);
    const payload = parseApplyPayload(req.body);

    const result = await leaveService.editApplication(id, employeeId, payload);
    sendSuccess(res, "Leave application updated", result);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CANCEL OWN APPLICATION
// ============================================================

export const cancelApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const employeeId = await resolveEmployeeId(authReq.user.userId);
    const id = Number(req.params.id);

    const result = await leaveService.cancelApplication(id, employeeId);
    sendSuccess(res, "Leave application cancelled", result);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ADMIN: ALL APPLICATIONS LIST
// ============================================================

export const getAdminApplications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const employeeId = req.query.employeeId
      ? Number(req.query.employeeId)
      : undefined;
    const departmentId = req.query.departmentId
      ? Number(req.query.departmentId)
      : undefined;
    const leaveTypeId = req.query.leaveTypeId
      ? Number(req.query.leaveTypeId)
      : undefined;
    const status = req.query.status as LeaveStatus | undefined;
    const startDate = (req.query.startDate as string) || undefined;
    const endDate = (req.query.endDate as string) || undefined;
    const search = (req.query.search as string) || undefined;

    if (status && !VALID_STATUSES.includes(status)) {
      throw ApiError.badRequest("Invalid status filter");
    }

    const { rows, total } = await leaveService.getAdminApplications({
      page,
      limit,
      employeeId,
      departmentId,
      leaveTypeId,
      status,
      startDate,
      endDate,
      search,
    });

    sendSuccess(res, "Leave applications fetched", {
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ADMIN: APPROVE
// ============================================================

export const approveApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const reviewerEmployeeId = await resolveEmployeeId(authReq.user.userId);
    const id = Number(req.params.id);
    const remarks = req.body?.remarks as string | undefined;

    const result = await leaveService.approveApplication(
      id,
      authReq.user.userId,
      reviewerEmployeeId,
      remarks,
    );

    sendSuccess(res, "Leave application approved", result);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ADMIN: REJECT
// ============================================================

export const rejectApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const reviewerEmployeeId = await resolveEmployeeId(authReq.user.userId);
    const id = Number(req.params.id);
    const remarks = (req.body?.remarks || "").trim();

    if (!remarks) throw ApiError.badRequest("Remarks are required to reject a request");

    const result = await leaveService.rejectApplication(
      id,
      reviewerEmployeeId,
      remarks,
    );

    sendSuccess(res, "Leave application rejected", result);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// LEAVE SETTINGS
// ============================================================

export const getMySummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const employeeId = await resolveEmployeeId(authReq.user.userId);
    const summary = await leaveService.getEmployeeLeaveSummary(employeeId);
    sendSuccess(res, "Leave summary fetched", summary);
  } catch (error) {
    next(error);
  }
};

export const getAdminSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const summary = await leaveService.getAdminLeaveSummary();
    sendSuccess(res, "Leave summary fetched", summary);
  } catch (error) {
    next(error);
  }
};

export const getLeaveSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const settings = await leaveService.getAllLeaveSettings();
    sendSuccess(res, "Leave settings fetched", settings);
  } catch (error) {
    next(error);
  }
};

export const createLeaveSetting = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const leaveCode = (req.body?.leaveCode || "").trim();
    const leaveName = (req.body?.leaveName || "").trim();

    if (!leaveCode || !leaveName) {
      throw ApiError.badRequest("leaveCode and leaveName are required");
    }

    const created = await leaveService.createLeaveSetting(
      { ...req.body, leaveCode, leaveName },
      authReq.user.userId,
    );

    sendSuccess(res, "Leave policy created", created, 201);
  } catch (error) {
    next(error);
  }
};

export const updateLeaveSetting = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const id = Number(req.params.id);
    const body = { ...req.body };

    if (body.leaveCode !== undefined) body.leaveCode = body.leaveCode.trim();
    if (body.leaveName !== undefined) body.leaveName = body.leaveName.trim();

    if (
      (body.leaveCode !== undefined && !body.leaveCode) ||
      (body.leaveName !== undefined && !body.leaveName)
    ) {
      throw ApiError.badRequest("leaveCode and leaveName cannot be empty");
    }

    const updated = await leaveService.updateLeaveSetting(
      id,
      body,
      authReq.user.userId,
    );

    sendSuccess(res, "Leave policy updated", updated);
  } catch (error) {
    next(error);
  }
};