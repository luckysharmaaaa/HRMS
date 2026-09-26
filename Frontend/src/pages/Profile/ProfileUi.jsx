import React from "react";
import { AlertCircle } from "lucide-react";

// One source of truth for input styling on the Profile page.
export const inputClass = (hasError = false) =>
  [
    "block h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 outline-none transition",
    "placeholder:text-slate-400 hover:border-slate-400",
    "focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
      : "border-slate-300 focus:border-orange-500 focus:ring-orange-500/15",
  ].join(" ");

/**
 * A settings block: title + description on the left, fields on the right.
 * Stacks on small screens.
 */
export const SettingsSection = ({ title, description, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white">
    <div className="grid gap-6 p-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12 lg:p-8">
      <div>
        <h3 className="text-base font-semibold text-[#041D5F]">{title}</h3>
        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div>{children}</div>
    </div>
  </section>
);

/**
 * Label + control + error/hint, wired for screen readers
 * (label -> control via htmlFor, message -> control via aria-describedby).
 */
export const Field = ({
  id,
  label,
  required = false,
  error,
  hint,
  className = "",
  children,
}) => (
  <div className={className}>
    <label
      htmlFor={id}
      className="mb-1.5 block text-sm font-medium text-slate-700"
    >
      {label}
      {required && (
        <span className="ml-0.5 text-red-500" aria-hidden="true">
          *
        </span>
      )}
    </label>

    {children}

    {error ? (
      <p
        id={`${id}-error`}
        role="alert"
        className="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-red-600"
      >
        <AlertCircle size={14} className="mt-0.5 shrink-0" />
        <span>{error}</span>
      </p>
    ) : hint ? (
      <p id={`${id}-hint`} className="mt-1.5 text-xs leading-5 text-slate-500">
        {hint}
      </p>
    ) : null}
  </div>
);

/**
 * Formik-connected text input.
 * Errors show once the field has been touched (or a submit was attempted).
 */
export const TextField = ({
  formik,
  name,
  label,
  required = false,
  hint,
  className = "",
  type = "text",
  ...inputProps
}) => {
  const error = formik.touched[name] && formik.errors[name];

  return (
    <Field
      id={name}
      label={label}
      required={required}
      error={error}
      hint={hint}
      className={className}
    >
      <input
        id={name}
        name={name}
        type={type}
        value={formik.values[name] ?? ""}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${name}-error` : hint ? `${name}-hint` : undefined
        }
        className={inputClass(Boolean(error))}
        {...inputProps}
      />
    </Field>
  );
};