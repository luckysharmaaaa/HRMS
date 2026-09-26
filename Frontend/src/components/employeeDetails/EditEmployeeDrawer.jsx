import React, { useState, useEffect, useRef } from "react";
import { X, Calendar, EyeOff, Eye, Image as ImageIcon, Edit } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  empId: "",
  joiningDate: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  company: "",
  department: "",
  designation: "",
  about: "",
};

const DEPTS = [
  "Finance",
  "Engineering",
  "Management",
  "Development",
  "Admin",
  "Analytics",
  "QA",
];
const DESIGNATIONS_LIST = ["Finance", "Developer", "Executive", "Manager"];

export default function EditEmployeeDrawer({
  open,
  onClose,
  editData,
  onSubmit,
}) {
  const [activeTab, setActiveTab] = useState("Basic Information");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  const validationSchema = Yup.object().shape({
    firstName: Yup.string().required("First Name is required"),
    lastName: Yup.string(),
    empId: Yup.string().required("Employee ID is required"),
    joiningDate: Yup.string().required("Joining Date is required"),
    username: Yup.string().required("Username is required"),
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    password: Yup.string(),
    confirmPassword: Yup.string().oneOf(
      [Yup.ref("password")],
      "Passwords do not match",
    ),
    phone: Yup.string().required("Phone Number is required"),
    company: Yup.string().required("Company is required"),
    department: Yup.string().required("Department is required"),
    designation: Yup.string().required("Designation is required"),
    about: Yup.string().required("About is required"),
  });

  const formik = useFormik({
    initialValues: EMPTY_FORM,
    validationSchema,
    onSubmit: (values) => {
      const submittedForm = {
        ...values,
        name: `${values.firstName} ${values.lastName}`.trim(),
        status: "Active",
      };

      if (onSubmit) {
        onSubmit(submittedForm);
      }
      onClose();
    },
  });

  useEffect(() => {
    if (open) {
      if (editData) {
        formik.setValues({
          ...EMPTY_FORM,
          firstName: editData.name?.split(" ")[0] || "",
          lastName: editData.name?.split(" ").slice(1).join(" ") || "",
          empId: editData.empId || "",
          email: editData.email || "",
          phone: editData.phone || "",
          department: editData.department || "",
          designation: editData.designation || "",
          joiningDate: editData.joiningDate || "",
          username: editData.name?.split(" ")[0] || "",
          company: "Abac Company",
          about: "As an award winning designer, I deliver exceptional quality work and bring value to your brand! With 10 years of experience and 350+ projects completed worldwide with satisfied customers, I developed the 360° brand approach, which helped me to create numerous brands that are relevant, meaningful and loved."
        });
      } else {
        formik.setValues(EMPTY_FORM);
      }
      formik.setTouched({});
      setActiveTab("Basic Information");
      setProfileImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editData, open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert("Image should be below 4 MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelImage = () => {
    setProfileImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const field = (
    label,
    key,
    type = "text",
    required = true,
    icon = null,
    onIconClick = null,
  ) => {
    const hasError = formik.touched[key] && formik.errors[key];

    return (
      <div>
        <label className="block text-[13px] font-semibold text-[#1f2937] mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <input
            id={key}
            name={key}
            type={type}
            value={formik.values[key]}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            onClick={(e) =>
              type === "date" && e.target.showPicker && e.target.showPicker()
            }
            placeholder={type === "date" ? "dd-mm-yyyy" : ""}
            className={`w-full border rounded-lg px-3.5 py-2.5 text-sm outline-none transition ${
              hasError
                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : "border-gray-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            } ${
              type === "date"
                ? "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                : ""
            }`}
          />
          {icon && (
            <div
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 ${
                onIconClick
                  ? "cursor-pointer hover:text-gray-700 pointer-events-auto"
                  : "pointer-events-none"
              }`}
              onClick={onIconClick}
            >
              {icon}
            </div>
          )}
        </div>
        {hasError && (
          <p className="text-red-500 text-xs mt-1">{formik.errors[key]}</p>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className={`drawer drawer-end z-[1000] fixed inset-0 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <input
          type="checkbox"
          className="drawer-toggle"
          checked={open}
          readOnly
        />
        <div className="drawer-side">
          <label onClick={onClose} className="drawer-overlay"></label>
          <div className="bg-white h-full w-[480px] sm:w-[600px] md:w-[700px] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl shrink-0 shadow-sm border border-orange-100/60">
                  <Edit size={22} />
                </div>
                <div>
                  <h2 className="text-[1.4rem] font-bold text-[#0F265C] tracking-tight leading-tight">
                    Edit Employee
                  </h2>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    Employee ID : {formik.values.empId || "EMP-001"}
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


            {/* Form Content */}
            <form
              onSubmit={formik.handleSubmit}
              className="flex-1 overflow-y-auto"
            >
                <div className="p-6 space-y-6">
                  {/* Profile Image Upload */}
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : editData && editData.avatar ? (
                        <div
                          className={`w-full h-full ${editData.color} flex items-center justify-center text-white text-3xl font-bold`}
                        >
                          {editData.avatar}
                        </div>
                      ) : (
                        <ImageIcon size={24} className="text-gray-300" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0F265C] mb-1">
                        Upload Profile Image
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">
                        Image should be below 4 mb
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-1.5 bg-orange-500 text-white text-sm font-semibold rounded hover:bg-orange-600 transition"
                        >
                          Upload
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelImage}
                          className="px-4 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Form Grid */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    {field("First Name", "firstName")}
                    {field("Last Name", "lastName", "text", false)}
                    {field("Employee ID", "empId")}
                    {field(
                      "Joining Date",
                      "joiningDate",
                      "date",
                      true,
                      <Calendar size={16} />,
                    )}
                    {field("Username", "username")}
                    {field("Email", "email", "email")}
                    {field(
                      "Password",
                      "password",
                      showPassword ? "text" : "password",
                      true,
                      showPassword ? <Eye size={16} /> : <EyeOff size={16} />,
                      () => setShowPassword(!showPassword),
                    )}
                    {field(
                      "Confirm Password",
                      "confirmPassword",
                      showConfirmPassword ? "text" : "password",
                      true,
                      showConfirmPassword ? (
                        <Eye size={16} />
                      ) : (
                        <EyeOff size={16} />
                      ),
                      () => setShowConfirmPassword(!showConfirmPassword),
                    )}
                    {field("Phone Number", "phone", "tel")}
                    {field("Company", "company")}

                    <div>
                      <label className="block text-[13px] font-semibold text-[#1f2937] mb-1.5">
                        Department
                      </label>
                      <div className="relative">
                        <select
                          name="department"
                          value={formik.values.department}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className={`w-full border rounded-lg px-3.5 py-2.5 text-sm outline-none transition bg-white appearance-none ${
                            formik.touched.department &&
                            formik.errors.department
                              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-gray-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                          }`}
                        >
                          <option value="">Select</option>
                          {DEPTS.map((d) => (
                            <option key={d}>{d}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
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
                      {formik.touched.department &&
                        formik.errors.department && (
                          <p className="text-red-500 text-xs mt-1">
                            {formik.errors.department}
                          </p>
                        )}
                    </div>

                    <div>
                      <label className="block text-[13px] font-semibold text-[#1f2937] mb-1.5">
                        Designation
                      </label>
                      <div className="relative">
                        <select
                          name="designation"
                          value={formik.values.designation}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className={`w-full border rounded-lg px-3.5 py-2.5 text-sm outline-none transition bg-white appearance-none ${
                            formik.touched.designation &&
                            formik.errors.designation
                              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-gray-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                          }`}
                        >
                          <option value="">Select</option>
                          {DESIGNATIONS_LIST.map((d) => (
                            <option key={d}>{d}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
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
                      {formik.touched.designation &&
                        formik.errors.designation && (
                          <p className="text-red-500 text-xs mt-1">
                            {formik.errors.designation}
                          </p>
                        )}
                    </div>
                  </div>

                  {/* About text area */}
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1f2937] mb-1.5">
                      About <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="about"
                      value={formik.values.about}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full border rounded-lg px-3.5 py-2.5 text-sm outline-none transition min-h-[100px] ${
                        formik.touched.about && formik.errors.about
                          ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          : "border-gray-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                      }`}
                    />
                    {formik.touched.about && formik.errors.about && (
                      <p className="text-red-500 text-xs mt-1">
                        {formik.errors.about}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                    >
                      Save
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
