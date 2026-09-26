import React from "react";
import { FiAlertTriangle, FiTrash2 } from "react-icons/fi";

const DeleteUserModal = ({
  isOpen,
  deleteTarget,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  const userName = deleteTarget?.name || "this user";

  return (
    <dialog
      id="delete_user_modal"
      className="modal modal-open"
      aria-labelledby="delete-user-title"
      aria-describedby="delete-user-description"
    >
      <div className="modal-box w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white p-0 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3
              id="delete-user-title"
              className="text-base font-semibold text-gray-900"
            >
              Delete User
            </h3>
            <p className="mt-0.5 text-xs text-gray-400">
              This action requires confirmation
            </p>
          </div>

          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close delete dialog"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <FiAlertTriangle size={24} />
          </div>

          <div className="text-center">
            <p
              id="delete-user-description"
              className="text-sm leading-6 text-gray-600"
            >
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">{userName}</span>?
            </p>

            <p className="mt-1 text-xs text-gray-400">
              The user will be removed from the active user list.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-gray-100 bg-gray-50/60 px-5 py-4">
          <button
            type="button"
            className="btn h-10 min-h-0 flex-1 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-none transition hover:border-gray-300 hover:bg-gray-50"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn h-10 min-h-0 flex-1 rounded-lg border-none bg-red-500 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            <FiTrash2 size={15} />
            {isDeleting ? "Deleting..." : "Delete User"}
          </button>
        </div>
      </div>

      <div
        className="modal-backdrop bg-black/40"
        onClick={isDeleting ? undefined : onClose}
      />
    </dialog>
  );
};

export default DeleteUserModal;
