import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiAlertCircle,
  FiShield,
  FiCheck,
  FiMapPin,
} from "react-icons/fi";

import { useAuth } from "../context/useAuth";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(formData.email.trim(), formData.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ================================================================ */}
      {/* LEFT — Brand panel (hidden on mobile)                             */}
      {/* ================================================================ */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-green-700 via-green-600 to-emerald-700 lg:flex lg:w-[45%] xl:w-1/2">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />

        {/* Subtle pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25">
              <FiShield size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                LandManage
              </h1>
              <p className="text-[11px] text-white/80">Admin Panel</p>
            </div>
          </div>

          {/* Center content */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold leading-tight text-white xl:text-4xl">
                Admin Control Center
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/85 xl:text-base">
                Manage users, properties, listings, and support tickets — all
                from one place.
              </p>
            </div>

            <ul className="space-y-3">
              {[
                "Full access to platform data",
                "Manage users & land listings",
                "Track support tickets",
                "Monitor real-time activity",
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 text-sm text-white/95"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
                    <FiCheck size={12} className="text-white" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <p className="text-xs text-white/70">
            © {new Date().getFullYear()} LandManage. All rights reserved.
          </p>
        </div>
      </div>

      {/* ================================================================ */}
      {/* RIGHT — Login form                                                */}
      {/* ================================================================ */}
      <div className="flex w-full flex-1 items-center justify-center bg-slate-50 px-4 py-10 sm:px-8 lg:w-1/2 lg:px-12 xl:px-20">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 text-white shadow-md">
                <FiShield size={22} />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-gray-900">
                  LandManage
                </h1>
                <p className="text-[11px] text-gray-500">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              <FiShield size={12} />
              Admin Access
            </div>

            <h2 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
              Sign in to your account
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Enter your admin credentials to continue
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="relative">
                <FiMail
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@landmanage.app"
                  autoComplete="email"
                  required
                  className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <FiLock
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-11 pr-12 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <FiLoader size={17} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <FiShield size={16} />
                  Sign in as Admin
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <FiMapPin size={13} />
              <span>Land Management System · v1.0</span>
            </div>

            <a
              href="https://land-management-zj14.onrender.com/login"
              className="text-xs font-medium text-green-600 transition hover:text-green-700"
            >
              Not an admin? Go to main site →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
