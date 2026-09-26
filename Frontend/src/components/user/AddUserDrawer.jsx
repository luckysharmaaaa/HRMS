import React, { useState } from "react";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import * as Yup from "yup";

import { createUser } from "../../services/userApi";
import { uploadMedia } from "../../services/mediaApi";
import { isCompanyEmail, COMPANY_EMAIL_DOMAIN } from "../../config/company";

import UserForm from "./Userform";

// ============================================================
// VALIDATION SCHEMA
// ============================================================
// Defines validation rules for the User form fields.
//
// Email rule: provide EITHER an official company email (email) OR a
// personal email (alternateEmail) for an employee who doesn't have
// their company email yet — at least one is required.
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

  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain an uppercase letter")
    .matches(/[0-9]/, "Password must contain a number")
    .required("Password is required"),

  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Confirm Password is required"),

  phone: Yup.string()
    .matches(/^[0-9+\-\s()]{7,15}$/, "Enter a valid phone number")
    .required("Phone is required"),
});

// ============================================================
// INITIAL ADDRESS STATE
// ============================================================
// Default values for the Address Information module.
const initialAddressState = {
  addressType: "home",
  countryID: 1,
  countryCode: "IN",
  phoneCode: "+91",
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

// ============================================================
// ADD USER DRAWER COMPONENT
// ============================================================
const AddUserDrawer = ({ open, onClose, onSuccess, roles = [] }) => {
  // ==========================================================
  // USER STATUS
  // ==========================================================
  // Default status of a newly created user is Active (true).
  const [status, setStatus] = useState(true);

  // ==========================================================
  // SELECTED ROLES
  // ==========================================================
  // Stores the IDs of roles selected by the admin.
  const [selectedRoles, setSelectedRoles] = useState([]);

  // ==========================================================
  // PROFILE IMAGE STATE
  // ==========================================================
  // Stores the actual selected image file.
  const [profileImageFile, setProfileImageFile] = useState(null);

  // Stores the temporary preview URL of the selected image.
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  // ==========================================================
  // ADDRESS STATE
  // ==========================================================
  // Stores all address-related form fields.
  const [addressData, setAddressData] = useState(initialAddressState);

  // ==========================================================
  // ROLE CHANGE HANDLER
  // ==========================================================
  // Adds/removes a role ID from selectedRoles.
  const handleRoleChange = (roleId) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((item) => item !== roleId)
        : [...prev, roleId]
    );
  };

  // ==========================================================
  // IMAGE CHANGE HANDLER
  // ==========================================================
  // Saves the selected image file and creates a preview URL.
  const handleImageChange = (file) => {
    if (profileImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(profileImagePreview);
    }

    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  // ==========================================================
  // REMOVE IMAGE HANDLER
  // ==========================================================
  // Removes the selected image and its preview.
  // (Previously this didn't revoke the blob: URL created in
  // handleImageChange, so every "remove and re-pick a photo" cycle
  // leaked an object URL for the life of the tab.)
  const handleRemoveImage = () => {
    if (profileImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(profileImagePreview);
    }

    setProfileImageFile(null);
    setProfileImagePreview(null);
  };

  // ==========================================================
  // ADDRESS CHANGE HANDLER
  // ==========================================================
  // Updates addressData whenever an address field changes.
  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;

    setAddressData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ==========================================================
  // RESET ALL FORM DATA
  // ==========================================================
  // Resets:
  // - Formik user fields
  // - Selected roles
  // - Status
  // - Profile image
  // - Address information
  const resetAll = (resetForm) => {
    resetForm?.();

    setSelectedRoles([]);
    setStatus(true);

    if (profileImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(profileImagePreview);
    }
    setProfileImageFile(null);
    setProfileImagePreview(null);

    setAddressData(initialAddressState);
  };

  // ==========================================================
  // FORMIK CONFIGURATION
  // ==========================================================
  const formik = useFormik({
    // ----------------------------------------------------------
    // INITIAL USER FORM VALUES
    // ----------------------------------------------------------
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      alternateEmail: "",
      password: "",
      confirmPassword: "",
      phone: "",
    },

    // ----------------------------------------------------------
    // YUP VALIDATION
    // ----------------------------------------------------------
    validationSchema,

    // ----------------------------------------------------------
    // FORM SUBMIT
    // ----------------------------------------------------------
    onSubmit: async (values, { resetForm }) => {
      try {
        // ======================================================
        // STEP 1: VALIDATE ROLE
        // ======================================================
        // At least one role must be selected.
        if (selectedRoles.length === 0) {
          toast.error("Please select at least one role.");
          return;
        }

        // ======================================================
        // STEP 2: VALIDATE REQUIRED ADDRESS FIELDS
        // ======================================================
        // These fields are required before creating the user.
        if (
          !addressData.addressType ||
          !addressData.addressLine1 ||
          !addressData.city ||
          !addressData.state ||
          !addressData.zipCode ||
          !addressData.countryID ||
          !addressData.countryCode ||
          !addressData.phoneCode
        ) {
          toast.error("Please fill all required address fields.");
          return;
        }

        // ======================================================
        // STEP 3: CREATE USER PAYLOAD
        // ======================================================
        // Creates the complete payload that will be sent to
        // the createUser API.
        const payload = {
          firstName: values.firstName,
          lastName: values.lastName,

          // Official company email. Left out entirely when the
          // employee doesn't have one yet — alternateEmail carries
          // their personal email instead.
          email: values.email.trim() || null,
          alternateEmail: values.alternateEmail.trim() || null,

          phone: values.phone,
          password: values.password,

          // User active/inactive status.
          status,

          // Selected role IDs.
          roles: selectedRoles,

          // Address information.
          address: {
            addressType: addressData.addressType,

            // Backend expects houseNumber.
            houseNumber: addressData.houseNo,

            addressLine1: addressData.addressLine1,
            addressLine2: addressData.addressLine2,
            landmark: addressData.landmark,
            locality: addressData.locality,

            city: addressData.city,
            state: addressData.state,
            zipCode: addressData.zipCode,

            // Convert country ID from string to number.
            countryID: Number(addressData.countryID),

            countryCode: addressData.countryCode,
            phoneCode: addressData.phoneCode,
            phone: addressData.phone,

            // Convert latitude/longitude to numbers.
            // Empty values are sent as null.
            latitude: addressData.latitude
              ? Number(addressData.latitude)
              : null,

            longitude: addressData.longitude
              ? Number(addressData.longitude)
              : null,

            isDefault: addressData.isDefault,
          },
        };

        // ======================================================
        // STEP 4: CREATE USER
        // ======================================================
        const response = await createUser(payload);

        // ======================================================
        // STEP 5: CHECK USER CREATION RESPONSE
        // ======================================================
        if (response.data.success) {
          // Get the newly created user's ID.
          // This ID is required for profile image mapping.
          const userId = response.data.data.id;

          // ====================================================
          // STEP 6: UPLOAD PROFILE IMAGE
          // ====================================================
          // Profile image is uploaded only if a file was selected.
          //
          // NOTE: by this point the user has already been created
          // successfully. If the image upload fails, we still treat
          // this as a successful "add user" — we warn about the photo
          // specifically and close the drawer, instead of leaving it
          // open as if nothing had happened. (Previously a failed
          // image upload left the drawer open with the same form
          // values still in it, which read as "user creation failed"
          // and invited the admin to hit submit again — creating a
          // second, duplicate user.)
          if (profileImageFile) {
            try {
              // Create multipart/form-data object.
              const formData = new FormData();

              // Actual image file.
              formData.append("file", profileImageFile);

              // Media title.
              formData.append("title", profileImageFile.name);

              // Alternative text for the image.
              formData.append(
                "altText",
                `${values.firstName} ${values.lastName}`.trim()
              );

              // =================================================
              // MEDIA OBJECT MAPPING
              // =================================================
              // These values tell the backend that this media
              // belongs to the newly created user.
              formData.append("objectID", String(userId));
              formData.append("objectType", "user");

              // =================================================
              // CALL MEDIA UPLOAD API
              // =================================================
              // "users" is passed as the module.
              const mediaResponse = await uploadMedia(formData, "users");

              if (!mediaResponse.data.success) {
                toast.warn(
                  `User created, but the profile photo didn't upload: ${
                    mediaResponse.data.message || "please add it from the user's profile."
                  }`
                );
              }
            } catch (imageError) {
              // =================================================
              // IMAGE UPLOAD ERROR
              // =================================================
              console.error("Image Upload Error:", imageError);

              toast.warn(
                "User created, but the profile photo didn't upload. You can add it from the user's profile."
              );
              // Deliberately no `return` here — the user record exists,
              // so we still finish the success path below.
            }
          }

          // ====================================================
          // STEP 7: SUCCESS
          // ====================================================
          if (!profileImageFile) {
            toast.success(response.data.message);
          }

          // Reset the complete form.
          resetAll(resetForm);

          // Refresh parent/user list if provided.
          onSuccess?.();

          // Close the drawer.
          onClose();
        } else {
          // ====================================================
          // USER CREATION FAILED
          // ====================================================
          toast.error(
            response.data.message || "Failed to create user."
          );
        }
      } catch (error) {
        // ======================================================
        // GENERAL API ERROR
        // ======================================================
        console.error(error);

        toast.error(
          error.response?.data?.message || "Failed to create user."
        );
      }
    },
  });

  // ==========================================================
  // CLOSE DRAWER HANDLER
  // ==========================================================
  // Resets the form before closing the drawer.
  const handleClose = () => {
    resetAll(formik.resetForm);
    onClose();
  };

  // ============================================================
  // RENDER USER FORM
  // ============================================================
  // UserForm contains the actual UI.
  // AddUserDrawer handles the state and API/business logic.
  return (
    <UserForm
      open={open}
      mode="add"
      formik={formik}
      isPasswordOptional={false}
      roles={roles}
      selectedRoles={selectedRoles}
      onRoleChange={handleRoleChange}
      profileImagePreview={profileImagePreview}
      onImageChange={handleImageChange}
      onRemoveImage={handleRemoveImage}
      addressData={addressData}
      onAddressChange={handleAddressChange}
      status={status}
      onStatusToggle={() => setStatus((s) => !s)}
      onClose={handleClose}
      isSubmitting={formik.isSubmitting}
      submitLabel="Add User"
      submittingLabel="Adding..."
    />
  );
};

export default AddUserDrawer;