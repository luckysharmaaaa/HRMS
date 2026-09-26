import React, { useEffect, useState } from "react";
import { X, Clock, History } from "lucide-react";
import { toast } from "react-toastify";

import {
  getShifts,
  getEmployeeShift,
  assignEmployeeShift,
  getEmployeeShiftHistory,
} from "../../services/employeeShift.service";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timeStr) {
  if (!timeStr) return "-";
  const [h, m] = timeStr.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${m} ${suffix}`;
}

export default function EmployeeShiftDrawer({ open, onClose, employee }) {
  const [shifts, setShifts] = useState([]);
  const [currentShift, setCurrentShift] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!employee?.id) return;

    setLoading(true);

    try {
      const [shiftsRes, currentRes, historyRes] = await Promise.all([
        getShifts(),
        getEmployeeShift(employee.id),
        getEmployeeShiftHistory(employee.id),
      ]);

      setShifts(shiftsRes.data?.data ?? []);
      setCurrentShift(currentRes.data?.data ?? null);
      setHistory(historyRes.data?.data ?? []);
    } catch (error) {
      console.error("SHIFT DRAWER FETCH ERROR:", error);
      toast.error("Failed to load shift details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    setSelectedShiftId("");
    setEffectiveFrom("");
    setNotes("");

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employee?.id]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  const handleAssign = async (e) => {
    e.preventDefault();

    if (!selectedShiftId || !effectiveFrom) {
      toast.error("Please select a shift and effective date.");
      return;
    }

    setSaving(true);

    try {
      await assignEmployeeShift(employee.id, {
        shiftId: Number(selectedShiftId),
        effectiveFrom,
        notes: notes || null,
      });

      toast.success(
        currentShift ? "Shift changed successfully" : "Shift assigned successfully"
      );

      setSelectedShiftId("");
      setEffectiveFrom("");
      setNotes("");

      await fetchData();
    } catch (error) {
      console.error("ASSIGN SHIFT ERROR:", error);
      toast.error(
        error?.response?.data?.message || "Failed to assign shift."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="drawer drawer-end fixed inset-0 z-[1000] pointer-events-auto">
      <input type="checkbox" className="drawer-toggle" checked readOnly />

      <div className="drawer-side">
        <label onClick={onClose} className="drawer-overlay" />

        <div className="flex h-full w-[420px] flex-col bg-white shadow-2xl sm:w-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <div className="flex items-center gap-3.5">
              <div className="shrink-0 rounded-xl border border-orange-100/60 bg-orange-50 p-2.5 text-orange-500 shadow-sm">
                <Clock size={22} />
              </div>

              <div>
                <h2 className="text-[1.25rem] font-bold leading-tight tracking-tight text-[#0F265C]">
                  Shift Details
                </h2>
                <p className="mt-0.5 text-xs font-medium text-gray-400">
                  {employee?.name} · {employee?.empId}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-gray-100/50 p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <p className="text-center text-sm text-gray-400 py-8">
                Loading shift details...
              </p>
            ) : (
              <>
                {/* Current Shift */}
                <div>
                  <h3 className="mb-2 text-[13px] font-semibold text-[#1f2937]">
                    Current Shift
                  </h3>

                  {currentShift ? (
                    <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0F265C]">
                          {currentShift.shiftName}
                        </span>
                        {currentShift.shiftCode && (
                          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-orange-600 border border-orange-200">
                            {currentShift.shiftCode}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <p>
                          <span className="text-gray-400">Start:</span>{" "}
                          {formatTime(currentShift.startTime)}
                        </p>
                        <p>
                          <span className="text-gray-400">End:</span>{" "}
                          {formatTime(currentShift.endTime)}
                        </p>
                        <p>
                          <span className="text-gray-400">Break:</span>{" "}
                          {currentShift.breakMinutes} min
                        </p>
                        <p>
                          <span className="text-gray-400">Grace:</span>{" "}
                          {currentShift.graceMinutes} min
                        </p>
                      </div>

                      <p className="text-xs text-gray-500 pt-1 border-t border-orange-100">
                        Effective from{" "}
                        <span className="font-medium">
                          {formatDate(currentShift.effectiveFrom)}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
                      No shift assigned yet.
                    </p>
                  )}
                </div>

                {/* Assign / Change */}
                <form onSubmit={handleAssign} className="space-y-3">
                  <h3 className="text-[13px] font-semibold text-[#1f2937]">
                    {currentShift ? "Change Shift" : "Assign Shift"}
                  </h3>

                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-[#1f2937]">
                      Shift <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedShiftId}
                      onChange={(e) => setSelectedShiftId(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                    >
                      <option value="">Select shift</option>
                      {shifts.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.shiftName} ({formatTime(s.startTime)} - {formatTime(s.endTime)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-[#1f2937]">
                      Effective From <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={effectiveFrom}
                      onChange={(e) => setEffectiveFrom(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-[#1f2937]">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 min-h-[70px]"
                      placeholder="Optional"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : currentShift
                      ? "Change Shift"
                      : "Assign Shift"}
                  </button>
                </form>

                {/* History */}
                <div>
                  <h3 className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-[#1f2937]">
                    <History size={14} />
                    Shift History
                  </h3>

                  {history.length === 0 ? (
                    <p className="text-xs text-gray-400">No history yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {history.map((h) => (
                        <div
                          key={h.id}
                          className="rounded-lg border border-gray-100 p-3 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-700">
                              {h.shiftName}
                            </span>
                            {!h.effectiveTo && (
                              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600 border border-green-200">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-gray-400">
                            {formatDate(h.effectiveFrom)} –{" "}
                            {h.effectiveTo ? formatDate(h.effectiveTo) : "Present"}
                          </p>
                          {h.notes && (
                            <p className="mt-1 text-gray-500">{h.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}