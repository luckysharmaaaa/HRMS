import React, { useState } from "react";
import { CalendarCheck, X } from "lucide-react";
import { LEAVE_TYPES } from "./leaveAdminData";

const EMPTY_FORM = {
  name: "",
  leaveType: "",
  from: "",
  to: "",
  dayType: "Full Day",
  days: "",
  remaining: "",
  reason: "",
};

// ── Add / Edit Leave Modal (Drawer) ───────────────────────────
export default function LeaveModal({ open, onClose, editData }) {
  const [form, setForm] = useState(editData ?? EMPTY_FORM);

  React.useEffect(() => {
    setForm(editData ?? EMPTY_FORM); // ?? is Nullish Coalescing Operator -
  }, [editData, open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-[999] transition-opacity duration-300 ${
          open
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[460px] bg-white  z-[1000] transition-transform duration-300 shadow-2xl flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl shrink-0 shadow-sm border border-orange-100/30">
              <CalendarCheck size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0F265C] tracking-tight leading-tight">
                {editData ? "Edit Leave" : "Add Leave"}
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-1">
                {editData
                  ? "Update leave schedule details for this user"
                  : "Submit new leave entries for authorization"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {/* Employee Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Employee Name <span className="text-red-400">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Select Employee"
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
            />
          </div>

          {/* Leave Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Leave Type <span className="text-red-400">*</span>
            </label>
            <select
              value={form.leaveType}
              onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition bg-white"
            >
              <option value="">Select</option>
              {LEAVE_TYPES.slice(1).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Day Type (edit only) */}
          {editData && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Day Type
              </label>
              <div className="flex gap-4">
                {["Full Day", "First Half", "Second Half"].map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="dayType"
                      value={type}
                      checked={form.dayType === type}
                      onChange={() => setForm({ ...form, dayType: type })}
                      className="accent-orange-500"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* From / To */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                From <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                To <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
              />
            </div>
          </div>

          {/* No of Days / Remaining */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                No of Days
              </label>
              <input
                value={form.days}
                readOnly
                placeholder="Auto calculated"
                className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3.5 py-2.5 text-sm text-gray-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Remaining Days
              </label>
              <input
                value={form.remaining}
                readOnly
                placeholder="—"
                className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3.5 py-2.5 text-sm text-gray-500 outline-none"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason
            </label>
            <textarea
              rows={4}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Enter reason for leave..."
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 bg-white transition"
          >
            Cancel
          </button>
          <button className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition shadow-sm">
            {editData ? "Update Leave" : "Add Leave"}
          </button>
        </div>
      </div>
    </>
  );
}
