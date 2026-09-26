import { Router } from "express";
import {
  checkUser,
  importUser,
  getImportableUsers,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getManagers,
} from "../controllers/rbac/employee.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize";

export const router = Router();

// These routes had NO authentication at all — employee data was public.
router.use(authenticate);

// module slug: "employee-list"

// [POST] Check Existing User (first step of "Add employee")
router.post("/check-user", authorize("employee-list", "add"), checkUser);

// [GET] Import User (single user by ID)
router.get("/import/:userId", authorize("employee-list", "add"), importUser);

// [GET] Users available to import (not yet employees)
router.get("/users", authorize("employee-list", "add"), getImportableUsers);

// [GET] Get All Employees
router.get("/", authorize("employee-list", "view"), getEmployees);

// [POST] Create Employee
router.post("/", authorize("employee-list", "add"), createEmployee);

// [GET] Managers dropdown (used by the employee form)
router.get("/managers", authorize("employee-list", "view"), getManagers);

// [PUT] Update Employee
router.put("/:id", authorize("employee-list", "edit"), updateEmployee);

// [DELETE] Delete (soft-delete) Employee
// NOTE: no "/employees" prefix here — this router is already mounted
// at /employees at the app level.
router.delete("/:id", authorize("employee-list", "delete"), deleteEmployee);

export default router;