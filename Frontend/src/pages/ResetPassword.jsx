import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import login from "../assets/images/logo.png";
import loginBg from "../assets/images/Login_bg.png";
import { resetPassword } from "../services/loginAPI";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = useMemo(
    () => searchParams.get("token") || "",
    [searchParams]
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error(
        "This password reset link is invalid."
      );
      return;
    }

    if (password.length < 8) {
      toast.error(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await resetPassword(
        token,
        password
      );

      setSuccess(true);

      toast.success(
        "Password reset successfully."
      );
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        "This reset link is invalid or expired.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen w-full bg-white flex">

      {/* LEFT */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        <img
          src={loginBg}
          alt="SmartHR"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/10" />

        <div className="relative z-10 flex items-end p-12">
          <div className="max-w-lg text-white">
            <h1 className="text-4xl font-semibold">
              Smart HR Management
            </h1>

            <p className="mt-4 text-base leading-7 text-white/90">
              Securely update your account password.
            </p>
          </div>
        </div>
      </div>


      {/* RIGHT */}
      <div className="flex w-full lg:w-[48%] items-center justify-center px-6 py-10">
        <div className="w-full max-w-[440px]">

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mb-8 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft size={17} />
            Back to sign in
          </button>


          <img
            src={login}
            alt="SmartHR"
            className="mb-10 h-12 w-auto"
          />


          {!success ? (
            <>
              <h2 className="text-[30px] font-semibold tracking-tight text-[#17233C]">
                Create new password
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Choose a strong password for your
                SmartHR account.
              </p>


              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
              >

                {/* PASSWORD */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    New password
                  </label>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Enter new password"
                      disabled={loading}
                      className="h-12 w-full rounded-lg border border-slate-200 pl-11 pr-12 text-sm outline-none focus:border-[#F28C28] focus:ring-2 focus:ring-[#F28C28]/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (prev) => !prev
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Use at least 8 characters.
                  </p>
                </div>


                {/* CONFIRM */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Confirm password
                  </label>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      placeholder="Confirm new password"
                      disabled={loading}
                      className="h-12 w-full rounded-lg border border-slate-200 pl-11 pr-12 text-sm outline-none focus:border-[#F28C28] focus:ring-2 focus:ring-[#F28C28]/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (prev) => !prev
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>


                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#F28C28] text-sm font-semibold text-white transition hover:bg-[#E17E1C] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Updating password...
                    </>
                  ) : (
                    "Reset password"
                  )}
                </button>

              </form>
            </>
          ) : (
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2
                  size={28}
                  className="text-green-600"
                />
              </div>

              <h2 className="mt-6 text-[30px] font-semibold tracking-tight text-[#17233C]">
                Password updated
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Your password has been changed
                successfully. You can now sign in
                using your new password.
              </p>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-7 h-12 w-full rounded-lg bg-[#F28C28] text-sm font-semibold text-white hover:bg-[#E17E1C]"
              >
                Continue to sign in
              </button>
            </div>
          )}


          <p className="mt-10 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} SmartHR.
            All rights reserved.
          </p>

        </div>
      </div>
    </div>
  );
};


export default ResetPassword;