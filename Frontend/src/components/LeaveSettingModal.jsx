import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { CalendarCog, X, Loader2 } from "lucide-react";
import { createLeaveSetting, updateLeaveSetting } from "../services/leaveService";

const schema = Yup.object({
  leaveCode: Yup.string().trim().required("Leave code is required").max(10),
  leaveName: Yup.string().trim().required("Leave name is required").max(50),
  leavePerMonth: Yup.number()
    .min(0, "Cannot be negative")
    .required("Leave per month is required"),
  maxBalance: Yup.number().min(0, "Cannot be negative").required("Max balance is required"),
  carryForward: Yup.boolean(),
  maxCarryForward: Yup.number().min(0, "Cannot be negative"),
  allowHalfDay: Yup.boolean(),
  isPaid: Yup.boolean(),
});

const EMPTY_VALUES = {
  leaveCode: "",
  leaveName: "",
  leavePerMonth: 0,
  maxBalance: 0,
  carryForward: false,
  maxCarryForward: 0,
  allowHalfDay: true,
  isPaid: true,
};

// ── Add / Edit Leave Setting Drawer ─────────────────────────────
export default function LeaveSettingModal({ open, leave, onClose, onSaved }) {
  const isEdit = !!leave;

  const initialValues = isEdit
    ? {
        leaveCode: leave.leaveCode ?? "",
        leaveName: leave.leaveName ?? "",
        leavePerMonth: Number(leave.leavePerMonth ?? 0),
        maxBalance: Number(leave.maxBalance ?? 0),
        carryForward: !!Number(leave.carryForward),
        maxCarryForward: Number(leave.maxCarryForward ?? 0),
        allowHalfDay: !!Number(leave.allowHalfDay),
        isPaid: !!Number(leave.isPaid),
      }
    : EMPTY_VALUES;

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    setStatus(null);
    try {
      const payload = {
        leaveCode: values.leaveCode.trim(),
        leaveName: values.leaveName.trim(),
        leavePerMonth: Number(values.leavePerMonth),
        maxBalance: Number(values.maxBalance),
        carryForward: values.carryForward ? 1 : 0,
        maxCarryForward: Number(values.maxCarryForward),
        allowHalfDay: values.allowHalfDay ? 1 : 0,
        isPaid: values.isPaid ? 1 : 0,
      };

      if (isEdit) {
        await updateLeaveSetting(leave.id, payload);
      } else {
        await createLeaveSetting(payload);
      }

      onSaved?.();
      onClose();
    } catch (err) {
      setStatus(err?.response?.data?.message || "Failed to save leave setting.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[999] transition-opacity duration-300 ${
          open ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[460px] bg-white z-[1000] transition-transform duration-300 shadow-2xl flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl shrink-0 shadow-sm border border-orange-100/30">
              <CalendarCog size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0F265C] tracking-tight leading-tight">
                {isEdit ? "Edit Leave Setting" : "Add Leave Setting"}
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-1">
                {isEdit
                  ? "Update this leave type's policy"
                  : "Define a new leave type policy"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-lg hover:bg-gray-50"
          >
            <X size={20} />
          </button>
        </div>

        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={schema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, status }) => (
            <Form className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 p-5 overflow-y-auto space-y-5">
                {status && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-2.5">
                    {status}
                  </div>
                )}

                {/* Leave Code / Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Leave Code <span className="text-red-400">*</span>
                    </label>
                    <Field
                      name="leaveCode"
                      placeholder="e.g. CL"
                      disabled={isEdit}
                      className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    <ErrorMessage
                      name="leaveCode"
                      component="p"
                      className="text-xs text-red-500 mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Leave Name <span className="text-red-400">*</span>
                    </label>
                    <Field
                      name="leaveName"
                      placeholder="e.g. Casual Leave"
                      className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                    />
                    <ErrorMessage
                      name="leaveName"
                      component="p"
                      className="text-xs text-red-500 mt-1"
                    />
                  </div>
                </div>

                {/* Leave Per Month / Max Balance */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Leave / Month <span className="text-red-400">*</span>
                    </label>
                    <Field
                      type="number"
                      step="0.5"
                      name="leavePerMonth"
                      className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                    />
                    <ErrorMessage
                      name="leavePerMonth"
                      component="p"
                      className="text-xs text-red-500 mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Max Balance <span className="text-red-400">*</span>
                    </label>
                    <Field
                      type="number"
                      step="0.5"
                      name="maxBalance"
                      className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                    />
                    <ErrorMessage
                      name="maxBalance"
                      component="p"
                      className="text-xs text-red-500 mt-1"
                    />
                  </div>
                </div>

                {/* Carry Forward + Max Carry Forward */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 cursor-pointer">
                    <Field type="checkbox" name="carryForward" className="accent-orange-500" />
                    Allow Carry Forward
                  </label>
                  <Field
                    type="number"
                    step="0.5"
                    name="maxCarryForward"
                    placeholder="Max carry forward days"
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                  />
                  <ErrorMessage
                    name="maxCarryForward"
                    component="p"
                    className="text-xs text-red-500 mt-1"
                  />
                </div>

                {/* Toggles */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <Field type="checkbox" name="allowHalfDay" className="accent-orange-500" />
                    Allow Half Day
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <Field type="checkbox" name="isPaid" className="accent-orange-500" />
                    Paid Leave
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 bg-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {isEdit ? "Update Leave Setting" : "Add Leave Setting"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </>
  );
}