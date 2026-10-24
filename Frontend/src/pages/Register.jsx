import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiEye,
  FiEyeOff,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
  FiCheck,
  FiX,
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
    return { score, label: "Weak", color: "bg-red-500", text: "text-red-400" };
  if (score === 3)
    return {
      score,
      label: "Fair",
      color: "bg-yellow-500",
      text: "text-yellow-400",
    };
  if (score === 4)
    return {
      score,
      label: "Good",
      color: "bg-blue-500",
      text: "text-blue-400",
    };
  return {
    score,
    label: "Strong",
    color: "bg-emerald-500",
    text: "text-emerald-400",
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
        className="flex h-11 items-center gap-1.5 rounded-l-lg border border-r-0 border-slate-200 bg-slate-100 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span>{selected.dial}</span>
        <FiChevronDown
          size={14}
          className={`text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 max-h-64 w-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
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
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="text-lg leading-none">{c.flag}</span>
              <span className="flex-1 truncate">{c.name}</span>
              <span className="text-xs font-medium text-slate-500">
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
/*  OTP input: 6 individual boxes                                      */
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
          className={`h-12 w-full rounded-lg border bg-white text-center text-lg font-semibold text-slate-800 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
            error
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : "border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"
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

  const inputClass = (name) =>
    `h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
      fieldErrors[name]
        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
        : "border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"
    }`;

  const labelClass = "mb-1.5 block text-sm font-medium text-slate-300";
  const fieldErrorClass = "mt-1 text-xs text-red-400";
  const primaryButtonClass =
    "flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="bg-[url(./assets/image.png)] bg-cover bg-center bg-no-repeat">
      <div className="flex min-h-screen items-center justify-center bg-black/70 px-4 py-0">
        <main className="w-full max-w-sm">
          <div className="rounded-2xl border border-gray-700 bg-black/50 px-7 py-8 shadow-sm">
            {/* Brand */}
            <Link
              to="/login"
              className="mb-8 block text-center text-xl font-semibold tracking-tight text-white"
            >
              <span>Land </span>
              <span className="text-emerald-600">Manage</span>
            </Link>

            <h1 className="text-center text-xl font-semibold text-white">
              Create account
            </h1>
            <p className="mt-1 text-center text-sm text-slate-500">
              {step === "form"
                ? "Get started in less than a minute."
                : step === "otp"
                  ? `Enter the 6-digit code sent to ${country.dial}${formData.phone}`
                  : "Almost there. Set a password to finish."}
            </p>

            {/* ───────── STEP 1: FORM ───────── */}
            {step === "form" && (
              <form
                onSubmit={handleGetOtp}
                className="mt-6 space-y-4"
                noValidate
              >
                {/* Full name */}
                <div>
                  <label htmlFor="fullName" className={labelClass}>
                    Full name
                  </label>
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
                  {fieldErrors.fullName && (
                    <p className={fieldErrorClass}>{fieldErrors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email
                  </label>
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
                  {fieldErrors.email && (
                    <p className={fieldErrorClass}>{fieldErrors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className={labelClass}>
                    Phone number
                  </label>
                  <div className="flex">
                    <CountryDropdown
                      selected={country}
                      onSelect={setCountry}
                      disabled={sendingOtp}
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
                      className={`${inputClass("phone")} min-w-0 flex-1 rounded-l-none`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className={fieldErrorClass}>{fieldErrors.phone}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={sendingOtp}
                  className={primaryButtonClass}
                >
                  {sendingOtp ? (
                    <>
                      <FiLoader size={16} className="animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Get OTP"
                  )}
                </button>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600"
                  >
                    <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </form>
            )}

            {/* ───────── STEP 2: OTP ───────── */}
            {step === "otp" && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className={labelClass}>Enter OTP</label>
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
                    <p className={`${fieldErrorClass} mt-2`}>{otpError}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("form");
                      setOtp("");
                      setOtpError("");
                    }}
                    className="text-slate-500 transition hover:text-emerald-600"
                  >
                    Change number
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCountdown > 0}
                    className={`transition ${
                      resendCountdown > 0
                        ? "cursor-not-allowed text-slate-500"
                        : "font-medium text-emerald-500 hover:text-emerald-400"
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
                  className={primaryButtonClass}
                >
                  Verify OTP
                </button>
              </div>
            )}

            {/* ───────── STEP 3: PASSWORD ───────── */}
            {step === "password" && (
              <form
                onSubmit={handleCreateAccount}
                className="mt-6 space-y-4"
                noValidate
              >
                {/* Verified badge */}
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-300">
                  <FiCheckCircle size={16} className="shrink-0" />
                  <span>
                    Phone verified: {country.dial}
                    {normalizePhone(formData.phone, country.dial)}
                  </span>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className={labelClass}>
                    Create password
                  </label>
                  <div className="relative">
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
                      className={`${inputClass("password")} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:text-slate-600"
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
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-1 gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition ${
                                level <= passwordStrength.score
                                  ? passwordStrength.color
                                  : "bg-white/15"
                              }`}
                            />
                          ))}
                        </div>
                        <span
                          className={`text-xs font-medium ${passwordStrength.text}`}
                        >
                          {passwordStrength.label}
                        </span>
                      </div>

                      <ul className="mt-2 space-y-0.5">
                        {[
                          {
                            ok: formData.password.length >= 8,
                            label: "8+ characters",
                          },
                          {
                            ok: /[A-Z]/.test(formData.password),
                            label: "Uppercase letter",
                          },
                          {
                            ok: /[0-9]/.test(formData.password),
                            label: "Number",
                          },
                        ].map((rule) => (
                          <li
                            key={rule.label}
                            className={`flex items-center gap-1 text-[11px] ${
                              rule.ok ? "text-emerald-400" : "text-slate-500"
                            }`}
                          >
                            {rule.ok ? (
                              <FiCheck size={11} />
                            ) : (
                              <FiX size={11} />
                            )}
                            {rule.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {fieldErrors.password && (
                    <p className={fieldErrorClass}>{fieldErrors.password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={primaryButtonClass}
                >
                  {loading ? (
                    <>
                      <FiLoader size={16} className="animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600"
                  >
                    <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </form>
            )}

            {/* Sign in link */}
            <p className="mt-6 text-center text-sm">
              <span className="text-white/50">Already have an account? </span>
              <Link
                to="/login"
                className="font-medium text-white hover:text-emerald-400"
              >
                Sign in
              </Link>
            </p>
          </div>

       
        </main>
      </div>
    </div>
  );
};

export default Register;
