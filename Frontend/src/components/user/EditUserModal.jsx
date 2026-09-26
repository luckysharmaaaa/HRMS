import React, { useState, useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";

import { updateUser } from "../../services/userApi";
import {
  getAddressByOwner,
  createAddress,
  updateAddress,
} from "../../services/addressApi";
import { uploadMedia } from "../../services/mediaApi";
import { getMediaUsesByObject } from "../../services/mediaUsesApi";
import { isCompanyEmail, COMPANY_EMAIL_DOMAIN } from "../../config/company";

import UserForm from "./Userform";

// Converts relative image path into complete backend URL
const FILE_BASE_URL = "http://localhost:5000";

const resolveImageUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  return `${FILE_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

// ========================= Validation =========================
// Same rule as Add User: an official company email OR a personal
// email is required — not both, and not neither.

const validationSchema = Yup.object({
  firstName: Yup.string()
    .min(2, "First Name must be at least 2 characters")
    .required("First Name is required"),

  lastName: Yup.string()
    .min(2, "Last Name must be at least 2 characters")
    .required("Last Name is required"),

  email: Yup.string()
    .email("Enter a valid email address")
    .test(
      "is-company-domain",
      `Official email must be a @${COMPANY_EMAIL_DOMAIN} address`,
      (value) => !value || isCompanyEmail(value),
    )
    .when("alternateEmail", {
      is: (value) => !value,
      then: (schema) =>
        schema.required(
          "Provide an official company email, or a personal email below",
        ),
      otherwise: (schema) => schema.notRequired(),
    }),

  alternateEmail: Yup.string()
    .email("Enter a valid email address")
    .test(
      "not-company-domain",
      `Personal email must not be a @${COMPANY_EMAIL_DOMAIN} address — use the official email field for that`,
      (value) => !value || !isCompanyEmail(value),
    )
    .notRequired(),

  // Password is optional in edit mode
  password: Yup.string().test(
    "password-strength",
    "Password must be at least 8 characters, include one uppercase letter and one number",
    (value) => {
      if (!value) return true;

      return (
        value.length >= 8 &&
        /[A-Z]/.test(value) &&
        /[0-9]/.test(value)
      );
    },
   ),
  confirmPassword: Yup.string().when("password", {
    is: (val) => val && val.length > 0,

    then: (schema) =>
      schema
        .oneOf([Yup.ref("password")], "Passwords do not match")
        .required("Confirm Password is required"),

    otherwise: (schema) => schema.notRequired(),
  }),

  phone: Yup.string()
    .matches(/^[0-9+\-\s()]{7,15}$/, "Enter a valid phone number")
    .required("Phone is required"),
});

// ========================= Empty Address =========================

const emptyAddress = {
  addressType: "home",
  countryID: "",
  countryCode: "IN",
  phoneCode: "91",
  houseNo: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  locality: "",
  city: "",
  state: "",
  zipCode: "",
  phone: "",
  latitude: "",
  longitude: "",
  isDefault: false,
};

// Converts API address into UserForm format
const mapAddressFromApi = (a) => ({
  addressType: a.addressType ?? "",
  countryID: a.countryID ?? "",
  countryCode: a.countryCode ?? "",
  phoneCode: a.phoneCode ?? "",
  houseNo: a.houseNumber ?? "",
  addressLine1: a.addressLine1 ?? "",
  addressLine2: a.addressLine2 ?? "",
  landmark: a.landmark ?? "",
  locality: a.locality ?? "",
  city: a.city ?? "",
  state: a.state ?? "",
  zipCode: a.zipCode ?? "",
  phone: a.phone ?? "",
  latitude: a.latitude ?? "",
  longitude: a.longitude ?? "",
  isDefault: !!a.isDefault,
});

// Converts UserForm address into API payload
const buildAddressPayload = (addressData, ownerID) => ({
  ownerType: "user",
  ownerID,
  addressType: addressData.addressType,
  houseNumber: addressData.houseNo,
  addressLine1: addressData.addressLine1,
  addressLine2: addressData.addressLine2,
  landmark: addressData.landmark,
  locality: addressData.locality,
  city: addressData.city,
  state: addressData.state,
  zipCode: addressData.zipCode,
  countryID: addressData.countryID
    ? Number(addressData.countryID)
    : null,
  countryCode: addressData.countryCode,
  phoneCode: addressData.phoneCode,
  phone: addressData.phone,
  latitude: addressData.latitude
    ? Number(addressData.latitude)
    : null,
  longitude: addressData.longitude
    ? Number(addressData.longitude)
    : null,
  isDefault: addressData.isDefault,
});

// Prevent empty address from being created
const isAddressBlank = (a) =>
  !a.addressLine1 &&
  !a.city &&
  !a.state &&
  !a.zipCode;

// Check whether address was changed
const addressesEqual = (a, b) =>
  [
    "addressType",
    "houseNo",
    "addressLine1",
    "addressLine2",
    "landmark",
    "locality",
    "city",
    "state",
    "zipCode",
    "countryID",
    "countryCode",
    "phoneCode",
    "phone",
    "latitude",
    "longitude",
    "isDefault",
  ].every(
    (key) =>
      String(a[key] ?? "") === String(b[key] ?? ""),
  );

// ========================= Edit User =========================

const EditUserModal = ({
  isOpen,
  onClose,
  editUser,
  onSave,
  roles = [],
}) => {
  // ========================= State =========================

  const [visible, setVisible] = useState(false);

  const [status, setStatus] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);

  // Profile image
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [existingMediaId, setExistingMediaId] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false);

  // Separate loading state for Save Image
  const [isSavingImage, setIsSavingImage] = useState(false);

  // Address
  const [addressData, setAddressData] = useState(emptyAddress);
  const [existingAddressId, setExistingAddressId] = useState(null);

  // Main Update User loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Original server data
  const originalRef = useRef(null);

  // Temporary browser image URL
  const previewUrlRef = useRef(null);

  // Still waiting on a company email (created with only a personal
  // email). Drives the hint text under the Personal Email field.
  const pendingCompanyEmail =
    !editUser?.email && !!editUser?.alternateEmail;

  // ========================= Drawer Animation =========================

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // ========================= Load User =========================

  useEffect(() => {
    if (!editUser) return;

    const roleIds = editUser.roles
      ? editUser.roles.map((r) => Number(r.roleId))
      : [];

    const isActive = Number(editUser.status) === 1;

    setStatus(isActive);
    setSelectedRoles(roleIds);

    setImageRemoved(false);
    setProfileImageFile(null);
    setProfileImagePreview(null);

    let cancelled = false;

    (async () => {
      let loadedAddress = emptyAddress;
      let loadedAddressId = null;

      let loadedMediaId = null;
      let loadedMediaUrl = null;

      // ========================= Address =========================

      try {
        const addressRes = await getAddressByOwner(
          "user",
          editUser.id,
        );

        const list = addressRes.data?.data || [];

        const primary =
          list.find((a) => a.isDefault) || list[0];

        if (primary) {
          loadedAddress = mapAddressFromApi(primary);
          loadedAddressId = primary.id;
        }
      } catch (error) {
        console.error(
          "Failed to load address",
          error,
        );
      }

      // ========================= Profile Image =========================

      try {
        const usesRes = await getMediaUsesByObject(
          "user",
          editUser.id,
        );

        const mapping =
          (usesRes.data?.data || [])[0];

        if (mapping?.fileURL) {
          loadedMediaId = mapping.mediaID;
          loadedMediaUrl = resolveImageUrl(
            mapping.fileURL,
          );
        }
      } catch (error) {
        console.error(
          "Failed to load profile image",
          error,
        );
      }

      if (cancelled) return;

      // Put server data into state
      setAddressData(loadedAddress);
      setExistingAddressId(loadedAddressId);

      setExistingMediaId(loadedMediaId);
      setProfileImagePreview(loadedMediaUrl);

      // Store original data
      originalRef.current = {
        firstName: editUser.firstName || "",
        lastName: editUser.lastName || "",
        email: editUser.email || "",
        alternateEmail: editUser.alternateEmail || "",
        phone: editUser.phone || "",

        status: isActive,

        roles: [...roleIds].sort(
          (a, b) => a - b,
        ),

        address: loadedAddress,

        mediaId: loadedMediaId,
      };
    })();

    return () => {
      cancelled = true;
    };
  }, [editUser]);

  // ========================= Modal Close =========================

  useEffect(() => {
    if (!isOpen) {
      setProfileImageFile(null);
      setImageRemoved(false);
    }
  }, [isOpen]);

  // ========================= Role Change =========================

  const handleRoleChange = (roleId) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

  // ========================= Image Change =========================

  const handleImageChange = (file) => {
    // Remove previous temporary URL
    if (previewUrlRef.current) {
      URL.revokeObjectURL(
        previewUrlRef.current,
      );
    }

    // Create local preview
    const preview = URL.createObjectURL(file);

    previewUrlRef.current = preview;

    setProfileImageFile(file);
    setProfileImagePreview(preview);

    // New image means it is not removed
    setImageRemoved(false);
  };

  // Clean temporary preview URL
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(
          previewUrlRef.current,
        );
      }
    };
  }, []);

  // ========================= Remove Image =========================

  const handleRemoveImage = () => {
    setProfileImageFile(null);
    setProfileImagePreview(null);

    // Existing image should be removed when Save Image is clicked
    if (existingMediaId) {
      setImageRemoved(true);
    }
  };

  // ========================= SAVE PROFILE IMAGE =========================
  //
  // This is completely separate from the main Update User button.
  //
  // Choose Image -> preview only
  // Save Image -> upload + save image immediately

  const handleSaveProfileImage = async () => {
    if (!editUser) return;

    // Nothing changed
    if (!profileImageFile && !imageRemoved) {
      toast.info("No profile image changes to save.");
      return;
    }

    setIsSavingImage(true);

    try {
      // ========================= New Image =========================

      if (profileImageFile) {
        const formData = new FormData();

        formData.append(
          "file",
          profileImageFile,
        );

        formData.append(
          "title",
          profileImageFile.name,
        );

        formData.append(
          "altText",
          `${formik.values.firstName} ${formik.values.lastName}`.trim(),
        );

        // Upload image to media table
        const mediaResponse = await uploadMedia(
          formData,
          "users",
        );

        if (!mediaResponse.data.success) {
          toast.error(
            mediaResponse.data.message ||
              "Failed to upload profile image.",
          );

          return;
        }

        const newMediaId =
          mediaResponse.data.data.mediaId;

        // Link uploaded media to this user
        const userResponse = await updateUser(
          editUser.id,
          {
            mediaId: newMediaId,
          },
        );

        if (!userResponse.data.success) {
          toast.error(
            userResponse.data.message ||
              "Failed to save profile image.",
          );

          return;
        }

        // Update local state after successful save
        setExistingMediaId(newMediaId);
        setImageRemoved(false);
        setProfileImageFile(null);

        // Update original value
        if (originalRef.current) {
          originalRef.current.mediaId =
            newMediaId;
        }

        toast.success(
          "Profile image updated successfully.",
        );
      }

      // ========================= Remove Image =========================

      else if (imageRemoved) {
        const response = await updateUser(
          editUser.id,
          {
            mediaId: null,
          },
        );

        if (!response.data.success) {
          toast.error(
            response.data.message ||
              "Failed to remove profile image.",
          );

          return;
        }

        // Clear local image state
        setExistingMediaId(null);
        setProfileImageFile(null);
        setProfileImagePreview(null);
        setImageRemoved(false);

        // Update original value
        if (originalRef.current) {
          originalRef.current.mediaId = null;
        }

        toast.success(
          "Profile image removed successfully.",
        );
      }

      // Refresh parent/table data if needed
      onSave?.();

    } catch (error) {
      console.error(
        "Profile Image Error:",
        error,
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to update profile image.",
      );
    } finally {
      setIsSavingImage(false);
    }
  };

  // ========================= Address Change =========================

  const handleAddressChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setAddressData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // ========================= Formik =========================

  const formik = useFormik({
    enableReinitialize: true,

    initialValues: {
      firstName: editUser?.firstName || "",
      lastName: editUser?.lastName || "",
      email: editUser?.email || "",
      alternateEmail: editUser?.alternateEmail || "",
      phone: editUser?.phone || "",
      password: "",
      confirmPassword: "",
    },

    validationSchema,

    // ========================= MAIN UPDATE =========================

    onSubmit: async (values) => {
      if (
        !editUser ||
        !originalRef.current
      ) {
        return;
      }

      // At least one role required
      if (selectedRoles.length === 0) {
        toast.warning(
          "Please select at least one role.",
        );

        return;
      }

      setIsSubmitting(true);

      try {
        const original =
          originalRef.current;

        // Only changed fields go here
        const payload = {};

        // ========================= Basic Fields =========================

        if (
          values.firstName.trim() !==
          original.firstName
        ) {
          payload.firstName =
            values.firstName.trim();
        }

        if (
          values.lastName.trim() !==
          original.lastName
        ) {
          payload.lastName =
            values.lastName.trim();
        }

        // Only send email when it actually has a value AND changed —
        // never send an accidental blank that would clear it.
        const trimmedEmail = values.email.trim();

        if (
          trimmedEmail &&
          trimmedEmail !== original.email
        ) {
          payload.email = trimmedEmail;
        }

        // Personal email CAN be intentionally cleared (e.g. once the
        // official email has been assigned), so blank is allowed here.
        const trimmedAlternateEmail =
          values.alternateEmail.trim();

        if (
          trimmedAlternateEmail !==
          original.alternateEmail
        ) {
          payload.alternateEmail =
            trimmedAlternateEmail || null;
        }

        if (
          values.phone.trim() !==
          original.phone
        ) {
          payload.phone =
            values.phone.trim();
        }

        // ========================= Password =========================

        if (
          values.password.trim() !== ""
        ) {
          payload.password =
            values.password;
        }

        // ========================= Status =========================

        if (
          status !== original.status
        ) {
          payload.status =
            status ? "1" : "0";
        }

        // ========================= Roles =========================

        const sortedSelected =
          [...selectedRoles].sort(
            (a, b) => a - b,
          );

        const rolesChanged =
          sortedSelected.length !==
            original.roles.length ||
          sortedSelected.some(
            (id, i) =>
              id !== original.roles[i],
          );

        if (rolesChanged) {
          payload.roles =
            selectedRoles;
        }

        // IMPORTANT:
        // Profile image is NOT handled here anymore.
        // It has its own "Save Image" button.

        // ========================= Update User =========================

        if (
          Object.keys(payload).length > 0
        ) {
          const response =
            await updateUser(
              editUser.id,
              payload,
            );

          if (
            !response.data.success
          ) {
            toast.error(
              response.data.message ||
                "Failed to update user.",
            );

            return;
          }
        }

        // ========================= Address =========================

        const addressChanged =
          !addressesEqual(
            addressData,
            original.address,
          );

        if (
          addressChanged &&
          !isAddressBlank(addressData)
        ) {
          const addressPayload =
            buildAddressPayload(
              addressData,
              editUser.id,
            );

          if (existingAddressId) {
            await updateAddress(
              existingAddressId,
              addressPayload,
            );
          } else {
            await createAddress(
              addressPayload,
            );
          }
        }

        // ========================= Success =========================

        toast.success(
          "User updated successfully.",
        );

        onSave?.();
        onClose();

      } catch (error) {
        console.error(
          "Update Error:",
          error,
        );

        toast.error(
          error.response?.data?.message ||
            "Failed to update user.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Don't render when drawer is closed
  if (!isOpen && !visible) {
    return null;
  }

  // ========================= UI =========================

  return (
    <UserForm
      open={visible}
      mode="edit"
      formik={formik}
      isPasswordOptional
      pendingCompanyEmail={pendingCompanyEmail}
      roles={roles}
      selectedRoles={selectedRoles}
      onRoleChange={handleRoleChange}

      // Profile image
      profileImagePreview={
        profileImagePreview
      }
      onImageChange={
        handleImageChange
      }
      onRemoveImage={
        handleRemoveImage
      }

      // Separate image save
      onSaveProfileImage={
        handleSaveProfileImage
      }
      isSavingImage={
        isSavingImage
      }

      // Address
      addressData={addressData}
      onAddressChange={
        handleAddressChange
      }

      // Status
      status={status}
      onStatusToggle={() =>
        setStatus((s) => !s)
      }

      // Modal
      onClose={onClose}

      // Main Update User button
      isSubmitting={isSubmitting}
      submitLabel="Update User"
      submittingLabel="Updating..."
    />
  );
};

export default EditUserModal;