import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
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
  FiX,
  FiShield,
  FiChevronDown,
} from "react-icons/fi";

import { useAuth } from "../context/useAuth";

/* ------------------------------------------------------------------ */
/*  Countries list (dial codes)                                        */
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
/*  Validation helpers                                                 */
/* ------------------------------------------------------------------ */

const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());

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
/*  OTP input — 6 individual boxes                                     */
/* ------------------------------------------------------------------ */

const OtpInput = ({ value, onChange, disabled, error }) => {
  const inputsRef = useRef([]);

  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

  const handleChange = (index, char) => {
    const clean = char.replace(/\D/g, "");
    if (!clean) return;

    // Handle paste of multiple digits
    const next = digits.slice();
    const chars = clean.split("");
    for (let i = 0; i < chars.length && index + i < 6; i++) {
      next[index + i] = chars[i];
    }
    const merged = next.join("");
    onChange(merged.slice(0, 6));

    // Move focus to next empty box
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

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });

  const [country, setCountry] = useState(
    COUNTRIES.find((c) => c.code === "IN") || COUNTRIES[0],
  );

  const [step, setStep] = useState("form"); // "form" | "otp" | "password"
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  /* Resend timer */
  const [resendCountdown, setResendCountdown] = useState(0);
  const timerRef = useRef(null);

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password],
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setError("");
    clearFieldError(name);

    if (name === "phone") {
      const cleaned = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, phone: cleaned }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* -------- Step 1: validate form + request OTP -------- */
  const handleGetOtp = async (e) => {
    e?.preventDefault();

    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required.";
    } else if (formData.fullName.trim().length < 3) {
      errors.fullName = "Name must be at least 3 characters.";
    } else if (formData.fullName.trim().length > 50) {
      errors.fullName = "Name must be under 50 characters.";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required.";
    } else if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!validatePhone(formData.phone, country.dial)) {
      errors.phone =
        country.dial === "+91"
          ? "Enter a valid 10-digit phone number."
          : "Enter a valid phone number.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the highlighted fields.");
      return;
    }

    setFieldErrors({});
    setError("");
    setSendingOtp(true);

    // Simulate API call (replace with real OTP send later)
    setTimeout(() => {
      setSendingOtp(false);
      setStep("otp");
      startResendTimer();
    }, 800);
  };

  /* -------- Resend OTP -------- */
  const handleResendOtp = () => {
    if (resendCountdown > 0) return;

    setOtp("");
    setOtpError("");
    startResendTimer();

    // Simulate API call
    setTimeout(() => {
      // success
    }, 500);
  };

  /* -------- Step 2: verify OTP -> show password -------- */
  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      setOtpError("Please enter the 6-digit code.");
      return;
    }

    setOtpError("");
    setStep("password");

    // Focus password field after transition
    setTimeout(() => {
      document.getElementById("password")?.focus();
    }, 100);
  };

  /* -------- Step 3: create account -------- */
  const handleCreateAccount = async (e) => {
    e.preventDefault();

    if (!formData.password) {
      setFieldErrors({ password: "Password is required." });
      return;
    }
    if (formData.password.length < 8) {
      setFieldErrors({ password: "Password must be at least 8 characters." });
      return;
    }

    setFieldErrors({});
    setError("");
    setLoading(true);

    try {
      const fullPhone = `${country.dial}${normalizePhone(
        formData.phone,
        country.dial,
      )}`;

      await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: fullPhone,
        password: formData.password,
      });

      navigate("/login", {
        state: {
          registered: true,
          email: formData.email.trim().toLowerCase(),
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
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
      {/* ─────────── LEFT: Branding panel ─────────── */}
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
                Start managing
                <br />
                your land today.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/80 xl:text-base">
                Create a free account and list, browse, or rent land properties
                in minutes.
              </p>
            </div>

            <ul className="space-y-3">
              {[
                "Free to get started",
                "No credit card required",
                "Your data stays private",
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

      {/* ─────────── RIGHT: Form ─────────── */}
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

          {/* Heading */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {step === "form"
                ? "Get started with LandManage in less than a minute"
                : step === "otp"
                  ? `Enter the 6-digit code sent to ${country.dial}${formData.phone}`
                  : "Almost there — set a password to finish"}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
              <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ───────── STEP 1: FORM ───────── */}
          {step === "form" && (
            <form onSubmit={handleGetOtp} className="mt-8 space-y-5">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Full name
                </label>
                <div className="relative">
                  <FiUser
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Dhruvit Jadav"
                    maxLength={50}
                    required
                    autoComplete="name"
                    className={inputClass("fullName")}
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {fieldErrors.fullName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email address
                </label>
                <div className="relative">
                  <FiMail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className={inputClass("email")}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Phone (with country dropdown) */}
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
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      value={formData.phone}
                      onChange={handleChange}
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

              {/* Get OTP button */}
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

          {/* ───────── STEP 2: OTP ───────── */}
          {step === "otp" && (
            <div className="mt-8 space-y-5">
              {/* OTP boxes */}
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

              {/* Resend + change number */}
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
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

              {/* Verify button */}
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

          {/* ───────── STEP 3: PASSWORD ───────── */}
          {step === "password" && (
            <form onSubmit={handleCreateAccount} className="mt-8 space-y-5">
              {/* Verified badge */}
              <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300">
                <FiCheckCircle size={16} className="shrink-0" />
                <span>
                  Phone verified: {country.dial}
                  {normalizePhone(formData.phone, country.dial)}
                </span>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Create password
                </label>
                <div className="relative">
                  <FiLock
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className={`${inputClass("password")} pr-12`}
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

                {/* Strength meter */}
                {formData.password && (
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

                    <ul className="mt-2 space-y-0.5">
                      {[
                        {
                          ok: formData.password.length >= 8,
                          label: "8+ chars",
                        },
                        {
                          ok: /[A-Z]/.test(formData.password),
                          label: "Uppercase",
                        },
                        {
                          ok: /[0-9]/.test(formData.password),
                          label: "Number",
                        },
                      ].map((rule) => (
                        <li
                          key={rule.label}
                          className={`flex items-center gap-1 text-[11px] ${
                            rule.ok
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                        >
                          {rule.ok ? <FiCheck size={11} /> : <FiX size={11} />}
                          {rule.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Create account button */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-600 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <FiLoader size={17} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <FiArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider + Login link (only on step 1) */}
          {step === "form" && (
            <>
              <div className="relative my-7">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-gray-50 px-3 text-gray-400 dark:bg-gray-950 dark:text-gray-500">
                    Already have an account?
                  </span>
                </div>
              </div>

              <Link
                to="/login"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-green-700 dark:hover:bg-green-900/20 dark:hover:text-green-400"
              >
                Sign in to existing account
              </Link>
            </>
          )}

          <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
            By continuing, you agree to our{" "}
            <Link
              to="/terms"
              className="font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Terms
            </Link>{" "}
            &{" "}
            <Link
              to="/privacy"
              className="font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
