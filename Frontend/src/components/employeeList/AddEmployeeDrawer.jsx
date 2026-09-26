// ```jsx
import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Calendar,
  EyeOff,
  Eye,
  Image as ImageIcon,
  UserPlus,
  Search,
  Download,
} from "lucide-react";

import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";

import {
  createEmployee,
  getImportableUsers,
  updateEmployee,
  getManagers,
} from "../../services/employee.service";

import { getDepartments } from "../../services/department.service";
import { getDesignations } from "../../services/designation.service";
import { uploadMedia } from "../../services/mediaApi";


// ============================================================================
// Constants
// ============================================================================

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  empId: "",
  joiningDate: "",
  managerId: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  company: "",
  departmentId: "",
  designationId: "",
  about: "",
  _importedUserId: null,
};


// ============================================================================
// Import Employee Modal
// ============================================================================

function ImportEmployeeModal({ open, onClose, onSelect }) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);

      try {
        const response = await getImportableUsers();
        setUsers(response.data?.data ?? []);
      } catch (error) {
        console.error("IMPORTABLE USERS ERROR:", error);
        toast.error("Failed to load users.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [open]);

  const filteredUsers = users.filter((user) => {
    const query = search.toLowerCase().trim();

    const fullName = `${user.firstName ?? ""} ${
      user.lastName ?? ""
    }`.toLowerCase();

    return (
      fullName.includes(query) ||
      (user.email ?? "").toLowerCase().includes(query) ||
      (user.phone ?? "").toLowerCase().includes(query)
    );
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex max-h-[80vh] w-full max-w-lg mx-4 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-50 p-2">
              <Download size={18} className="text-orange-500" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#0F265C]">
                Import Employee
              </h3>

              <p className="mt-0.5 text-xs text-gray-400">
                Select a user to auto-fill the employee form
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-gray-50 px-5 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <Search size={14} className="shrink-0 text-gray-400" />

            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Users */}
        <div className="flex-1 divide-y divide-gray-50 overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              No users found.
            </div>
          ) : (
            filteredUsers.map((user) => {
              const fullName = `${user.firstName ?? ""} ${
                user.lastName ?? ""
              }`.trim();

              const initials =
                fullName
                  .split(" ")
                  .filter(Boolean)
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "?";

              const alreadyEmployee = Boolean(user.isEmployee);

              return (
                <button
                  key={user.id}
                  type="button"
                  disabled={alreadyEmployee}
                  onClick={() => {
                    if (alreadyEmployee) return;

                    onSelect(user);
                    onClose();
                  }}
                  className={`group flex w-full items-center gap-4 px-5 py-3.5 text-left transition ${
                    alreadyEmployee
                      ? "cursor-not-allowed bg-gray-50 opacity-50"
                      : "cursor-pointer hover:bg-orange-50/60"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                      alreadyEmployee ? "bg-gray-400" : "bg-orange-400"
                    }`}
                  >
                    {initials}
                  </div>

                  {/* User Info */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-semibold ${
                        alreadyEmployee
                          ? "text-gray-400"
                          : "text-gray-800 group-hover:text-orange-600"
                      }`}
                    >
                      {fullName || "—"}
                    </p>

                    <p className="truncate text-xs text-gray-400">
                      {user.email || "—"}
                    </p>
                  </div>

                  {/* Status */}
                  {alreadyEmployee ? (
                    <span className="shrink-0 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-600">
                      ✓ Employee
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-500">
                      Import
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-50 px-5 py-3 text-xs text-gray-400">
          {loading
            ? "Loading..."
            : `${
                filteredUsers.filter((user) => !user.isEmployee).length
              } of ${filteredUsers.length} user${
                filteredUsers.length !== 1 ? "s" : ""
              } available to import`}
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// Add / Edit Employee Drawer
// ============================================================================

export default function AddEmployeeDrawer({
  open,
  onClose,
  editData,
  onSubmit,
}) {
  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [managers, setManagers] = useState([]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileImage, setProfileImage] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importedFrom, setImportedFrom] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const fileInputRef = useRef(null);


  // --------------------------------------------------------------------------
  // Fetch dropdown data
  // --------------------------------------------------------------------------

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [departmentResponse, designationResponse, managerResponse] =
          await Promise.all([
            getDepartments(),
            getDesignations(),
            getManagers(),
          ]);

        setDepartments(departmentResponse.data?.data ?? []);
        setDesignations(designationResponse.data?.data ?? []);
        setManagers(managerResponse.data?.data ?? []);
      } catch (error) {
        console.error("DROPDOWN DATA ERROR:", error);
        toast.error("Failed to load employee dropdown data.");
      }
    };

    fetchDropdownData();
  }, []);


  // --------------------------------------------------------------------------
  // Dropdown options
  // --------------------------------------------------------------------------

  const departmentOptions = departments.map((department) => ({
    value: department.id,
    label:
      department.departmentName ||
      department.name ||
      String(department.id),
  }));

  const designationOptions = designations.map((designation) => ({
    value: designation.id,
    label:
      designation.designationName ||
      designation.name ||
      String(designation.id),
  }));

  const managerOptions = managers.map((manager) => ({
    value: manager.id,
    label: `${manager.employeeCode || ""} - ${
      manager.firstName || ""
    } ${manager.lastName || ""}`.trim(),
  }));


  // --------------------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------------------

  const validationSchema = Yup.object({
    firstName: editData
      ? Yup.string()
      : Yup.string().required("First Name is required"),

    lastName: Yup.string(),

    empId: editData
      ? Yup.string()
      : Yup.string().required("Employee ID is required"),

    joiningDate: editData
      ? Yup.string()
      : Yup.string().required("Joining Date is required"),

    email: editData
      ? Yup.string().email("Invalid email format")
      : Yup.string()
          .email("Invalid email format")
          .required("Email is required"),

    password: Yup.string().when("_importedUserId", {
      is: (userId) => !editData && !userId,
      then: (schema) =>
        schema
          .required("Password is required")
          .min(6, "Password must be at least 6 characters"),
      otherwise: (schema) => schema.notRequired(),
    }),

    confirmPassword: Yup.string().when("_importedUserId", {
      is: (userId) => !editData && !userId,
      then: (schema) =>
        schema
          .required("Confirm Password is required")
          .oneOf([Yup.ref("password")], "Passwords do not match"),
      otherwise: (schema) => schema.notRequired(),
    }),

    phone: editData
      ? Yup.string()
      : Yup.string().required("Phone Number is required"),

    company: Yup.string().nullable(),

    departmentId: editData
      ? Yup.string()
      : Yup.string().required("Department is required"),

    designationId: editData
      ? Yup.string()
      : Yup.string().required("Designation is required"),

    about: editData
      ? Yup.string()
      : Yup.string().required("About is required"),

    managerId: Yup.string().nullable(),
  });


  // --------------------------------------------------------------------------
  // Formik
  // --------------------------------------------------------------------------

  const formik = useFormik({
    initialValues: EMPTY_FORM,
    validationSchema,

    onSubmit: async (values) => {
      setIsSubmitting(true);
      setApiError(null);

      try {
        const isImporting = Boolean(values._importedUserId);

        // ================================================================
        // FIX: Upload profile image FIRST, before create/update.
        // ================================================================
        // Previously the image was uploaded AFTER createEmployee() had
        // already committed, as a second independent request. If that
        // second request failed for any reason, the employee stayed
        // permanently saved with no image, and no rollback happened.
        //
        // Now: we upload the file first (no objectID/objectType yet,
        // since the employee doesn't exist), get back a mediaId, and
        // pass that mediaId into createEmployee/updateEmployee. The
        // backend attaches it to the employee INSIDE the same DB
        // transaction as the employee insert/update, so the two can
        // never partially succeed/fail independently anymore.

        let uploadedMediaId = null;

        if (profileImageFile) {
          const formData = new FormData();

          formData.append("file", profileImageFile);

          formData.append(
            "title",
            `${values.firstName || "Employee"} Profile Image`
          );

          formData.append(
            "altText",
            `${values.firstName || "Employee"} Profile Image`
          );

          console.log("UPLOADING EMPLOYEE IMAGE (pre-save):", {
            file: profileImageFile.name,
          });

          const uploadResponse = await uploadMedia(formData, "employees");

          uploadedMediaId = uploadResponse?.data?.data?.mediaId ?? null;

          if (!uploadedMediaId) {
            throw new Error(
              "Image upload succeeded but no media ID was returned."
            );
          }
        }

        // ================================================================
        // EDIT EMPLOYEE
        // ================================================================

        if (editData) {
          const originalName = editData.name || "";

          const nameParts = originalName.trim().split(" ");

          const originalFirstName = nameParts[0] || "";
          const originalLastName = nameParts.slice(1).join(" ");

          const payload = {
            firstName: values.firstName || originalFirstName,
            lastName: values.lastName ?? originalLastName,
            email: values.email || editData.email || null,
            phone: values.phone || editData.phone || null,
            employeeCode: values.empId || editData.empId || null,
            departmentId: values.departmentId || null,
            designationId: values.designationId || null,
            joiningDate:
              values.joiningDate || editData.joiningDate || null,
            managerId: values.managerId || null,
            about: values.about || null,
            status: true,
            // Only sent when the user actually picked a new photo;
            // omitting it leaves the employee's existing image alone.
            ...(uploadedMediaId ? { mediaId: uploadedMediaId } : {}),
          };

          console.log("UPDATE EMPLOYEE PAYLOAD:", payload);

          await updateEmployee(editData.id, payload);

          toast.success("Employee updated successfully");
        }

        // ================================================================
        // CREATE / IMPORT EMPLOYEE
        // ================================================================

        else {
          const payload = {
            ...(isImporting
              ? {
                  userId: values._importedUserId,
                }
              : {
                  firstName: values.firstName,
                  lastName: values.lastName,
                  email: values.email,
                  phone: values.phone || null,
                  password: values.password,
                }),

            employeeCode: values.empId || null,
            departmentId: values.departmentId || null,
            designationId: values.designationId || null,
            joiningDate: values.joiningDate || null,
            managerId: values.managerId || null,
            about: values.about || null,
            status: true,
            ...(uploadedMediaId ? { mediaId: uploadedMediaId } : {}),
          };

          console.log("CREATE EMPLOYEE PAYLOAD:", payload);

          const response = await createEmployee(payload);

          console.log("CREATE EMPLOYEE RESPONSE:", response);

          const employeeId = response?.data?.data?.employeeId;

          if (!employeeId) {
            throw new Error(
              "Employee created but employee ID was not returned."
            );
          }

          toast.success(
            isImporting
              ? "Employee imported successfully"
              : "Employee created successfully"
          );
        }

        // Refresh employee list
        await onSubmit?.();

        // Close drawer
        onClose();
      } catch (error) {
        console.error("EMPLOYEE SAVE ERROR:", error);

        const status = error?.response?.status;

        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong. Please try again.";

        const code =
          error?.response?.data?.errors?.code ?? null;

        if (status === 409) {
          setApiError({
            message,
            code,
          });
        } else {
          toast.error(message);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
  });


  // --------------------------------------------------------------------------
  // Reset form when drawer opens / employee changes
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (!open) return;

    setApiError(null);
    setImportedFrom(false);
    setProfileImage(null);
    setProfileImageFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (editData) {
      const nameParts = (editData.name || "").trim().split(" ");

      formik.setValues({
        ...EMPTY_FORM,

        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",

        empId: editData.empId || "",
        email: editData.email || "",
        phone: editData.phone || "",

        departmentId: editData.departmentId || "",
        designationId: editData.designationId || "",
        joiningDate: editData.joiningDate || "",
        managerId: editData.managerId || "",

        about: editData.about || "",
      });
    } else {
      formik.setValues({ ...EMPTY_FORM });
    }

    formik.setTouched({});
    formik.setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editData]);


  // --------------------------------------------------------------------------
  // Lock body scrolling while drawer is open
  // --------------------------------------------------------------------------

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "unset";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);


  // --------------------------------------------------------------------------
  // Import existing user
  // --------------------------------------------------------------------------

  const handleImportSelect = (user) => {
    formik.setValues({
      ...EMPTY_FORM,

      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",

      email: user.email ?? "",
      phone: user.phone ?? "",

      _importedUserId: user.id,
    });

    formik.setTouched({});
    formik.setErrors({});

    setImportedFrom(true);
  };


  // --------------------------------------------------------------------------
  // Profile image upload
  // --------------------------------------------------------------------------

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // 4 MB validation
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image should be below 4 MB.");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    // Validate image
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image.");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    // Keep actual file for API upload
    setProfileImageFile(file);

    // Keep preview separately
    const reader = new FileReader();

    reader.onloadend = () => {
      setProfileImage(reader.result);
    };

    reader.readAsDataURL(file);
  };


  const handleCancelImage = () => {
    setProfileImage(null);
    setProfileImageFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  // --------------------------------------------------------------------------
  // Generic input renderer
  // --------------------------------------------------------------------------

  const renderField = ({
    label,
    name,
    type = "text",
    required = true,
    icon = null,
    onIconClick = null,
    locked = false,
  }) => {
    const hasError =
      formik.touched[name] && formik.errors[name];

    const isDisabled = locked && importedFrom;

    const isRequired = editData ? false : required;

    return (
      <div>
        <label className="mb-1.5 block text-[13px] font-semibold text-[#1f2937]">
          {label}

          {isRequired && (
            <span className="text-red-500"> *</span>
          )}
        </label>

        <div className="relative">
          <input
            id={name}
            name={name}
            type={type}
            disabled={isDisabled}
            value={formik.values[name] ?? ""}
            onChange={(event) => {
              formik.handleChange(event);

              if (name === "email" && apiError) {
                setApiError(null);
              }
            }}
            onBlur={formik.handleBlur}
            onClick={(event) => {
              if (
                type === "date" &&
                event.target.showPicker
              ) {
                event.target.showPicker();
              }
            }}
            placeholder={type === "date" ? "dd/mm/yyyy" : ""}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition ${
              isDisabled
                ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500"
                : hasError
                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : "border-gray-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            }`}
          />

          {icon && (
            <button
              type="button"
              disabled={isDisabled || !onIconClick}
              onClick={onIconClick}
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 ${
                onIconClick && !isDisabled
                  ? "cursor-pointer hover:text-gray-700"
                  : "pointer-events-none"
              }`}
            >
              {icon}
            </button>
          )}

          {isDisabled && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect
                  x="3"
                  y="11"
                  width="18"
                  height="11"
                  rx="2"
                />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          )}
        </div>

        {hasError && !isDisabled && (
          <p className="mt-1 text-xs text-red-500">
            {formik.errors[name]}
          </p>
        )}
      </div>
    );
  };


  // --------------------------------------------------------------------------
  // Select renderer
  // --------------------------------------------------------------------------

  const renderSelect = ({
    label,
    name,
    options,
    required = true,
    locked = false,
  }) => {
    const hasError =
      formik.touched[name] && formik.errors[name];

    const isDisabled = locked && importedFrom;

    const isRequired = editData ? false : required;

    return (
      <div>
        <label className="mb-1.5 block text-[13px] font-semibold text-[#1f2937]">
          {label}

          {isRequired && (
            <span className="text-red-500"> *</span>
          )}
        </label>

        <div className="relative">
          <select
            name={name}
            disabled={isDisabled}
            value={formik.values[name] ?? ""}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full appearance-none rounded-lg border px-3.5 py-2.5 text-sm outline-none transition ${
              isDisabled
                ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500"
                : hasError
                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : "border-gray-200 bg-white focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            }`}
          >
            <option value="">Select</option>

            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>

        {hasError && !isDisabled && (
          <p className="mt-1 text-xs text-red-500">
            {formik.errors[name]}
          </p>
        )}
      </div>
    );
  };


  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <>
      {/* Import Employee Modal */}
      <ImportEmployeeModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSelect={handleImportSelect}
      />

      {/* Drawer */}
      <div
        className={`drawer drawer-end fixed inset-0 z-[1000] ${
          open
            ? "pointer-events-auto"
            : "pointer-events-none"
        }`}
      >
        <input
          type="checkbox"
          className="drawer-toggle"
          checked={open}
          readOnly
        />

        <div className="drawer-side">
          <label
            onClick={onClose}
            className="drawer-overlay"
          />

          <div className="flex h-full w-[480px] flex-col bg-white shadow-2xl sm:w-[600px] md:w-[700px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div className="flex items-center gap-3.5">
                <div className="shrink-0 rounded-xl border border-orange-100/60 bg-orange-50 p-2.5 text-orange-500 shadow-sm">
                  <UserPlus size={22} />
                </div>

                <div>
                  <h2 className="text-[1.4rem] font-bold leading-tight tracking-tight text-[#0F265C]">
                    {editData
                      ? "Edit Employee"
                      : "Add New Employee"}
                  </h2>

                  <p className="mt-0.5 text-xs font-medium text-gray-400">
                    Employee ID :{" "}
                    {formik.values.empId || "EMP-0024"}
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

            {/* Tab */}
            <div className="mt-2 border-b border-gray-100 px-5">
              <span className="inline-block border-b-2 border-orange-500 pb-3 text-sm font-semibold text-orange-500">
                Basic Information
              </span>
            </div>

            {/* Form */}
            <form
              onSubmit={formik.handleSubmit}
              className="flex-1 overflow-y-auto"
            >
              <div className="space-y-6 p-6">

                {/* =========================================================
                    Profile Image + Import
                ========================================================== */}

                <div className="flex items-start justify-between gap-4">
                  {/* Profile Image */}
                  <div className="flex items-center gap-5">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-gray-300 bg-gray-50">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon
                          size={24}
                          className="text-gray-300"
                        />
                      )}
                    </div>

                    <div>
                      <h3 className="mb-1 text-sm font-bold text-[#0F265C]">
                        Upload Profile Image
                      </h3>

                      <p className="mb-3 text-xs text-gray-500">
                        Image should be below 4 MB
                      </p>

                      <div className="flex gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            fileInputRef.current?.click()
                          }
                          className="rounded bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                        >
                          Upload
                        </button>

                        <button
                          type="button"
                          onClick={handleCancelImage}
                          className="rounded border border-gray-200 bg-white px-4 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Import */}
                  {!editData && (
                    <button
                      type="button"
                      onClick={() =>
                        setImportModalOpen(true)
                      }
                      className="flex shrink-0 items-center gap-2 rounded-lg border border-orange-400 px-4 py-2 text-sm font-semibold text-orange-500 transition hover:bg-orange-50"
                    >
                      <Download size={15} />
                      Import Employee
                    </button>
                  )}
                </div>


                {/* =========================================================
                    Form Grid
                ========================================================== */}

                <div className="grid grid-cols-2 gap-x-6 gap-y-5">

                  {renderField({
                    label: "First Name",
                    name: "firstName",
                    required: true,
                    locked: false,
                  })}

                  {renderField({
                    label: "Last Name",
                    name: "lastName",
                    required: false,
                    locked: false,
                  })}

                  {renderField({
                    label: "Email",
                    name: "email",
                    type: "email",
                    required: true,
                    locked: true,
                  })}

                  {renderField({
                    label: "Phone Number",
                    name: "phone",
                    type: "tel",
                    required: true,
                    locked: true,
                  })}

                  {renderField({
                    label: "Employee ID",
                    name: "empId",
                    required: true,
                    locked: false,
                  })}

                  {renderField({
                    label: "Joining Date",
                    name: "joiningDate",
                    type: "date",
                    required: true,
                    icon: <Calendar size={16} />,
                    locked: false,
                  })}

                  {/* Password */}
                  {!editData && (
                    <>
                      {renderField({
                        label: "Password",
                        name: "password",
                        type: showPassword
                          ? "text"
                          : "password",
                        required: true,
                        icon: showPassword ? (
                          <Eye size={16} />
                        ) : (
                          <EyeOff size={16} />
                        ),
                        onIconClick: () =>
                          setShowPassword(
                            (previous) => !previous
                          ),
                        locked: false,
                      })}

                      {renderField({
                        label: "Confirm Password",
                        name: "confirmPassword",
                        type: showConfirmPassword
                          ? "text"
                          : "password",
                        required: true,
                        icon: showConfirmPassword ? (
                          <Eye size={16} />
                        ) : (
                          <EyeOff size={16} />
                        ),
                        onIconClick: () =>
                          setShowConfirmPassword(
                            (previous) => !previous
                          ),
                        locked: false,
                      })}
                    </>
                  )}

                  {renderSelect({
                    label: "Manager ID",
                    name: "managerId",
                    options: managerOptions,
                    required: false,
                    locked: false,
                  })}

                  {renderField({
                    label: "Previous Company Name",
                    name: "company",
                    required: false,
                    locked: false,
                  })}

                  {renderSelect({
                    label: "Department",
                    name: "departmentId",
                    options: departmentOptions,
                    required: true,
                    locked: false,
                  })}

                  {renderSelect({
                    label: "Designation",
                    name: "designationId",
                    options: designationOptions,
                    required: true,
                    locked: false,
                  })}
                </div>


                {/* =========================================================
                    About
                ========================================================== */}

                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#1f2937]">
                    About

                    {!editData && (
                      <span className="text-red-500"> *</span>
                    )}
                  </label>

                  <textarea
                    name="about"
                    value={formik.values.about}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`min-h-[100px] w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition ${
                      formik.touched.about &&
                      formik.errors.about
                        ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        : "border-gray-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                    }`}
                  />

                  {formik.touched.about &&
                    formik.errors.about && (
                      <p className="mt-1 text-xs text-red-500">
                        {formik.errors.about}
                      </p>
                    )}
                </div>


                {/* =========================================================
                    API Error
                ========================================================== */}

                {apiError && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 shrink-0"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line
                        x1="12"
                        y1="8"
                        x2="12"
                        y2="12"
                      />
                      <line
                        x1="12"
                        y1="16"
                        x2="12.01"
                        y2="16"
                      />
                    </svg>

                    {apiError.code ===
                    "ALREADY_EMPLOYEE" ? (
                      <span>
                        {apiError.message} This person
                        already has an employee profile and
                        cannot be added again.
                      </span>
                    ) : (
                      <span>
                        {apiError.message} Please{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setApiError(null);
                            setImportModalOpen(true);
                          }}
                          className="font-semibold underline transition hover:text-red-800"
                        >
                          Import this user
                        </button>{" "}
                        instead of creating a new account.
                      </span>
                    )}
                  </div>
                )}


                {/* =========================================================
                    Actions
                ========================================================== */}

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting && (
                      <svg
                        className="h-4 w-4 animate-spin text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />

                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                    )}

                    {isSubmitting
                      ? "Saving..."
                      : editData
                      ? "Save Changes"
                      : "Save"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
// ```
