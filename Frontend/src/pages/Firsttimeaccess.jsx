import React, { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import logo from "../assets/images/logo.png";
import loginBg from "../assets/images/Login_bg.png";
import { requestFirstTimeAccess } from "../services/loginAPI";
import {
  COMPANY_EMAIL_DOMAIN,
  COMPANY_NAME,
  isCompanyEmail,
} from "../config/company";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FirstTimeAccess = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inlineError, setInlineError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    const value = email.trim();

    if (!value) {
      setInlineError("Please enter the email address registered with HR.");
      return;
    }

    if (!EMAIL_PATTERN.test(value)) {
      setInlineError("Please enter a valid email address.");
      return;
    }

    // Someone with a company email doesn't need this flow.
    if (COMPANY_EMAIL_DOMAIN && isCompanyEmail(value)) {
      setInlineError(
        `That is already a ${COMPANY_NAME} email. Please sign in with it on the sign-in page.`
      );
      return;
    }

    try {
      setLoading(true);
      setInlineError("");

      await requestFirstTimeAccess(value);

      // Same screen whether or not the email is registered.
      setSubmitted(true);
    } catch (error) {
      if (error?.response?.status === 429) {
        toast.error("Too many attempts. Please try again in a few minutes.", {
          toastId: "first-time-access-error",
        });
      } else {
        toast.error(
          error?.response?.data?.message ||
            "Unable to process your request. Please try again.",
          { toastId: "first-time-access-error" }
        );
      }
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
          <div className="w-full max-w-[410px]">

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mb-8 flex items-center gap-2 rounded-md text-sm font-medium text-slate-500 transition hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <ArrowLeft size={17} />
              Back to sign in
            </button>

            <img
              src={logo}
              alt="Technovatic Solutions"
              className="mb-9 h-auto max-h-14 w-auto max-w-[160px] object-contain"
            />

            {!submitted ? (
              <>
                <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-[#17233C]">
                  First-Time Employee Access
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Don&apos;t have your {COMPANY_NAME} company email yet?
                  Enter the email address registered with HR and we&apos;ll
                  send you a secure link to set up your access.
                </p>

                <form
                  onSubmit={handleSubmit}
                  className="mt-8 space-y-5"
                  noValidate
                >
                  <div>
                    <label
                      htmlFor="first-time-email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Personal / alternate email
                    </label>

                    <div className="relative">
                      <Mail
                        size={18}
                        strokeWidth={1.8}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="first-time-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (inlineError) setInlineError("");
                        }}
                        placeholder="name@example.com"
                        autoComplete="email"
                        disabled={loading}
                        aria-invalid={!!inlineError}
                        aria-describedby={
                          inlineError ? "first-time-error" : undefined
                        }
                        className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-[#F28C28] focus:ring-2 focus:ring-[#F28C28]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </div>

                    {inlineError && (
                      <div
                        id="first-time-error"
                        role="alert"
                        className="mt-3 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800"
                      >
                        <AlertCircle
                          size={18}
                          className="mt-0.5 shrink-0"
                        />
                        <p>{inlineError}</p>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#F28C28] px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#E17E1C] hover:shadow focus:outline-none focus:ring-2 focus:ring-[#F28C28]/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      "Send access link"
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                  <CheckCircle2 size={28} className="text-green-600" />
                </div>

                <h1 className="mt-6 text-[30px] font-semibold leading-tight tracking-tight text-[#17233C]">
                  Check your email
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  If{" "}
                  <span className="font-medium text-slate-700">
                    {email.trim()}
                  </span>{" "}
                  is registered with HR, we&apos;ve sent a secure link to
                  it. Use the link to set up your access.
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  No email after a few minutes? Contact your HR/Admin team
                  to confirm the email address they have on file.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="mt-7 h-12 w-full rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  Back to sign in
                </button>
              </div>
            )}

            <p className="mt-10 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} SmartHR. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstTimeAccess;