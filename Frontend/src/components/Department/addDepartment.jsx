
import React, { useEffect, useState } from "react";
import { X, ChevronDown, Building2 } from "lucide-react";

export default function AddDepartmentModal({
  open,
  onClose,
  editData,
  onSubmit,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");

  const [nameError, setNameError] = useState("");

  // ==========================================================
  // Populate form for Add / Edit
  // ==========================================================
  useEffect(() => {
    if (editData) {
      // Edit mode
      setName(editData.name || "");
      setDescription(editData.description || "");
      setStatus(editData.status || "Active");
    } else {
      // Add mode
      setName("");
      setDescription("");
      setStatus("Active");
    }

    setNameError("");
  }, [editData, open]);

  // ==========================================================
  // Submit
  // ==========================================================
  const handleSubmit = () => {
    if (!name.trim()) {
      setNameError("Department name is required.");
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      status,
    });
  };

  return (
    <div
      className={`drawer drawer-end z-[1000] fixed inset-0 ${
        open
          ? "pointer-events-auto"
          : "pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transition-transform duration-300 ${
          open
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        {/* =====================================================
            Header
        ====================================================== */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Building2
                size={20}
                className="text-orange-500"
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#0F265C]">
                {editData
                  ? "Edit Department"
                  : "Add Department"}
              </h2>

              <p className="text-xs text-gray-500 mt-0.5">
                {editData
                  ? "Update department details"
                  : "Create a new department"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* =====================================================
            Body
        ====================================================== */}
        <div className="p-6 flex flex-col gap-6 overflow-y-auto">

          {/* Department Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-semibold text-[#0F265C]">
              Department Name{" "}
              <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError("");
              }}
              placeholder="Enter department name"
              className={`w-full border rounded-lg p-2.5 text-sm outline-none transition ${
                nameError
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-200 focus:border-orange-500"
              }`}
            />

            {nameError && (
              <p className="text-xs text-red-500 mt-0.5">
                {nameError}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-semibold text-[#0F265C]">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Enter department description"
              rows={4}
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-orange-500 transition resize-none"
            />
          </div>

          {/* Status */}
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
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-orange-500 transition appearance-none bg-white"
              >
                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>

              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            Footer
        ====================================================== */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-end items-center gap-3 p-5 border-t border-gray-100 bg-white">
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
              : "Add Department"}
          </button>
        </div>
      </div>
    </div>
  );
}

