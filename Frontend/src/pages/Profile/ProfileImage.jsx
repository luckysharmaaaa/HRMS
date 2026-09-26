import React, { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import {
  uploadProfileImage,
  removeProfileImage,
  getFileUrl,
} from "../../services/profileApi";
import { getInitials, getAvatarColor } from "../../utils/avatar";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

const ProfileImage = ({ user, roles = [], profileImage, onChange }) => {
  const fileInputRef = useRef(null);
  const cancelButtonRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const firstName = user?.firstName || "";
  const lastName = user?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = getInitials(firstName, lastName);
  const avatarColor = getAvatarColor(user?.email || `${firstName}${lastName}`);

  const storedImageUrl = getFileUrl(profileImage?.fileURL);
  const currentImageUrl = previewUrl || (imageFailed ? null : storedImageUrl);

  // A new photo gets a fresh chance to load.
  useEffect(() => {
    setImageFailed(false);
  }, [storedImageUrl]);

  // Dialog: focus Cancel on open, close on Escape.
  useEffect(() => {
    if (!confirmRemove) return undefined;

    cancelButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !removing) {
        setConfirmRemove(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [confirmRemove, removing]);

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Upload a JPG, PNG or WebP image.", {
        toastId: "photo-type",
      });
      return false;
    }

    if (file.size > MAX_SIZE_BYTES) {
      toast.error("Choose an image smaller than 2 MB.", {
        toastId: "photo-size",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;
    if (!validateFile(file)) return;

    // Object URL is only the temporary preview while the upload is in flight.
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);

    try {
      const response = await uploadProfileImage(file);

      toast.success(response?.message || "Profile photo updated");

      onChange?.({
        mediaID: response?.data?.mediaID,
        fileURL: response?.data?.fileURL,
      });
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Couldn't upload your photo. Try again."
      );
    } finally {
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(null);
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);

    try {
      const response = await removeProfileImage();

      toast.success(response?.message || "Profile photo removed");
      onChange?.(null);
      setConfirmRemove(false);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Couldn't remove your photo. Try again."
      );
    } finally {
      setRemoving(false);
    }
  };

  return (
    <section
      aria-label="Profile photo"
      className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center lg:p-8"
    >
      {/* Avatar */}
      <div className="relative h-24 w-24 shrink-0">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-slate-200 shadow-sm">
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt={fullName ? `${fullName}'s profile photo` : "Profile photo"}
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white"
              style={{ backgroundColor: avatarColor }}
              aria-hidden="true"
            >
              {initials}
            </div>
          )}
        </div>

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="animate-spin text-white" size={22} />
          </div>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label="Change profile photo"
          className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-orange-500 text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Camera size={16} />
        </button>
      </div>

      {/* Identity */}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-xl font-semibold text-[#041D5F]">
          {fullName || "Your profile"}
        </h2>

        {user?.email && (
          <p className="mt-0.5 truncate text-sm text-slate-500">
            {user.email}
          </p>
        )}

        {roles.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Roles">
            {roles.map((role) => (
              <li
                key={role.id ?? role.roleName}
                className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-[#041D5F]"
              >
                {role.roleName}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Camera size={16} />
            {uploading ? "Uploading..." : "Upload photo"}
          </button>

          {profileImage && (
            <button
              type="button"
              onClick={() => setConfirmRemove(true)}
              disabled={uploading}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={16} />
              Remove
            </button>
          )}

          <p className="text-xs text-slate-500">
            JPG, PNG or WebP, up to 2 MB
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Remove confirmation */}
      {confirmRemove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => !removing && setConfirmRemove(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-photo-title"
            aria-describedby="remove-photo-desc"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <h4
              id="remove-photo-title"
              className="text-lg font-semibold text-[#041D5F]"
            >
              Remove profile photo?
            </h4>

            <p id="remove-photo-desc" className="mt-2 text-sm text-slate-500">
              Your initials will be shown instead. You can upload a new photo
              at any time.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={() => setConfirmRemove(false)}
                disabled={removing}
                className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={removing}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 disabled:opacity-60"
              >
                {removing && <Loader2 size={16} className="animate-spin" />}
                {removing ? "Removing..." : "Remove photo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProfileImage;