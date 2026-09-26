import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import login from "../assets/images/logo.png";
import loginBg from "../assets/images/Login_bg.png";
import { loginUser } from "../services/loginAPI";
import { useAuth } from "../context/AuthContext";
import { COMPANY_NAME } from "../config/company";

const inputClass =
  "h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-[#F28C28] focus:ring-2 focus:ring-[#F28C28]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

// Reassuring, MNC-style copy — a failed login never says "wrong domain" or
// "invalid email"; it quietly points a new employee toward the right path
// without making them feel like something is broken.
const LOGIN_FAILED_MESSAGE =
  "We couldn't sign you in with that email and password. If you're new and don't have your company email yet, use the personal email HR registered for you.";

const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ============================================================
  // INPUT CHANGE
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================================
  // LOGIN
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate login requests
    if (loading) {
      return;
    }

    const email = formData.email.trim();
    const password = formData.password;

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------
    if (!email) {
      toast.error("Please enter your email address", {
        toastId: "login-validation",
      });
      return;
    }

    if (!password) {
      toast.error("Please enter your password", {
        toastId: "login-validation",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await loginUser(email, password);

      const data =
        response?.data?.data ||
        response?.data ||
        response;

      if (!data?.accessToken) {
        throw new Error("Authentication token was not received");
      }

      // Stores tokens AND updates AuthContext, so Navbar/Profile see the
      // user immediately without making their own /auth/me calls.
      await authLogin(data);

      toast.success("Login successful");

      navigate("/profile", {
        replace: true,
      });
    } catch (error) {
      // 401/400 covers both "wrong password" and "email not recognized"
      // (company domain rejected, or personal email not yet registered)
      // — the reassuring message fits both without sounding alarming.
      const status = error?.response?.status;

      const message =
        status === 401 || status === 400
          ? error?.response?.data?.message || LOGIN_FAILED_MESSAGE
          : error?.response?.data?.message ||
            error?.message ||
            "Unable to sign in. Please try again.";

      toast.error(message, { toastId: "login-error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">

        {/* LEFT SIDE — existing image only */}
        <div className="relative hidden min-h-screen lg:block">
          <img
            src={loginBg}
            alt="SmartHR"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="flex min-h-screen items-center justify-center bg-white px-5 py-10 sm:px-8 lg:px-10 xl:px-16">
          <div className="flex w-full max-w-[410px] flex-col items-center">

            {/* LOGO */}
            <div className="mb-9 flex w-full justify-center">
              <img
                src={login}
                alt="Technovatic Solutions"
                className="h-auto max-h-14 w-auto max-w-[160px] object-contain"
              />
            </div>

            {/* HEADING */}
            <div className="mb-8 w-full text-center">
              <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-[#17233C] sm:text-[32px]">
                Welcome back
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in to your {COMPANY_NAME} account.
              </p>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="w-full space-y-5"
              noValidate
            >
              {/* EMAIL */}
              <div className="w-full">
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Work email
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    strokeWidth={1.8}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    placeholder="name@bytesbrick.com"
                    disabled={loading}
                    className={inputClass}
                  />
                </div>

                {/* Quiet, always-visible hint — never an error state, so a
                    new employee never feels like they've done something
                    wrong just by being new. */}
                <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-slate-400">
                  <UserPlus
                    size={14}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  New employee without a company email yet? Sign in with
                  the personal email HR registered for you.
                </p>
              </div>

              {/* PASSWORD */}
              <div className="w-full">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    disabled={loading}
                    className="shrink-0 text-sm font-medium text-[#F28C28] transition-colors hover:text-[#D87516] focus:outline-none focus:ring-2 focus:ring-[#F28C28]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <Lock
                    size={18}
                    strokeWidth={1.8}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    disabled={loading}
                    className={`${inputClass} pr-12`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={loading}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff size={18} strokeWidth={1.8} />
                    ) : (
                      <Eye size={18} strokeWidth={1.8} />
                    )}
                  </button>
                </div>
              </div>

              {/* SIGN IN */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#F28C28] px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#E17E1C] hover:shadow focus:outline-none focus:ring-2 focus:ring-[#F28C28]/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            {/* FOOTER */}
            <div className="mt-9 w-full">
              <p className="text-center text-xs leading-5 text-slate-400">
                © {new Date().getFullYear()} SmartHR.{" "}
                All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;