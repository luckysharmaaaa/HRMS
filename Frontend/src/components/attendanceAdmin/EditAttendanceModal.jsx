import React, { useEffect, useState } from "react";
import {
  X,
  Pencil,
  Clock,
  Calendar,
  CheckCircle2,
  Save,
  User,
  AlarmClock,
  Timer,
  Coffee,
  AlertCircle,
} from "lucide-react";

// ── Status options ────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ["Present", "Absent", "Late", "Half Day"];

// ── Convert existing attendance time into <input type="time"> format ─────────
const toTimeInputValue = (value) => {
  if (!value || value === "-") {
    return "";
  }

  const str = String(value).trim();

  // Already HH:mm
  if (/^\d{2}:\d{2}$/.test(str)) {
    return str;
  }

  // HH:mm:ss
  if (/^\d{2}:\d{2}:\d{2}$/.test(str)) {
    return str.substring(0, 5);
  }

  // MySQL DATETIME
  // Example: 2026-09-15 09:30:00
  const mysqlMatch = str.match(
    /^\d{4}-\d{2}-\d{2}[ T](\d{2}):(\d{2})(?::\d{2})?/
  );

  if (mysqlMatch) {
    return `${mysqlMatch[1]}:${mysqlMatch[2]}`;
  }

  // ISO datetime
  // Example: 2026-09-15T09:30:00.000Z
  if (str.includes("T")) {
    const timePart = str.split("T")[1];

    if (timePart) {
      const match = timePart.match(/^(\d{2}):(\d{2})/);

      if (match) {
        return `${match[1]}:${match[2]}`;
      }
    }
  }

  // 9:30 AM / 9:30 PM
  const amPmMatch = str.match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
  );

  if (amPmMatch) {
    let hours = Number(amPmMatch[1]);
    const minutes = amPmMatch[2];
    const period = amPmMatch[3].toUpperCase();

    if (period === "PM" && hours !== 12) {
      hours += 12;
    }

    if (period === "AM" && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  // Fallback
  const parsed = new Date(str);

  if (!Number.isNaN(parsed.getTime())) {
    return `${String(parsed.getHours()).padStart(2, "0")}:${String(
      parsed.getMinutes()
    ).padStart(2, "0")}`;
  }

  return "";
};

// ── Field wrapper ─────────────────────────────────────────────────────────────
const Field = ({ label, icon: Icon, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
      {Icon && <Icon size={12} className="text-orange-400" />}
      {label}
    </label>

    {children}
  </div>
);

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white transition placeholder-gray-300";

const readonlyInputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500 outline-none bg-gray-50 cursor-not-allowed";

// ── Main component ────────────────────────────────────────────────────────────
const EditAttendanceModal = ({ open, onClose, employee, onSave }) => {
  const [form, setForm] = useState({
    date: "",
    checkIn: "",
    checkOut: "",
    breakTime: "",
    late: "",
    productionHours: "",
    status: "Present",
    notes: "",
  });

  // ── Pre-fill form when employee changes ────────────────────────────────────
  useEffect(() => {
    if (!employee) {
      setForm({
        date: "",
        checkIn: "",
        checkOut: "",
        breakTime: "",
        late: "",
        productionHours: "",
        status: "Present",
        notes: "",
      });

      return;
    }

    setForm({
      date: employee.date ?? "",

      // Convert whatever backend/table sends into HH:mm
      checkIn: toTimeInputValue(employee.checkIn),

      checkOut: toTimeInputValue(employee.checkOut),

      breakTime:
        employee.breakTime && employee.breakTime !== "-"
          ? employee.breakTime
          : "",

      late:
        employee.late && employee.late !== "-"
          ? employee.late
          : "",

      productionHours:
        employee.hours && employee.hours !== "-"
          ? employee.hours
          : "",

      status: employee.status ?? "Present",

      notes: employee.notes ?? "",
    });
  }, [employee]);

  // ── Generic input handler ──────────────────────────────────────────────────
  const set = (key) => (event) => {
    const value = event.target.value;

    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!employee) {
      return;
    }

    /*
     * IMPORTANT:
     *
     * checkIn/checkOut are intentionally kept as HH:mm here.
     *
     * The parent AttendanceAdminTable / API layer should combine:
     *
     * date + HH:mm
     *
     * into:
     *
     * YYYY-MM-DD HH:mm:ss
     *
     * before calling the backend.
     *
     * This keeps the UI free from strict datetime formatting.
     */
    const updatedEmployee = {
      ...employee,

      // Date remains unchanged/read-only.
      date: form.date,

      // Native time input gives HH:mm.
      checkIn: form.checkIn || "-",
      checkOut: form.checkOut || "-",

      /*
       * These values are displayed here but should be recalculated
       * by the backend from checkIn/checkOut.
       */
      breakTime: form.breakTime || "-",
      late: form.late || "-",
      hours: form.productionHours || "0.00 Hrs",

      status: form.status,

      notes: form.notes,
    };

    if (typeof onSave === "function") {
      onSave(updatedEmployee);
    }

    console.log("Saved attendance:", updatedEmployee);

    onClose();
  };

  // ── Close ───────────────────────────────────────────────────────────────────
  const handleClose = () => {
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-black/40 z-[999] backdrop-blur-[1px]"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] bg-white z-[1000] transition-transform duration-300 shadow-2xl flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl shrink-0 shadow-sm border border-orange-100/30">
              <Pencil size={20} />
            </div>

            <div>
              <h2 className="text-base font-bold text-[#0F265C]">
                Edit Attendance
              </h2>

              <p className="text-xs text-gray-400 mt-0.5">
                {employee ? employee.name : "Select an employee"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Employee Card */}
        {employee && (
          <div className="mx-5 mt-5 flex items-center gap-3 p-3.5 bg-orange-50 border border-orange-100 rounded-xl">
            <div
              className={`w-10 h-10 rounded-full ${
                employee.avatarColor
              } flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}
            >
              {employee.avatar}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#0F265C] truncate">
                {employee.name}
              </p>

              <p className="text-xs text-gray-400">
                {employee.department}
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                employee.status === "Present"
                  ? "bg-emerald-100 text-emerald-700"
                  : employee.status === "Late"
                    ? "bg-orange-100 text-orange-700"
                    : employee.status === "Half Day"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  employee.status === "Present"
                    ? "bg-emerald-500"
                    : employee.status === "Late"
                      ? "bg-orange-500"
                      : employee.status === "Half Day"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                }`}
              />

              {employee.status}
            </span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Date */}
          <Field label="Date" icon={Calendar}>
            <input
              type="date"
              value={form.date}
              readOnly
              className={readonlyInputCls}
              title="Attendance date cannot be changed from this screen"
            />

            <p className="text-[11px] text-gray-400 mt-0.5">
              Attendance date is fixed for this record.
            </p>
          </Field>

          {/* Check In / Check Out */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Check In" icon={AlarmClock}>
              <input
                type="time"
                value={form.checkIn}
                onChange={set("checkIn")}
                className={inputCls}
                aria-label="Check In"
              />

              <p className="text-[11px] text-gray-400">
                Select the actual check-in time.
              </p>
            </Field>

            <Field label="Check Out" icon={AlarmClock}>
              <input
                type="time"
                value={form.checkOut}
                onChange={set("checkOut")}
                className={inputCls}
                aria-label="Check Out"
              />

              <p className="text-[11px] text-gray-400">
                Select the actual check-out time.
              </p>
            </Field>
          </div>

          {/* Break / Late */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Break Time" icon={Coffee}>
              <input
                type="text"
                value={form.breakTime}
                readOnly
                className={readonlyInputCls}
                placeholder="Calculated"
              />

              <p className="text-[11px] text-gray-400">
                Calculated by attendance rules.
              </p>
            </Field>

            <Field label="Late" icon={AlertCircle}>
              <input
                type="text"
                value={form.late}
                readOnly
                className={readonlyInputCls}
                placeholder="Calculated"
              />

              <p className="text-[11px] text-gray-400">
                Recalculated after saving.
              </p>
            </Field>
          </div>

          {/* Production Hours */}
          <Field label="Production Hours" icon={Clock}>
            <input
              type="text"
              value={form.productionHours}
              readOnly
              className={readonlyInputCls}
              placeholder="Calculated"
            />

            <p className="text-[11px] text-gray-400">
              Recalculated from Check In, Check Out and shift rules.
            </p>
          </Field>

          {/* Status */}
          <Field label="Status" icon={CheckCircle2}>
            <select
              value={form.status}
              onChange={set("status")}
              className={inputCls}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>

          {/* Notes */}
          <Field label="Notes (optional)" icon={Timer}>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              placeholder="Add any remarks or reason for edit…"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>

          {/* Info Banner */}
          <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
            <User
              size={14}
              className="text-blue-400 shrink-0 mt-0.5"
            />

            <p className="text-xs text-blue-600 leading-relaxed">
              Check In and Check Out can be changed using the time
              picker. Late time and production hours are automatically
              recalculated from the updated attendance times.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!employee}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition shadow-sm shadow-orange-200"
          >
            <Save size={15} />
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
};

export default EditAttendanceModal;