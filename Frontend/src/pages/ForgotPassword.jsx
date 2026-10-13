import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiPhone,
  FiLock,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiAlertCircle,
  FiArrowRight,
  FiMapPin,
  FiCheckCircle,
  FiCheck,
  FiShield,
  FiChevronDown,
  FiArrowLeft,
} from "react-icons/fi";

import api from "../services/api";

/* ------------------------------------------------------------------ */
/*  Countries                                                          */
/* ------------------------------------------------------------------ */

const COUNTRIES = [
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾" },
  { code: "NZ", name: "New Zealand", dial: "+64", flag: "🇳🇿" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "QA", name: "Qatar", dial: "+974", flag: "🇶🇦" },
  { code: "KW", name: "Kuwait", dial: "+965", flag: "🇰🇼" },
  { code: "OM", name: "Oman", dial: "+968", flag: "🇴🇲" },
  { code: "BH", name: "Bahrain", dial: "+973", flag: "🇧🇭" },
  { code: "NP", name: "Nepal", dial: "+977", flag: "🇳🇵" },
  { code: "BD", name: "Bangladesh", dial: "+880", flag: "🇧🇩" },
  { code: "LK", name: "Sri Lanka", dial: "+94", flag: "🇱🇰" },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰" },
  { code: "CN", name: "China", dial: "+86", flag: "🇨🇳" },
  { code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "IT", name: "Italy", dial: "+39", flag: "🇮🇹" },
  { code: "ES", name: "Spain", dial: "+34", flag: "🇪🇸" },
  { code: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const normalizePhone = (raw, dialCode = "+91") => {
  if (!raw) return "";
  let digits = String(raw).replace(/\D/g, "");
  const dialDigits = String(dialCode).replace(/\D/g, "");
  if (digits.startsWith(dialDigits) && digits.length > dialDigits.length + 4) {
    digits = digits.slice(dialDigits.length);
  }
  if (dialCode === "+91") {
    return digits.length > 10 ? digits.slice(-10) : digits;
  }
  return digits;
};

const validatePhone = (raw, dialCode) => {
  const digits = normalizePhone(raw, dialCode);
  if (dialCode === "+91") return digits.length === 10;
  return digits.length >= 6 && digits.length <= 15;
};

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "", text: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2)
    return {
      score,
      label: "Weak",
      color: "bg-red-500",
      text: "text-red-600 dark:text-red-400",
    };
  if (score === 3)
    return {
      score,
      label: "Fair",
      color: "bg-yellow-500",
      text: "text-yellow-600 dark:text-yellow-400",
    };
  if (score === 4)
    return {
      score,
      label: "Good",
      color: "bg-blue-500",
      text: "text-blue-600 dark:text-blue-400",
    };
  return {
    score,
    label: "Strong",
    color: "bg-green-500",
    text: "text-green-600 dark:text-green-400",
  };
};

/* ------------------------------------------------------------------ */
/*  Country dropdown                                                   */
/* ------------------------------------------------------------------ */

