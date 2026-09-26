import React, { useState } from "react";
import { toast } from "react-toastify";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { User, X } from "lucide-react";

// Allowed profile image file types
const ALLOWED_IMAGE_TYPES = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "image/webp",
];

// Default image shown when user has no profile image
import DEFAULT_AVATAR from "../../assets/images/avatar_logo.webp";

// Reusable validation error component
export const FieldError = ({ error, touched }) =>
  touched && error ? (
    <p className="text-danger-500 text-xs mt-1">{error}</p>
  ) : null;

/**
 * UserForm
 *
 * Reusable UI for Add User and Edit User.
 *
 * IMPORTANT:
 * This component only handles UI.
 * API calls are handled by AddUserDrawer / EditUserModal.
 */
const UserForm = ({
  open,
  mode,
  formik,
  isPasswordOptional = false,
  pendingCompanyEmail = false,

  roles = [],
  selectedRoles = [],
  onRoleChange,

  // Profile image props
  profileImagePreview,
  onImageChange,
  onRemoveImage,
  onSaveProfileImage,
  isSavingImage = false,

  // Address props
  addressData,
  onAddressChange,

  // Status
  status,
  onStatusToggle,

  // Drawer
  onClose,

  // Main form submit
  isSubmitting = false,
  submitLabel = "Save",
  submittingLabel = "Saving...",
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isEdit = mode === "edit";

  // True when an actual profile image exists
  const hasRealImage = Boolean(profileImagePreview);

  // Always show an image
  const displayImage = profileImagePreview || DEFAULT_AVATAR;

  // Handles image selection from the file picker
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Check whether selected file type is allowed
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Only JPG, JPEG, PNG, and WEBP images are allowed.");
      return;
    }

    // Send selected file to parent component
    onImageChange(file);
  };

  const inputCls = (hasError) =>
    `input input-bordered w-full bg-surface border-border-subtle text-text-primary focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/10 ${
      hasError ? "border-danger-500" : ""
    }`;

  return (
    <>
      {/* ================= Backdrop ================= */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-999"
          onClick={onClose}
        />
      )}

      {/* ================= Sliding Panel — opens from the right, fixed
          usable width instead of the previous invalid `w-200` utility
          (which isn't a real Tailwind class and would have rendered
          with no width at all). ================= */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-3xl bg-surface z-1000 transition-transform duration-base ease-standard shadow-2xl flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ================= Header ================= */}
        <div className="flex items-center justify-between p-5 border-b border-border-subtle bg-surface shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-accent-500/10 text-accent-500 rounded-xl shrink-0 shadow-sm border border-accent-500/20">
              <User size={22} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary-700 tracking-tight leading-tight">
                {isEdit ? "Edit User" : "Add User"}
              </h2>

              <p className="text-xs text-text-secondary font-medium mt-1">
                {isEdit
                  ? "Update user profile information"
                  : "Create a new user profile and allocate module access permissions"}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-border-subtle text-text-disabled hover:bg-danger-50 hover:border-danger-500/30 hover:text-danger-500 transition-colors duration-fast ease-standard"
          >
            <X size={16} />
          </button>
        </div>

        {/* ================= Main Form ================= */}
        <form
          onSubmit={formik.handleSubmit}
          noValidate
          className="flex flex-col flex-1 min-h-0"
        >
          {/* Scrollable content */}
          <div className="p-5 overflow-y-auto flex-1 min-h-0">
            <div className="grid grid-cols-2 gap-5">

              {/* ================= First Name ================= */}
              <div>
                <label className="label">
                  <span className="label-text font-medium text-text-primary">
                    First Name
                  </span>
                </label>

                <input
                  type="text"
                  name="firstName"
                  placeholder="Enter first name"
                  className={inputCls(formik.touched.firstName && formik.errors.firstName)}
                  value={formik.values.firstName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />

                <FieldError
                  error={formik.errors.firstName}
                  touched={formik.touched.firstName}
                />
              </div>

              {/* ================= Last Name ================= */}
              <div>
                <label className="label">
                  <span className="label-text font-medium text-text-primary">
                    Last Name
                  </span>
                </label>

                <input
                  type="text"
                  name="lastName"
                  placeholder="Enter last name"
                  className={inputCls(formik.touched.lastName && formik.errors.lastName)}
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />

                <FieldError
                  error={formik.errors.lastName}
                  touched={formik.touched.lastName}
                />
              </div>

              {/* ================= Email (official company email) ================= */}
              <div>
                <label className="label">
                  <span className="label-text font-medium text-text-primary">
                    Official Email
                  </span>
                </label>

                <input
                  type="email"
                  name="email"
                  placeholder="name@bytesbrick.com"
                  disabled={Boolean(formik.values.alternateEmail)}
                  className={`${inputCls(formik.touched.email && formik.errors.email)} disabled:bg-background disabled:cursor-not-allowed`}
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />

                <FieldError
                  error={formik.errors.email}
                  touched={formik.touched.email}
                />

                {formik.values.alternateEmail ? (
                  <p className="text-xs text-text-secondary mt-1">
                    Clear the Personal Email field to enter an official
                    email instead.
                  </p>
                ) : (
                  !formik.values.email && (
                    <p className="text-xs text-text-secondary mt-1">
                      Leave blank if this employee doesn't have one yet
                      — use Personal Email instead.
                    </p>
                  )
                )}
              </div>

              {/* ================= Personal Email (no official email yet) ================= */}
              <div>
                <label className="label">
                  <span className="label-text font-medium text-text-primary">
                    Personal Email
                    <span className="ml-1 text-xs font-normal text-text-disabled">
                      (if no official email yet)
                    </span>
                  </span>
                </label>

                <input
                  type="email"
                  name="alternateEmail"
                  placeholder="name@gmail.com"
                  disabled={Boolean(formik.values.email)}
                  className={`${inputCls(formik.touched.alternateEmail && formik.errors.alternateEmail)} disabled:bg-background disabled:cursor-not-allowed`}
                  value={formik.values.alternateEmail}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />

                <FieldError
                  error={formik.errors.alternateEmail}
                  touched={formik.touched.alternateEmail}
                />

                {formik.values.email ? (
                  <p className="text-xs text-text-secondary mt-1">
                    Clear the Official Email field to use a personal
                    email instead.
                  </p>
                ) : (
                  pendingCompanyEmail && (
                    <p className="text-xs text-warning-600 mt-1">
                      This user currently signs in with their personal
                      email. They'll switch to the official email
                      automatically once you assign one above.
                    </p>
                  )
                )}
              </div>

              {/* ================= Phone ================= */}
              <div>
                <label className="label">
                  <span className="label-text font-medium text-text-primary">
                    Phone
                  </span>
                </label>

                <input
                  type="text"
                  name="phone"
                  placeholder="Enter phone number"
                  className={inputCls(formik.touched.phone && formik.errors.phone)}
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />

                <FieldError
                  error={formik.errors.phone}
                  touched={formik.touched.phone}
                />
              </div>

              {/* ================= Password ================= */}
              <div>
                <label className="label">
                  <span className="label-text font-medium text-text-primary">
                    Password
                    {isPasswordOptional ? " (optional)" : ""}
                  </span>
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder={
                      isPasswordOptional
                        ? "Leave blank to keep current password"
                        : "Minimum 8 characters"
                    }
                    className={`${inputCls(formik.touched.password && formik.errors.password)} pr-10`}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
                  >
                    {showPassword ? (
                      <VisibilityIcon fontSize="small" />
                    ) : (
                      <VisibilityOffIcon fontSize="small" />
                    )}
                  </button>
                </div>

                <FieldError
                  error={formik.errors.password}
                  touched={formik.touched.password}
                />
              </div>

              {/* ================= Confirm Password ================= */}
              <div>
                <label className="label">
                  <span className="label-text font-medium text-text-primary">
                    Confirm Password
                  </span>
                </label>

                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Repeat password"
                    className={`${inputCls(formik.touched.confirmPassword && formik.errors.confirmPassword)} pr-10`}
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
                  >
                    {showConfirm ? (
                      <VisibilityIcon fontSize="small" />
                    ) : (
                      <VisibilityOffIcon fontSize="small" />
                    )}
                  </button>
                </div>

                <FieldError
                  error={formik.errors.confirmPassword}
                  touched={formik.touched.confirmPassword}
                />
              </div>

            </div>

            {/* ================= Assign Roles ================= */}
            <div className="mt-8">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-primary-700">
                  Assign Roles
                </h3>

                <p className="text-sm text-text-secondary">
                  Select one or more roles for this user.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className={`cursor-pointer rounded-xl border p-4 transition-colors duration-fast ease-standard ${
                      selectedRoles.includes(role.id)
                        ? "border-accent-500 bg-accent-500/5"
                        : "border-border-subtle bg-surface hover:border-accent-400"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        style={{ accentColor: "#F97316" }}
                        checked={selectedRoles.includes(role.id)}
                        onChange={() => onRoleChange(role.id)}
                      />

                      <span className="font-medium text-text-primary">
                        {role.roleName}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
                        {/* ================= Profile Image ================= */}
            <div className="mt-8">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-primary-700">
                  Profile Image
                </h3>

                <p className="text-sm text-text-secondary">
                  Upload a profile picture (JPG, JPEG, PNG, WEBP).
                </p>
              </div>

              <div className="rounded-xl border border-border-subtle bg-surface p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">

                  {/* Profile image preview */}
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full border-2 border-dashed border-accent-500/40 bg-accent-500/5 overflow-hidden flex items-center justify-center">
                      <img
                        src={displayImage}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_AVATAR;
                        }}
                      />
                    </div>

                    {/* Remove image button */}
                    {hasRealImage && (
                      <button
                        type="button"
                        onClick={onRemoveImage}
                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-danger-500 text-white flex items-center justify-center shadow hover:bg-danger-600 transition-colors duration-fast ease-standard"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Image actions */}
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-text-primary mb-2">
                      Upload Photo
                    </h4>

                    <p className="text-sm text-text-secondary mb-4">
                      Supported formats: JPG, JPEG, PNG and WEBP
                      <br />
                      Recommended size: 300 × 300 px
                    </p>

                    <div className="flex items-center gap-3">

                      {/* Choose Image */}
                      <label className="btn bg-accent-500 hover:bg-accent-600 border-none text-white">
                        Choose Image

                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>

                      {/* ================= Save Image ================= */}
                      {isEdit && (
                        <button
                          type="button"
                          onClick={onSaveProfileImage}
                          disabled={isSavingImage}
                          className="btn bg-success-500 hover:bg-success-600 border-none text-white disabled:opacity-50"
                        >
                          {isSavingImage ? "Saving..." : "Save Image"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= Address ================= */}
            <div className="mt-8">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-primary-700">
                  Address
                </h3>

                <p className="text-sm text-text-secondary">
                  Add an address for this user (optional).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-5">

                {/* Address Type */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium text-text-primary">
                      Address Type
                    </span>
                  </label>

                  <select
                    name="addressType"
                    className="select select-bordered w-full bg-surface border-border-subtle text-text-primary"
                    value={addressData.addressType}
                    onChange={onAddressChange}
                  >
                    <option value="">Select Address Type</option>
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="branch">Branch</option>
                  </select>
                </div>

                {/* House Number */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium text-text-primary">
                      House No/Name
                    </span>
                  </label>

                  <input
                    type="text"
                    name="houseNo"
                    placeholder="Enter house number"
                    className="input input-bordered w-full bg-surface border-border-subtle text-text-primary"
                    value={addressData.houseNo}
                    onChange={onAddressChange}
                  />
                </div>

                {/* Address Line 1 */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium text-text-primary">
                      Address Line 1
                    </span>
                  </label>

                  <input
                    type="text"
                    name="addressLine1"
                    placeholder="Enter address line 1"
                    className="input input-bordered w-full bg-surface border-border-subtle text-text-primary"
                    value={addressData.addressLine1}
                    onChange={onAddressChange}
                  />
                </div>

                {/* Address Line 2 */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium text-text-primary">
                      Address Line 2
                    </span>
                  </label>

                  <input
                    type="text"
                    name="addressLine2"
                    placeholder="Enter address line 2"
                    className="input input-bordered w-full bg-surface border-border-subtle text-text-primary"
                    value={addressData.addressLine2}
                    onChange={onAddressChange}
                  />
                </div>

                {/* Landmark */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium text-text-primary">
                      Landmark
                    </span>
                  </label>

                  <input
                    type="text"
                    name="landmark"
                    placeholder="Enter landmark"
                    className="input input-bordered w-full bg-surface border-border-subtle text-text-primary"
                    value={addressData.landmark}
                    onChange={onAddressChange}
                  />
                </div>

                {/* Locality */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium text-text-primary">
                      Locality
                    </span>
                  </label>

                  <input
                    type="text"
                    name="locality"
                    placeholder="Enter locality"
                    className="input input-bordered w-full bg-surface border-border-subtle text-text-primary"
                    value={addressData.locality}
                    onChange={onAddressChange}
                  />
                </div>

                {/* City */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium text-text-primary">
                      City
                    </span>
                  </label>

                  <input
                    type="text"
                    name="city"
                    placeholder="Enter city"
                    className="input input-bordered w-full bg-surface border-border-subtle text-text-primary"
                    value={addressData.city}
                    onChange={onAddressChange}
                  />
                </div>

                {/* State */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium text-text-primary">
                      State
                    </span>
                  </label>

                  <input
                    type="text"
                    name="state"
                    placeholder="Enter state"
                    className="input input-bordered w-full bg-surface border-border-subtle text-text-primary"
                    value={addressData.state}
                    onChange={onAddressChange}
                  />
                </div>

                {/* Zip Code */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium text-text-primary">
                      Zip Code
                    </span>
                  </label>

                  <input
                    type="text"
                    name="zipCode"
                    placeholder="Enter zip code"
                    className="input input-bordered w-full bg-surface border-border-subtle text-text-primary"
                    value={addressData.zipCode}
                    onChange={onAddressChange}
                  />
                </div>

                {/* Country ID */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium text-text-primary">
                      Country ID
                    </span>
                  </label>

                  <input
                    type="text"
                    name="countryID"
                    placeholder="Enter country ID"
                    className="input input-bordered w-full bg-surface border-border-subtle text-text-primary"
                    value={addressData.countryID}
                    onChange={onAddressChange}
                  />
                </div>

                {/* Country Code */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium text-text-primary">
                      Country Code
                    </span>
                  </label>

                  <input
                    type="text"
                    name="countryCode"
                    placeholder="e.g. IN"
                    className="input input-bordered w-full bg-surface border-border-subtle text-text-primary"
                    value={addressData.countryCode}
                    onChange={onAddressChange}
                  />
                </div>

                {/* Phone Code */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium text-text-primary">
                      Phone Code
                    </span>
                  </label>

                  <input
                    type="text"
                    name="phoneCode"
                    placeholder="e.g. +91"
                    className="input input-bordered w-full bg-surface border-border-subtle text-text-primary"
                    value={addressData.phoneCode}
                    onChange={onAddressChange}
                  />
                </div>

                {/* Address Phone */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium text-text-primary">
                      Address Phone
                    </span>
                  </label>

                  <input
                    type="text"
                    name="phone"
                    placeholder="Enter phone number"
                    className="input input-bordered w-full bg-surface border-border-subtle text-text-primary"
                    value={addressData.phone}
                    onChange={onAddressChange}
                  />
                </div>

                {/* Default Address */}
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    name="isDefault"
                    id="isDefault"
                    className="checkbox checkbox-sm"
                    style={{ accentColor: "#F97316" }}
                    checked={addressData.isDefault}
                    onChange={onAddressChange}
                  />

                  <label
                    htmlFor="isDefault"
                    className="text-sm font-medium text-text-primary"
                  >
                    Set as default address
                  </label>
                </div>

              </div>
            </div>
          </div>
                    {/* ================= Footer ================= */}
          <div className="shrink-0 bg-surface border-t border-border-subtle py-3 px-6 flex items-center justify-between">

            {/* ================= Status ================= */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-text-primary">
                Status
              </label>

              <button
                type="button"
                onClick={onStatusToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-fast ease-standard ${
                  status ? "bg-accent-500" : "bg-border-strong"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-fast ease-standard ${
                    status ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>

              <span
                className={`text-sm font-medium ${
                  status ? "text-accent-500" : "text-text-secondary"
                }`}
              >
                {status ? "Active" : "Inactive"}
              </span>
            </div>

            {/* ================= Footer Buttons ================= */}
            <div className="flex gap-3">

              {/* Cancel */}
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 border border-border-subtle text-text-primary rounded-md hover:bg-background transition-colors duration-fast ease-standard"
              >
                Cancel
              </button>

              {/* Main User Update Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-md disabled:opacity-50 transition-colors duration-fast ease-standard"
              >
                {isSubmitting ? submittingLabel : submitLabel}
              </button>

            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default UserForm;