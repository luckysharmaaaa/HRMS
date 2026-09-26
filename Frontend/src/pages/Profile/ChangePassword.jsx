import React, { useState } from "react";
import { useFormik } from "formik";
import { Check, Circle, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import { Field, SettingsSection, inputClass } from "./ProfileUi";
import { PASSWORD_RULES, passwordSchema } from "./profileValidation";
import { changePassword } from "../../services/profileApi";

const STRENGTH_LEVELS = [
  { label: "Too weak", bar: "bg-red-500", text: "text-red-600" },
  { label: "Weak", bar: "bg-red-500", text: "text-red-600" },
  { label: "Fair", bar: "bg-amber-500", text: "text-amber-600" },
  { label: "Good", bar: "bg-lime-500", text: "text-lime-700" },
  { label: "Strong", bar: "bg-green-600", text: "text-green-700" },
];

const PasswordField = ({ formik, name, label, autoComplete, placeholder, hint }) => {
  const [visible, setVisible] = useState(false);
  const error = formik.touched[name] && formik.errors[name];

  return (
    <Field id={name} label={label} required error={error} hint={hint}>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          value={formik.values[name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${name}-error` : hint ? `${name}-hint` : undefined
          }
          className={`${inputClass(Boolean(error))} pr-12`}
        />

        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </Field>
  );
};

const PasswordChecklist = ({ password }) => {
  const results = PASSWORD_RULES.map((rule) => ({
    ...rule,
    met: rule.test(password),
  }));

  const score = results.filter((rule) => rule.met).length;
  const level = password ? STRENGTH_LEVELS[score] : null;

  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700">
          Password requirements
        </p>

        {level && (
          <p className={`text-xs font-semibold ${level.text}`} aria-live="polite">
            {level.label}
          </p>
        )}
      </div>

      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((segment) => (
          <span
            key={segment}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              password && segment <= score ? level.bar : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      <ul className="mt-3 space-y-1.5">
        {results.map((rule) => (
          <li
            key={rule.id}
            className={`flex items-center gap-2 text-xs ${
              rule.met ? "text-green-700" : "text-slate-500"
            }`}
          >
            {rule.met ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <Circle size={14} aria-hidden="true" />
            )}
            <span>{rule.label}</span>
            <span className="sr-only">{rule.met ? "(met)" : "(not met)"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ChangePassword = () => {
  const formik = useFormik({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: passwordSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const response = await changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        });

        toast.success(response?.message || "Password updated");
        resetForm();
      } catch (error) {
        toast.error(
          error?.response?.data?.message ||
            "Couldn't update your password. Try again.",
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  const { values, touched, errors, handleSubmit, resetForm, isSubmitting, dirty } =
    formik;

  const passwordsMatch =
    values.confirmPassword !== "" &&
    values.confirmPassword === values.newPassword;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <SettingsSection
        title="Change password"
        description="Choose a strong password that you don't use for any other account."
      >
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="space-y-5">
            <PasswordField
              formik={formik}
              name="currentPassword"
              label="Current password"
              autoComplete="current-password"
            />

            <PasswordField
              formik={formik}
              name="newPassword"
              label="New password"
              autoComplete="new-password"
            />

            <PasswordField
              formik={formik}
              name="confirmPassword"
              label="Confirm new password"
              autoComplete="new-password"
              hint={
                passwordsMatch && !(touched.confirmPassword && errors.confirmPassword)
                  ? "Passwords match."
                  : undefined
              }
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => resetForm()}
                disabled={isSubmitting || !dirty}
                className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-10 min-w-[150px] items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? "Updating..." : "Update password"}
              </button>
            </div>
          </div>

          <PasswordChecklist password={values.newPassword} />
        </div>
      </SettingsSection>
    </form>
  );
};

export default ChangePassword;