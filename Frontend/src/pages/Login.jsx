import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiAlertCircle,
  FiArrowRight,
  FiMapPin,
  FiCheckCircle,
} from "react-icons/fi";

import { useAuth } from "../context/useAuth";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setError("");
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(formData.email.trim(), formData.password);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your email and password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ─────────────── LEFT: Branding panel (hidden on mobile) ─────────────── */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 lg:flex lg:w-[45%] xl:w-1/2">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
          {/* Logo */}
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

          {/* Center: heading + features */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold leading-tight text-white xl:text-4xl">
                Manage your land
                <br />
                the smarter way.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/80 xl:text-base">
                Buy, sell, and rent land properties. Connect with owners.
                Everything in one place.
              </p>
            </div>

            <ul className="space-y-3">
              {[
                "List properties in minutes",
                "Chat with owners securely",
                "Buy, sell or rent — your way",
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

          {/* Footer */}
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} LandManage. All rights reserved.
          </p>
        </div>
      </div>

      {/* ─────────────── RIGHT: Form ─────────────── */}
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
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Sign in to your LandManage account
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
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
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-900 dark:focus:ring-green-900/40"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-green-600 transition hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                >
                  Forgot?
                </Link>
              </div>
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
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-900 dark:focus:ring-green-900/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
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
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-600 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <FiLoader size={17} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <FiArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-gray-50 px-3 text-gray-400 dark:bg-gray-950 dark:text-gray-500">
                New to LandManage?
              </span>
            </div>
          </div>

          {/* Register link */}
          <Link
            to="/register"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-green-700 dark:hover:bg-green-900/20 dark:hover:text-green-400"
          >
            Create an account
          </Link>

          {/* Footer */}
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

export default Login;