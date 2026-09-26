import React, { useState, useEffect } from "react";
import { CalendarPlus, X, Info, Loader2 } from "lucide-react";
import {
  getLeaveTypes,
  getMyBalance,
  applyLeave,
  editApplication,
} from "../../services/leaveService";

const EMPTY_FORM = {
  leaveTypeId: "",
  from: "",
  to: "",
  dayType: "FULL_DAY",
  reason: "",
};

const DAY_TYPE_OPTIONS = [
  { value: "FULL_DAY", label: "Full Day" },
  { value: "FIRST_HALF", label: "First Half" },
  { value: "SECOND_HALF", label: "Second Half" },
];

// Converts ISO string / Date to "YYYY-MM-DD" (local time) for <input type="date">
const toInputDate = (v) => {
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (isNaN(d)) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** Days between two ISO date strings (inclusive). Half day always counts as 0.5. */
function calcDays(from, to, dayType) {
  if (!from || !to) return "";
  if (dayType !== "FULL_DAY") return from === to ? 0.5 : "";
  const ms = new Date(to) - new Date(from);
  if (ms < 0) return "";
  return Math.round(ms / 86_400_000) + 1;
}

// ── Component ──────────────────────────────────────────────────
export default function AddLeaveModal({ open, onClose, onSubmit, editData }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // Load leave types + balance whenever the drawer opens
  useEffect(() => {
    if (!open) return;

    setApiError("");
    setErrors({});

    if (editData) {
      setForm({
        leaveTypeId: String(editData.leaveTypeId ?? ""),
        from: toInputDate(editData.startDate),
        to: toInputDate(editData.endDate),
        dayType: editData.dayType ?? "FULL_DAY",
        reason: editData.reason ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }

    setLoading(true);
    Promise.all([getLeaveTypes(), getMyBalance()])
      .then(([types, balance]) => {
        setLeaveTypes(types);
        setBalances(balance);
      })
      .catch(() => setApiError("Failed to load leave types/balance."))
      .finally(() => setLoading(false));
  }, [open, editData]);

  // Half-day leave is always a single day, so "to" follows "from"
  const isFullDay = form.dayType === "FULL_DAY";
  const effectiveTo = isFullDay ? form.to : form.from;

  const days = calcDays(form.from, effectiveTo, form.dayType);

  const selectedType = leaveTypes.find(
    (t) => String(t.id) === String(form.leaveTypeId),
  );
  const selectedBalance = balances.find(
    (b) => String(b.leaveSettingId) === String(form.leaveTypeId),
  );

  const balanceVal = selectedBalance ? Number(selectedBalance.balanceLeave) : null;
  const remaining =
    balanceVal !== null && days !== "" ? Math.max(0, balanceVal - Number(days)) : "";

  // ── Validation ─────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.leaveTypeId) e.leaveTypeId = "Please select a leave type.";
    if (!form.from) e.from = "Start date is required.";
    if (isFullDay && !form.to) e.to = "End date is required.";
    if (form.from && effectiveTo && new Date(effectiveTo) < new Date(form.from))
      e.to = "End date must be after start date.";
    if (!form.reason.trim()) e.reason = "Please provide a reason.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    const payload = {
      leaveTypeId: Number(form.leaveTypeId),
      startDate: form.from,
      endDate: effectiveTo,
      dayType: form.dayType,
      reason: form.reason.trim(),
    };

    setSubmitting(true);
    setApiError("");

    try {
      const result = editData
        ? await editApplication(editData.id, payload)
        : await applyLeave(payload);

      onSubmit?.(result);
      onClose();
    } catch (err) {
      setApiError(
        err?.response?.data?.message || "Failed to submit leave request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Force Full Day if the selected type doesn't allow half days
  useEffect(() => {
    if (selectedType && !selectedType.allowHalfDay && form.dayType !== "FULL_DAY") {
      setForm((prev) => ({ ...prev, dayType: "FULL_DAY" }));
    }
  }, [selectedType]);

  const badgeColour =
    balanceVal === null
      ? ""
      : balanceVal > 5
        ? "bg-green-50 text-green-700 border-green-200"
        : balanceVal > 0
          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
          : "bg-red-50 text-red-600 border-red-200";

  return (
    <>
      {/* ── Backdrop ───────────────────────────────────────── */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[999] transition-opacity duration-300 ${
          open
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
      />

      {/* ── Drawer ─────────────────────────────────────────── */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] bg-white z-[1000] transition-transform duration-300 shadow-2xl flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl shrink-0 shadow-sm border border-orange-100/60">
              <CalendarPlus size={22} />
            </div>
            <div>
              <h2 className="text-[1.4rem] font-bold text-[#0F265C] tracking-tight leading-tight">
                {editData ? "Edit Leave" : "Apply for Leave"}
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                {editData
                  ? "Update your leave request details"
                  : "Fill in the details and submit your leave request"}
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

        {/* ── Form Body ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Loading leave details...</span>
            </div>
          ) : (
            <>
              {apiError && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-2.5">
                  {apiError}
                </div>
              )}

              {/* Leave Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Leave Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.leaveTypeId}
                  onChange={set("leaveTypeId")}
                  disabled={!!editData}
                  className={`w-full border rounded-lg px-3.5 py-2.5 text-sm outline-none bg-white transition disabled:bg-gray-50 disabled:text-gray-400
                    ${
                      errors.leaveTypeId
                        ? "border-red-400 focus:ring-2 focus:ring-red-100"
                        : "border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    }`}
                >
                  <option value="">Select leave type</option>
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.leaveName}
                    </option>
                  ))}
                </select>
                {errors.leaveTypeId && (
                  <p className="text-xs text-red-500 mt-1">{errors.leaveTypeId}</p>
                )}

                {/* Balance badge */}
                {form.leaveTypeId && balanceVal !== null && (
                  <div
                    className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium border rounded-full px-3 py-1 ${badgeColour}`}
                  >
                    <Info size={12} />
                    Balance: {balanceVal} day{balanceVal !== 1 ? "s" : ""} available
                  </div>
                )}
              </div>

              {/* Day Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Day Type
                </label>
                <div className="flex gap-5">
                  {DAY_TYPE_OPTIONS.map(({ value, label }) => (
                    <label
                      key={value}
                      className={`flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none ${
                        selectedType && !selectedType.allowHalfDay && value !== "FULL_DAY"
                          ? "opacity-40 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="dayType"
                        value={value}
                        checked={form.dayType === value}
                        disabled={
                          selectedType && !selectedType.allowHalfDay && value !== "FULL_DAY"
                        }
                        onChange={() =>
                          setForm((prev) => ({ ...prev, dayType: value }))
                        }
                        className="accent-orange-500"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* From / To */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    From <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.from}
                    onChange={set("from")}
                    className={`w-full border rounded-lg px-3.5 py-2.5 text-sm outline-none transition
                      ${
                        errors.from
                          ? "border-red-400 focus:ring-2 focus:ring-red-100"
                          : "border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                      }`}
                  />
                  {errors.from && (
                    <p className="text-xs text-red-500 mt-1">{errors.from}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    To <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={effectiveTo}
                    min={form.from || undefined}
                    disabled={!isFullDay}
                    onChange={set("to")}
                    className={`w-full border rounded-lg px-3.5 py-2.5 text-sm outline-none transition disabled:bg-gray-50
                      ${
                        errors.to
                          ? "border-red-400 focus:ring-2 focus:ring-red-100"
                          : "border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                      }`}
                  />
                  {errors.to && (
                    <p className="text-xs text-red-500 mt-1">{errors.to}</p>
                  )}
                </div>
              </div>

              {/* Auto-calculated summary card */}
              {days !== "" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider mb-1">
                      No of Days
                    </p>
                    <p className="text-2xl font-bold text-orange-600">{days}</p>
                  </div>
                  {remaining !== "" && (
                    <div
                      className={`border rounded-xl px-4 py-3 ${
                        remaining > 0
                          ? "bg-green-50 border-green-100"
                          : "bg-red-50 border-red-100"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                          remaining > 0 ? "text-green-500" : "text-red-400"
                        }`}
                      >
                        Remaining After
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          remaining > 0 ? "text-green-700" : "text-red-600"
                        }`}
                      >
                        {remaining}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  maxLength={300}
                  value={form.reason}
                  onChange={set("reason")}
                  placeholder="Briefly describe your reason for leave..."
                  className={`w-full border rounded-lg px-3.5 py-2.5 text-sm outline-none resize-none transition
                    ${
                      errors.reason
                        ? "border-red-400 focus:ring-2 focus:ring-red-100"
                        : "border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    }`}
                />
                {errors.reason && (
                  <p className="text-xs text-red-500 mt-1">{errors.reason}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1 text-right">
                  {form.reason.length} / 300
                </p>
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
                <Info size={14} className="shrink-0 mt-0.5 text-blue-400" />
                <span>
                  Your leave request will be sent to your manager for approval. You
                  will be notified once a decision is made.
                </span>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <div className="flex justify-end gap-3 px-6 py-5 border-t border-gray-100 bg-gray-50 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-white bg-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {editData ? "Update Request" : "Submit Request"}
          </button>
        </div>
      </div>
    </>
  );
}