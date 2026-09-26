import React, { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import login from "../assets/images/logo.png";
import loginBg from "../assets/images/Login_bg.png";
import { forgotPassword } from "../services/loginAPI";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setLoading(true);

      await forgotPassword(email);

      setSubmitted(true);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        "Unable to process your request. Please try again.";

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
              Secure access to your HR management
              workspace.
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
            className="mb-8 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft size={17} />
            Back to sign in
          </button>


          <img
            src={login}
            alt="SmartHR"
            className="mb-10 h-12 w-auto"
          />


          {!submitted ? (
            <>
              <h2 className="text-[30px] font-semibold tracking-tight text-[#17233C]">
                Forgot password?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter the email address associated with
                your account and we'll send you a link to
                reset your password.
              </p>


              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
              >
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email address
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="Enter your email"
                      autoComplete="email"
                      disabled={loading}
                      className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#F28C28] focus:ring-2 focus:ring-[#F28C28]/10"
                    />
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
                      Sending...
                    </>
                  ) : (
                    "Send reset link"
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
                Check your email
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                If an account exists for{" "}
                <span className="font-medium text-slate-700">
                  {email}
                </span>
                , you will receive a password reset
                link shortly.
              </p>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-7 h-12 w-full rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to sign in
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


export default ForgotPassword;