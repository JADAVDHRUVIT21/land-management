import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiLoader, FiAlertCircle } from "react-icons/fi";

import { useAuth } from "../context/useAuth";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
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

  const inputClass =
    "h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

  return (
    <div className=" bg-[url(./assets/image.png)] bg-cover bg-center bg-no-repeat">
      <div className="flex min-h-screen items-center justify-center  px-4 py-10 bg-black/70">
        <main className="w-full max-w-sm">
          {/* Brand */}

          <div className="rounded-2xl border border-gray-700 bg-black/50 px-7 py-8 shadow-sm">
            <Link
              to="/login"
              className="mb-8 block text-center text-xl  font-semibold tracking-tight "
            >
              <span className="">Land </span>
              <span className="text-emerald-600">Manage</span>
            </Link>

            <h1 className="text-xl font-semibold text-center">Sign in</h1>
            <p className="mt-1 text-sm text-slate-500 text-center">
              Welcome back. Enter your details to continue.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-slate-600"
                >
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
                  className={inputClass}
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-600"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-slate-500 transition hover:text-emerald-600"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className={`${inputClass} pr-11`}
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
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <FiLoader size={16} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
              {error && (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600"
                >
                  <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </form>
            <p className="mt-6 text-center text-sm">
              <span className="text-white/50">
                Don&apos;t have an account?{" "}
              </span>
              <Link
                to="/register"
                className="font-medium text-emerald-600 text-white hover:text-emerald-700"
              >
                Create one
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;
