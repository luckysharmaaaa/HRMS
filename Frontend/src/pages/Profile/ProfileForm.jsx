import React, { useEffect, useMemo, useRef } from "react";
import { useFormik } from "formik";
import { Loader2, Lock } from "lucide-react";
import { toast } from "react-toastify";

import ProfileImage from "./ProfileImage";
import { Field, SettingsSection, TextField, inputClass } from "./ProfileUi";
import { profileSchema } from "./profileValidation";
import { updateMyProfile } from "../../services/profileApi";

const ADDRESS_TYPES = ["home", "work", "other"];
const ADDRESS_CORE_FIELDS = ["addressLine1", "city", "state", "zipCode"];

const clean = (value) => String(value ?? "").trim();

// profileData = { user, address, roles, profileImage }  (GET /auth/me)
const ProfileForm = ({ profileData, onSaved, onImageChanged }) => {
  const user = profileData?.user;
  const address = profileData?.address;
  const roles = profileData?.roles || [];
  const profileImage = profileData?.profileImage;

  const formRef = useRef(null);
  const focusedForSubmit = useRef(0);

  const initialValues = useMemo(
    () => ({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",

      addressType: address?.addressType || "home",
      houseNumber: address?.houseNumber || "",
      addressLine1: address?.addressLine1 || "",
      addressLine2: address?.addressLine2 || "",
      landmark: address?.landmark || "",
      locality: address?.locality || "",
      city: address?.city || "",
      state: address?.state || "",
      zipCode: address?.zipCode || "",
      countryID: address?.countryID ?? "",
      countryCode: address?.countryCode || "",
      phoneCode: address?.phoneCode || "",
      latitude: address?.latitude ?? "",
      longitude: address?.longitude ?? "",
      isDefault: Boolean(address?.isDefault),
    }),
    [user, address],
  );

  const formik = useFormik({
    initialValues,
    validationSchema: profileSchema,
    enableReinitialize: true,
    onSubmit: async (submitted, { setSubmitting, resetForm }) => {
      try {
        const hasAddressInput = ADDRESS_CORE_FIELDS.some((key) =>
          clean(submitted[key]),
        );

        // Sign-in email is managed by HR/Admin, so it is never sent from here.
        const payload = {
          firstName: clean(submitted.firstName),
          lastName: clean(submitted.lastName),
          phone: clean(submitted.phone) || null,
        };

        if (hasAddressInput) {
          payload.address = {
            addressType: submitted.addressType || "home",
            houseNumber: clean(submitted.houseNumber) || null,
            addressLine1: clean(submitted.addressLine1),
            addressLine2: clean(submitted.addressLine2) || null,
            landmark: clean(submitted.landmark) || null,
            locality: clean(submitted.locality) || null,
            city: clean(submitted.city),
            state: clean(submitted.state),
            zipCode: clean(submitted.zipCode),
            countryID: submitted.countryID ? Number(submitted.countryID) : null,
            countryCode: clean(submitted.countryCode),
            phoneCode: clean(submitted.phoneCode),
            latitude:
              submitted.latitude === "" ? null : Number(submitted.latitude),
            longitude:
              submitted.longitude === "" ? null : Number(submitted.longitude),
            isDefault: submitted.isDefault,
          };
        }

        const response = await updateMyProfile(payload);

        toast.success(response?.message || "Profile updated");
        onSaved?.(response?.data);

        // The saved values are the new baseline, so the "unsaved" bar closes.
        resetForm({ values: submitted });
      } catch (error) {
        toast.error(
          error?.response?.data?.message ||
            "Couldn't save your changes. Try again.",
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  const {
    values,
    handleChange,
    handleSubmit,
    resetForm,
    isSubmitting,
    isValid,
    dirty,
    submitCount,
  } = formik;

  // Warn before the tab is closed / reloaded with unsaved edits.
  useEffect(() => {
    if (!dirty) return undefined;

    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warn);

    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // After a failed submit, move focus to the first invalid field.
  useEffect(() => {
    if (submitCount > focusedForSubmit.current && !isSubmitting && !isValid) {
      focusedForSubmit.current = submitCount;
      formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
    }
  }, [submitCount, isSubmitting, isValid]);

  // A logged-in user is active by definition; only show "Inactive" when the
  // API explicitly says so. (status may arrive as 1 or "1".)
  const isActive =
    user?.status === undefined || user?.status === null
      ? true
      : String(user.status) === "1";

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6">
      <ProfileImage
        user={user}
        roles={roles}
        profileImage={profileImage}
        onChange={onImageChanged}
      />

      {/* Personal information */}
      <SettingsSection
        title="Personal information"
        description="Your name and contact details as they appear across the workspace."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            formik={formik}
            name="firstName"
            label="First name"
            required
            autoComplete="given-name"
          />

          <TextField
            formik={formik}
            name="lastName"
            label="Last name"
            required
            autoComplete="family-name"
          />

          <Field
            id="email"
            label="Sign-in email"
            hint="Managed by HR/Admin. Contact them if it needs to change."
            className="sm:col-span-2"
          >
            <div className="relative">
              <input
                id="email"
                type="email"
                value={user?.email || ""}
                readOnly
                aria-describedby="email-hint"
                className={`${inputClass(false)} bg-slate-50 pr-10 text-slate-600`}
              />
              <Lock
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </Field>

          <TextField
            formik={formik}
            name="phone"
            label="Phone number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="e.g. +91 98765 43210"
            className="sm:col-span-2"
          />
        </div>
      </SettingsSection>

      {/* Address */}
      <SettingsSection
        title="Address"
        description="Optional. If you add an address, address line 1, city, state and postal code are needed."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <fieldset className="sm:col-span-2">
            <legend className="mb-1.5 text-sm font-medium text-slate-700">
              Address type
            </legend>

            <div className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-1">
              {ADDRESS_TYPES.map((type) => (
                <label key={type} className="relative">
                  <input
                    type="radio"
                    name="addressType"
                    value={type}
                    checked={values.addressType === type}
                    onChange={handleChange}
                    className="peer sr-only"
                  />
                  <span className="block cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium capitalize text-slate-600 transition peer-checked:bg-white peer-checked:text-[#041D5F] peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-orange-500/40">
                    {type}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <TextField
            formik={formik}
            name="houseNumber"
            label="House / flat no."
            autoComplete="off"
          />

          <TextField
            formik={formik}
            name="landmark"
            label="Landmark"
            autoComplete="off"
          />

          <TextField
            formik={formik}
            name="addressLine1"
            label="Address line 1"
            autoComplete="address-line1"
            className="sm:col-span-2"
          />

          <TextField
            formik={formik}
            name="addressLine2"
            label="Address line 2"
            autoComplete="address-line2"
            className="sm:col-span-2"
          />

          <TextField
            formik={formik}
            name="locality"
            label="Locality"
            autoComplete="off"
          />

          <TextField
            formik={formik}
            name="city"
            label="City"
            autoComplete="address-level2"
          />

          <TextField
            formik={formik}
            name="state"
            label="State"
            autoComplete="address-level1"
          />

          <TextField
            formik={formik}
            name="zipCode"
            label="Postal code"
            autoComplete="postal-code"
            inputMode="numeric"
          />

          <label
            htmlFor="isDefault"
            className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700 sm:col-span-2"
          >
            <input
              type="checkbox"
              id="isDefault"
              name="isDefault"
              checked={values.isDefault}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 accent-orange-500"
            />
            Use as my default address
          </label>
        </div>
      </SettingsSection>

      {/* Region */}
      <SettingsSection
        title="Country and region"
        description="Country details linked to your address."
      >
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField
            formik={formik}
            name="countryID"
            label="Country ID"
            type="number"
            inputMode="numeric"
            min="0"
          />

          <TextField
            formik={formik}
            name="countryCode"
            label="Country code"
            placeholder="e.g. IN"
            autoComplete="off"
          />

          <TextField
            formik={formik}
            name="phoneCode"
            label="Phone code"
            placeholder="e.g. +91"
            autoComplete="off"
          />
        </div>
      </SettingsSection>

      {/* Account (read-only) */}
      <SettingsSection
        title="Account"
        description="Set by your administrator. These can't be edited here."
      >
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="mb-1.5 text-sm font-medium text-slate-700">Role</dt>
            <dd className="text-sm text-slate-900">
              {roles.length > 0
                ? roles.map((role) => role.roleName).join(", ")
                : "Not assigned"}
            </dd>
          </div>

          <div>
            <dt className="mb-1.5 text-sm font-medium text-slate-700">
              Status
            </dt>
            <dd>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  isActive
                    ? "bg-green-50 text-green-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${
                    isActive ? "bg-green-600" : "bg-slate-400"
                  }`}
                />
                {isActive ? "Active" : "Inactive"}
              </span>
            </dd>
          </div>
        </dl>
      </SettingsSection>

      {/* Unsaved changes bar */}
      {dirty && (
        <div
          role="region"
          aria-label="Unsaved changes"
          className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 px-5 py-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-center gap-2 text-sm text-slate-700">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-orange-500"
            />
            You have unsaved changes
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => resetForm()}
              disabled={isSubmitting}
              className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:opacity-60"
            >
              Discard
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-10 min-w-[128px] items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
};

export default ProfileForm;