import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";

// ── Delete Confirm Modal ──────────────────────────────────────
export default function DeleteModal({ open, item, onClose, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!open || !item) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);

    try {
      // Wait for the actual delete to finish before closing — this way
      // the modal stays open (and could show a spinner/error) if the
      // API call fails, instead of closing instantly either way.
      await onConfirm(item.id);
      onClose();
    } catch (error) {
      console.error("Delete failed:", error);
      // Keep the modal open on failure so the user knows it didn't work.
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center ">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={isDeleting ? undefined : onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 z-10 p-6 text-center">
        <div className="flex justify-center mb-3">
          <div className="p-3 bg-red-50 rounded-full">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
        </div>
        <h3 className="text-base font-bold text-gray-800 mb-1">
          Delete Employee?
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          You want to delete the employee record for{" "}
          <span className="font-semibold text-gray-700">{item.name}</span>. This
          can't be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
