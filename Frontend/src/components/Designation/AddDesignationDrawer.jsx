import React, { useEffect, useState } from "react";
import {
  X,
  ChevronDown,
  Briefcase,
} from "lucide-react";

export default function AddDesignationDrawer({
  open,
  onClose,
  editData,
  departments = [],
  onSubmit,
}) {
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState("Active");

  const [titleError, setTitleError] = useState("");
  const [departmentError, setDepartmentError] =
    useState("");

  // ==========================================================
  // SET FORM DATA
  // ==========================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    if (editData) {
      // ------------------------------------------------------
      // EDIT MODE
      // ------------------------------------------------------

      setTitle(
        editData.designationName || ""
      );

      // IMPORTANT:
      // designation API returns departmentId
      // and department dropdown uses department.id
      setDepartmentId(
        editData.departmentId !== null &&
          editData.departmentId !== undefined
          ? String(editData.departmentId)
          : ""
      );

      setStatus(
        editData.status === "Inactive"
          ? "Inactive"
          : "Active"
      );
    } else {
      // ------------------------------------------------------
      // ADD MODE
      // ------------------------------------------------------

      setTitle("");
      setDepartmentId("");
      setStatus("Active");
    }

    setTitleError("");
    setDepartmentError("");
  }, [editData, open]);

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = () => {
    let hasError = false;

    // ------------------------------------------------------
    // Validate designation name
    // ------------------------------------------------------

    if (!title.trim()) {
      setTitleError(
        "Designation name is required."
      );

      hasError = true;
    }

    // ------------------------------------------------------
    // Validate department
    // ------------------------------------------------------

    if (!departmentId) {
      setDepartmentError(
        "Department is required."
      );

      hasError = true;
    }

    if (hasError) {
      return;
    }

    // ------------------------------------------------------
    // Prepare API data
    // ------------------------------------------------------

    const formData = {
      departmentId: Number(departmentId),
      designationName: title.trim(),
      description:
        editData?.description?.trim() || null,
      status,
    };

    // ------------------------------------------------------
    // Send to parent
    // ------------------------------------------------------

    onSubmit(formData);
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className={`fixed inset-0 z-[1000] ${
        open
          ? "pointer-events-auto"
          : "pointer-events-none"
      }`}
    >
      {/* =====================================================
          BACKDROP
      ===================================================== */}

      <div
        className={`absolute inset-0 bg-black/30 transition-opacity ${
          open
            ? "opacity-100"
            : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* =====================================================
          DRAWER
      ===================================================== */}

      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col transition-transform duration-300 ${
          open
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Briefcase
                size={20}
                className="text-orange-500"
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#0F265C]">
                {editData
                  ? "Edit Designation"
                  : "Add Designation"}
              </h2>

              <p className="text-xs text-gray-500 mt-0.5">
                {editData
                  ? "Update designation details"
                  : "Create a new designation"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* ==================================================
            BODY
        ================================================== */}

        <div className="p-6 flex flex-col gap-6">
          {/* ==================================================
              DESIGNATION NAME
          ================================================== */}

          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-semibold text-[#0F265C]">
              Designation Name{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleError("");
              }}
              placeholder="Enter designation name"
              className={`w-full border rounded-lg p-2.5 text-sm outline-none transition ${
                titleError
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-200 focus:border-orange-500"
              }`}
            />

            {titleError && (
              <p className="text-xs text-red-500">
                {titleError}
              </p>
            )}
          </div>

          {/* ==================================================
              DEPARTMENT
          ================================================== */}

          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-semibold text-[#0F265C]">
              Department{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <div className="relative">
              <select
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(
                    e.target.value
                  );
                  setDepartmentError("");
                }}
                className={`w-full border rounded-lg p-2.5 text-sm text-[#0F265C] outline-none transition appearance-none bg-white ${
                  departmentError
                    ? "border-red-400 focus:border-red-500"
                    : "border-gray-200 focus:border-orange-500"
                }`}
              >
                <option
                  value=""
                  className="text-[#0F265C] bg-white"
                >
                  Select Department
                </option>

                {Array.isArray(departments) &&
                  departments.map(
                    (department) => (
                      <option
                        key={department.id}
                        value={String(
                          department.id
                        )}
                        className="text-[#0F265C] bg-white"
                      >
                        {
                          department.departmentName
                        }
                      </option>
                    )
                  )}
              </select>

              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <ChevronDown size={16} />
              </div>
            </div>

            {departmentError && (
              <p className="text-xs text-red-500">
                {departmentError}
              </p>
            )}

            {departments.length === 0 && (
              <p className="text-xs text-gray-400">
                No departments available.
              </p>
            )}
          </div>

          {/* ==================================================
              STATUS
          ================================================== */}

          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-semibold text-[#0F265C]">
              Status
            </label>

            <div className="relative">
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm text-[#0F265C] outline-none focus:border-orange-500 transition appearance-none bg-white"
              >
                <option
                  value="Active"
                  className="text-[#0F265C] bg-white"
                >
                  Active
                </option>

                <option
                  value="Inactive"
                  className="text-[#0F265C] bg-white"
                >
                  Inactive
                </option>
              </select>

              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="mt-auto flex justify-end items-center gap-3 p-5 border-t border-gray-100 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition shadow-sm"
          >
            {editData
              ? "Save Changes"
              : "Add Designation"}
          </button>
        </div>
      </div>
    </div>
  );
}