const CountryDropdown = ({ selected, onSelect, disabled }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative shrink-0" ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 items-center gap-1.5 rounded-l-2xl border border-r-0 border-gray-200 bg-gray-100 px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="text-sm">{selected.dial}</span>
        <FiChevronDown
          size={14}
          className={`text-gray-400 transition-transform dark:text-gray-500 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 max-h-64 w-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                onSelect(c);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                c.code === selected.code
                  ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <span className="text-lg leading-none">{c.flag}</span>
              <span className="flex-1 truncate">{c.name}</span>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {c.dial}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  OTP input (6 boxes)                                                */
/* ------------------------------------------------------------------ */

const OtpInput = ({ value, onChange, disabled, error }) => {
  const inputsRef = useRef([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

  const handleChange = (index, char) => {
    const clean = char.replace(/\D/g, "");
    if (!clean) return;

    const next = digits.slice();
    const chars = clean.split("");
    for (let i = 0; i < chars.length && index + i < 6; i++) {
      next[index + i] = chars[i];
    }
    onChange(next.join("").slice(0, 6));

    const focusIndex = Math.min(index + chars.length, 5);
    inputsRef.current[focusIndex]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = digits.slice();
      if (next[index]) {
        next[index] = "";
      } else if (index > 0) {
        next[index - 1] = "";
        inputsRef.current[index - 1]?.focus();
      }
      onChange(next.join(""));
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (index, e) => {
    const text = (e.clipboardData || window.clipboardData).getData("text");
    const clean = text.replace(/\D/g, "").slice(0, 6 - index);
    if (!clean) return;
    e.preventDefault();
    const next = digits.slice();
    for (let i = 0; i < clean.length; i++) {
      next[index + i] = clean[i];
    }
    onChange(next.join("").slice(0, 6));
    const focusIndex = Math.min(index + clean.length, 5);
    inputsRef.current[focusIndex]?.focus();
  };

  return (
    <div className="flex justify-between gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          disabled={disabled}
          autoComplete="one-time-code"
          className={`h-14 w-full rounded-2xl border text-center text-lg font-bold text-gray-900 outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white dark:focus:bg-gray-900 ${
            error
              ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100 dark:border-red-800 dark:bg-red-900/30 dark:focus:ring-red-900/40"
              : "border-gray-200 bg-gray-50 focus:border-green-500 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-green-900/40"
          }`}
        />
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState("phone"); // "phone" | "otp" | "password"

  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState(
    COUNTRIES.find((c) => c.code === "IN") || COUNTRIES[0],
  );

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  /* Resend countdown */
  const [resendCountdown, setResendCountdown] = useState(0);
  const timerRef = useRef(null);

  const passwordStrength = useMemo(
    () => getPasswordStrength(newPassword),
    [newPassword],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startResendTimer = () => {
    setResendCountdown(10);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearFieldError = (name) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  /* -------- Step 1: request OTP -------- */
  const handleRequestOtp = async (e) => {
    e?.preventDefault();

    if (!phone.trim()) {
      setFieldErrors({ phone: "Phone number is required." });
      setError("Please enter your phone number.");
      return;
    }

    if (!validatePhone(phone, country.dial)) {
      setFieldErrors({
        phone:
          country.dial === "+91"
            ? "Enter a valid 10-digit phone number."
            : "Enter a valid phone number.",
      });
      setError("Please enter a valid phone number.");
      return;
    }

    setFieldErrors({});
    setError("");
    setSendingOtp(true);

    try {
      const fullPhone = `${country.dial}${normalizePhone(phone, country.dial)}`;

      const res = await api.post("/users/request-password-reset", {
        phone: fullPhone,
      });

      if (res.data?.success) {
        setStep("otp");
        startResendTimer();

        // Dev helper — if the backend returns devOtp, log it
        if (res.data?.devOtp) {
          console.log("DEV OTP:", res.data.devOtp);
        }
      } else {
        setError(res.data?.message || "Failed to send OTP.");
      }
    } catch (err) {
      console.error("Request OTP error:", err);
      setError(
        err.response?.data?.message || "Failed to send OTP. Please try again.",
      );
    } finally {
      setSendingOtp(false);
    }
  };

  /* -------- Resend OTP -------- */
  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;

    setOtp("");
    setOtpError("");
    startResendTimer();

    try {
      const fullPhone = `${country.dial}${normalizePhone(phone, country.dial)}`;
      await api.post("/users/request-password-reset", { phone: fullPhone });
    } catch (err) {
      console.error("Resend OTP error:", err);
    }
  };

  /* -------- Step 2: OTP → password -------- */
  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      setOtpError("Please enter the 6-digit code.");
      return;
    }

    setOtpError("");
    setStep("password");
  };

  /* -------- Step 3: reset password -------- */
  const handleResetPassword = async (e) => {
    e.preventDefault();

    const errors = {};

    if (!newPassword) {
      errors.newPassword = "Password is required.";
    } else if (newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters.";
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setError("");
    setLoading(true);

    try {
      const fullPhone = `${country.dial}${normalizePhone(phone, country.dial)}`;

      const res = await api.post("/users/reset-password", {
        phone: fullPhone,
        otp,
        newPassword,
      });

      if (res.data?.success) {
        navigate("/login", {
          state: { resetSuccess: true },
        });
      } else {
        setError(res.data?.message || "Failed to reset password.");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to reset password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (name) => {
    const hasError = fieldErrors[name];
    return `h-12 w-full rounded-2xl border bg-gray-50 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-4 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-900 ${
      hasError
        ? "border-red-300 focus:border-red-500 focus:ring-red-100 dark:border-red-800 dark:bg-red-900/20 dark:focus:ring-red-900/40"
        : "border-gray-200 focus:border-green-500 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-green-900/40"
    }`;
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ───────── LEFT: Branding ───────── */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 lg:flex lg:w-[45%] xl:w-1/2">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />

        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
          <Link to="/login" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
              <FiMapPin size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                Land
                <span className="text-emerald-300">Manage</span>
              </h1>
              <p className="text-[11px] text-white/70">
                Land Management System
              </p>
            </div>
          </Link>

          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold leading-tight text-white xl:text-4xl">
                Forgot your
                <br />
                password?
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/80 xl:text-base">
                No worries. Verify your phone number and set a new one in a few
                seconds.
              </p>
            </div>

            <ul className="space-y-3">
              {[
                "Verify with a 6-digit OTP",
                "Set a new secure password",
                "Back to your land in seconds",
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 text-sm text-white/90"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                    <FiCheckCircle size={13} className="text-white" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} LandManage. All rights reserved.
          </p>
        </div>
      </div>

      {/* ───────── RIGHT: Form ───────── */}
      <div className="flex w-full flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:w-1/2 lg:px-12 xl:px-20">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm">
                <FiMapPin size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                  Land
                  <span className="text-green-600 dark:text-green-500">
                    Manage
                  </span>
                </h1>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Land Management System
                </p>
              </div>
            </div>
          </div>

          {/* Back to login */}
          <Link
            to="/login"
            className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-gray-500 transition hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
          >
            <FiArrowLeft size={14} />
            Back to login
          </Link>

          {/* Heading */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
              {step === "phone" && "Reset your password"}
              {step === "otp" && "Enter the OTP"}
              {step === "password" && "Set a new password"}
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {step === "phone" &&
                "Enter your registered phone number to receive an OTP"}
              {step === "otp" &&
                `We sent a 6-digit code to ${country.dial}${normalizePhone(
                  phone,
                  country.dial,
                )}`}
              {step === "password" &&
                "Choose a strong password to protect your account"}
            </p>
          </div>

          {/* Progress indicator */}
          <div className="mt-6 flex items-center gap-2">
            {["phone", "otp", "password"].map((s, i) => {
              const idx = ["phone", "otp", "password"].indexOf(step);
              const active = i <= idx;
              return (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition ${
                    active ? "bg-green-600" : "bg-gray-200 dark:bg-gray-800"
                  }`}
                />
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
              <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ─────── STEP 1: Phone ─────── */}
          {step === "phone" && (
            <form onSubmit={handleRequestOtp} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Phone number
                </label>
                <div className="flex">
                  <CountryDropdown
                    selected={country}
                    onSelect={setCountry}
                    disabled={sendingOtp}
                  />
                  <div className="relative flex-1">
                    <FiPhone
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    />
                    <input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/[^0-9]/g, ""));
                        clearFieldError("phone");
                        setError("");
                      }}
                      placeholder="9876543210"
                      maxLength={15}
                      required
                      autoComplete="tel"
                      className={`${inputClass("phone")} rounded-l-none border-l-0`}
                    />
                  </div>
                </div>
                {fieldErrors.phone && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={sendingOtp}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-600 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendingOtp ? (
                  <>
                    <FiLoader size={17} className="animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <FiShield size={16} />
                    Get OTP
                    <FiArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ─────── STEP 2: OTP ─────── */}
          {step === "otp" && (
            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enter OTP
                </label>
                <OtpInput
                  value={otp}
                  onChange={(v) => {
                    setOtp(v);
                    setOtpError("");
                  }}
                  disabled={false}
                  error={!!otpError}
                />
                {otpError && (
                  <p className="mt-2 text-xs text-red-500 dark:text-red-400">
                    {otpError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                    setOtpError("");
                  }}
                  className="font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ← Change number
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0}
                  className={`font-semibold transition ${
                    resendCountdown > 0
                      ? "cursor-not-allowed text-gray-400 dark:text-gray-500"
                      : "text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                  }`}
                >
                  {resendCountdown > 0
                    ? `Resend in ${resendCountdown}s`
                    : "Resend OTP"}
                </button>
              </div>

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-600 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiCheck size={16} />
                Verify OTP
              </button>
            </div>
          )}

          {/* ─────── STEP 3: New password ─────── */}
          {step === "password" && (
            <form onSubmit={handleResetPassword} className="mt-6 space-y-5">
              <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300">
                <FiCheckCircle size={16} className="shrink-0" />
                <span>OTP verified. Set your new password.</span>
              </div>

              {/* New password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  New password
                </label>
                <div className="relative">
                  <FiLock
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  />
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      clearFieldError("newPassword");
                      setError("");
                    }}
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                    autoComplete="new-password"
                    className={`${inputClass("newPassword")} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <FiEyeOff size={16} />
                    ) : (
                      <FiEye size={16} />
                    )}
                  </button>
                </div>

                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-1 gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition ${
                              level <= passwordStrength.score
                                ? passwordStrength.color
                                : "bg-gray-200 dark:bg-gray-700"
                            }`}
                          />
                        ))}
                      </div>
                      <span
                        className={`text-xs font-semibold ${passwordStrength.text}`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}

                {fieldErrors.newPassword && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {fieldErrors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <FiLock
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  />
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearFieldError("confirmPassword");
                      setError("");
                    }}
                    placeholder="Re-enter new password"
                    minLength={8}
                    required
                    autoComplete="new-password"
                    className={`${inputClass("confirmPassword")} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>

                {confirmPassword && newPassword === confirmPassword && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <FiCheck size={12} />
                    Passwords match
                  </p>
                )}
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-600 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <FiLoader size={17} className="animate-spin" />
                    Resetting password...
                  </>
                ) : (
                  <>
                    Reset password
                    <FiArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
            Remembered your password?{" "}
            <Link
              to="/login"
              className="font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
