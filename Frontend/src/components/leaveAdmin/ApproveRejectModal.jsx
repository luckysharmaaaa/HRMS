import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

// ── Approve / Reject Confirm Modal ─────────────────────────────
export default function ApproveRejectModal({ open, mode, item, onClose, onConfirm }) {
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setRemarks("");
      setError("");
    }
  }, [open, item]);

  if (!open || !item) return null;

  const isApprove = mode === "approve";

  const handleConfirm = async () => {
    if (!isApprove && !remarks.trim()) {
      setError("Remarks are required to reject a request.");
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(item.id, remarks.trim());
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 z-10 p-6 text-center">
        <div className="flex justify-center mb-3">
          <div
            className={`p-3 rounded-full ${
              isApprove ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500"
            }`}
          >
            {isApprove ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
          </div>
        </div>
        <h3 className="text-base font-bold text-gray-800 mb-1">
          {isApprove ? "Approve Leave Request?" : "Reject Leave Request?"}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {item.firstName} {item.lastName}'s {item.leaveName} request (
          {item.totalDays} day{Number(item.totalDays) === 1 ? "" : "s"}).
        </p>

        <textarea
          rows={3}
          value={remarks}
          onChange={(e) => {
            setRemarks(e.target.value);
            setError("");
          }}
          placeholder={isApprove ? "Remarks (optional)" : "Reason for rejection (required)"}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none mb-2"
        />
        {error && <p className="text-xs text-red-500 mb-2 text-left">{error}</p>}

        <div className="flex gap-3 mt-2">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className={`flex-1 text-white py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
              isApprove ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {isApprove ? "Yes, Approve" : "Yes, Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}