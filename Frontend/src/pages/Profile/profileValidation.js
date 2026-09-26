import * as Yup from "yup";

// Same rules as validatePasswordStrength() in the backend utils/password.ts.
export const PASSWORD_RULES = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (value) => value.length >= 8,
  },
  {
    id: "upper",
    label: "One uppercase letter",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "lower",
    label: "One lowercase letter",
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "One number",
    test: (value) => /[0-9]/.test(value),
  },
  {
    id: "special",
    label: "One special character (! @ # $ % ...)",
    test: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
  },
];

const ADDRESS_CORE_FIELDS = ["addressLine1", "city", "state", "zipCode"];

// Address is optional, but once someone starts filling it in, the core
// fields are needed (the form only sends an address when one of them is set).
const requiredOnceAddressStarted = (label) =>
  Yup.string().test(
    "address-core-required",
    `${label} is required when adding an address`,
    function check(value) {
      const started = ADDRESS_CORE_FIELDS.some(
        (key) => String(this.parent[key] ?? "").trim() !== ""
      );

      return !started || String(value ?? "").trim() !== "";
    }
  );

// Sign-in email is managed by HR/Admin, so it is not part of this form.
export const profileSchema = Yup.object().shape({
  firstName: Yup.string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(100, "First name must be 100 characters or fewer")
    .required("Enter your first name"),
  lastName: Yup.string()
    .trim()
    .min(1, "Enter your last name")
    .max(100, "Last name must be 100 characters or fewer")
    .required("Enter your last name"),
  // excludeEmptyString: an empty phone is allowed (it was rejected before).
  phone: Yup.string()
    .trim()
    .matches(/^[\d\s\-()+]{10,20}$/, {
      message: "Enter a valid phone number (10-20 digits)",
      excludeEmptyString: true,
    })
    .nullable()
    .notRequired(),
  addressLine1: requiredOnceAddressStarted("Address line 1"),
  city: requiredOnceAddressStarted("City"),
  state: requiredOnceAddressStarted("State"),
  zipCode: requiredOnceAddressStarted("Postal code"),
});

export const passwordSchema = Yup.object().shape({
  currentPassword: Yup.string().required("Enter your current password"),
  newPassword: Yup.string()
    .required("Enter a new password")
    .test(
      "strength",
      "Your password doesn't meet all the requirements below",
      (value) => PASSWORD_RULES.every((rule) => rule.test(value || ""))
    )
    .notOneOf(
      [Yup.ref("currentPassword")],
      "Choose a password different from your current one"
    ),
  confirmPassword: Yup.string()
    .required("Confirm your new password")
    .oneOf([Yup.ref("newPassword")], "Passwords don't match"),
});