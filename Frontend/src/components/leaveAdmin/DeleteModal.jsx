import React from "react";
import { AlertTriangle } from "lucide-react";

// ── Generic Confirm Modal (Delete / Cancel / etc.) ─────────────
export default function DeleteModal({
  open,
  item,
  onClose,
  onConfirm,
  title = "Delete Leave Record?",
  message,
  confirmLabel = "Yes, Delete",
  confirmColor = "red",
}) {
  if (!open || !item) return null;

  const colorClasses =
    confirmColor === "red"
      ? "bg-red-500 hover:bg-red-600"
      : "bg-orange-500 hover:bg-orange-600";

  const iconColorClasses =
    confirmColor === "red"
      ? "bg-red-50 text-red-500"
      : "bg-orange-50 text-orange-500";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center ">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 z-10 p-6 text-center">
        <div className="flex justify-center mb-3">
          <div className={`p-3 rounded-full ${iconColorClasses}`}>
            <AlertTriangle size={24} />
          </div>
        </div>
        <h3 className="text-base font-bold text-gray-800 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">
          {message ?? (
            <>
              You want to delete the leave record for{" "}
              <span className="font-semibold text-gray-700">{item.name}</span>.
              This can't be undone.
            </>
          )}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(item.id);
              onClose();
            }}
            className={`flex-1 text-white py-2.5 rounded-lg text-sm font-semibold transition ${colorClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}