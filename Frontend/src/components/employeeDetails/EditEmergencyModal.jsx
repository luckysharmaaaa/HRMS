import React from "react";
import { X, Edit } from "lucide-react";

export default function EditEmergencyModal({ open, onClose, emergencyData, onSubmit }) {
  return (
    <div className={`drawer drawer-end z-[1000] fixed inset-0 ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      <input type="checkbox" className="drawer-toggle" checked={open} readOnly />
      <div className="drawer-side">
        <label onClick={onClose} className="drawer-overlay"></label>
        <div className="bg-white h-full w-[480px] sm:w-[600px] flex flex-col shadow-2xl overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl shrink-0 shadow-sm border border-orange-100/60">
                <Edit size={22} />
              </div>
              <div>
                <h2 className="text-[1.4rem] font-bold text-[#0F265C] tracking-tight leading-tight">
                  Emergency Contact Details
                </h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Update emergency contacts
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100 bg-gray-100/50"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col gap-6">
            {/* Primary Contact */}
            <div>
              <h3 className="text-[15px] font-bold text-[#0F265C] mb-4">Primary Contact Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-semibold text-[#0F265C]">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-md p-2.5 text-sm outline-none focus:border-orange-500 transition"
                    defaultValue={emergencyData?.primary?.name}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-semibold text-[#0F265C]">
                    Relationship
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-md p-2.5 text-sm outline-none focus:border-orange-500 transition"
                    defaultValue={emergencyData?.primary?.relationship}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-semibold text-[#0F265C]">
                    Phone No 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-md p-2.5 text-sm outline-none focus:border-orange-500 transition"
                    defaultValue={emergencyData?.primary?.phone1}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-semibold text-[#0F265C]">
                    Phone No 2
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-md p-2.5 text-sm outline-none focus:border-orange-500 transition"
                    defaultValue={emergencyData?.primary?.phone2}
                  />
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-gray-100 w-full my-2"></div>

            {/* Secondary Contact */}
            <div>
              <h3 className="text-[15px] font-bold text-[#0F265C] mb-4">Secondary Contact Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-semibold text-[#0F265C]">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-md p-2.5 text-sm outline-none focus:border-orange-500 transition"
                    defaultValue={emergencyData?.secondary?.name}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-semibold text-[#0F265C]">
                    Relationship
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-md p-2.5 text-sm outline-none focus:border-orange-500 transition"
                    defaultValue={emergencyData?.secondary?.relationship}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-semibold text-[#0F265C]">
                    Phone No 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-md p-2.5 text-sm outline-none focus:border-orange-500 transition"
                    defaultValue={emergencyData?.secondary?.phone1}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-semibold text-[#0F265C]">
                    Phone No 2
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-md p-2.5 text-sm outline-none focus:border-orange-500 transition"
                    defaultValue={emergencyData?.secondary?.phone2}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto flex justify-end items-center gap-3 p-5 border-t border-gray-100 bg-white">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (onSubmit) onSubmit({});
                onClose();
              }}
              className="px-6 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition shadow-sm"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
