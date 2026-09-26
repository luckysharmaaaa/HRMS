import React from "react";
import { X, Home } from "lucide-react";

const EMPTY_FORM = {
  name: "",
  designation: "",
  shift: "",
  startDate: "",
  endDate: "",
  reviewer: "",
};

const DESIGNATIONS_MODAL = [
  "Accountant",
  "App Developer",
  "Technician",
  "Web Developer",
  "Sales Executive Officer",
  "Designer",
  "Account Manager",
  "SEO Analyst",
  "Admin",
  "Business Analyst",
];

export default function WfhModal({ open, onClose, editData, onSubmit }) {
  const [form, setForm] = React.useState(EMPTY_FORM);

  React.useEffect(() => {
    if (open) {
      setForm(
        editData
          ? {
              name: editData.name,
              designation: editData.designation,
              shift: editData.shift,
              startDate: editData.date,
              endDate: editData.date,
              reviewer: editData.reason,
            }
          : EMPTY_FORM
      );
    }
  }, [editData, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.designation || !form.shift) return;
    onSubmit(form);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-[999] transition-opacity duration-300 ${
          open ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] bg-white z-[1000] transition-transform duration-300 shadow-2xl flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl shrink-0 shadow-sm border border-orange-100/30">
              <Home size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0F265C] tracking-tight leading-tight">
                {editData ? "Edit Request" : "Add Request"}
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-1">
                {editData
                  ? "Update the WFH request details"
                  : "Submit a new work from home request"}
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
        <form
          onSubmit={handleSubmit}
          className="flex-1 p-5 overflow-y-auto space-y-5"
        >
          {/* Employee Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Employee Name <span className="text-red-400">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter employee name"
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
              required
            />
          </div>

          {/* Designation */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Designation <span className="text-red-400">*</span>
            </label>
            <select
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition bg-white"
              required
            >
              <option value="">Select</option>
              {DESIGNATIONS_MODAL.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Shift */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Shift <span className="text-red-400">*</span>
            </label>
            <select
              value={form.shift}
              onChange={(e) => setForm({ ...form, shift: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition bg-white"
              required
            >
              <option value="">Select</option>
              <option value="Regular">Regular</option>
              <option value="Night">Night</option>
            </select>
          </div>

          {/* Start Date / End Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                required
              />
            </div>
          </div>

          {/* Reviewer / Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reviewer <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              value={form.reviewer}
              onChange={(e) => setForm({ ...form, reviewer: e.target.value })}
              placeholder="Enter reason for WFH request..."
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition resize-none"
              required
            />
          </div>

          {/* Footer inside form */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 bg-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition shadow-sm"
            >
              {editData ? "Save Changes" : "Add Request"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
