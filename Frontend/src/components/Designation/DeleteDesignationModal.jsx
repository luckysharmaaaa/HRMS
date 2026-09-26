// ```jsx
import React from "react";
import { X, AlertTriangle } from "lucide-react";

export default function DeleteDesignationModal({
  open,
  item,
  onClose,
  onConfirm,
}) {
  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-xl p-6">

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle
              size={28}
              className="text-red-500"
            />
          </div>
        </div>

        {/* Text */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-[#0F265C] mb-1">
            Delete Designation
          </h3>

          <p className="text-sm text-gray-500">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-700">
              "{item.designationName}"
            </span>
            ? This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">

          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onConfirm(item.id)}
            className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition shadow-sm"
          >
            Delete
          </button>

        </div>
      </div>
    </div>
  );
}
// ```
