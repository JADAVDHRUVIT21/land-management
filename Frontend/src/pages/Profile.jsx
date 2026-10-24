import { useEffect, useRef, useState } from "react";
import {
  FiMail,
  FiPhone,
  FiShield,
  FiUser,
  FiRefreshCw,
  FiEdit3,
  FiX,
  FiCheck,
  FiCamera,
  FiImage,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiSun,
  FiMoon,
  FiMonitor,
  FiKey,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { useTheme } from "../context/useTheme";

/* ================================================================== */
/*  iOS-style Confirm Dialog                                          */
/* ================================================================== */

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-gray-800/95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400">
            <FiLock size={24} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
            {message}
          </p>
        </div>

        <div className="mt-6 flex gap-2 border-t border-gray-100 p-3 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-11 flex-1 rounded-2xl bg-gray-100 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white transition disabled:opacity-60 ${
              confirmLabel.toLowerCase().includes("remove")
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <FiCheck size={15} />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  iOS-style Toast                                                   */
/* ================================================================== */

const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3200);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
      : "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[10000] flex justify-center px-4">
      <div
        className={`pointer-events-auto flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg ${styles}`}
      >
        {type === "error" ? <FiAlertCircle size={16} /> : <FiCheck size={16} />}
        <span>{message}</span>
        <button type="button" onClick={onClose} className="ml-2 shrink-0">
          <FiX size={16} />
        </button>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  Password field with show/hide toggle                              */
/* ================================================================== */

const PasswordField = ({
  label,
  value,
  onChange,
  placeholder,
  autoComplete = "new-password",
}) => {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-900 dark:focus:ring-green-900/40"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
        </button>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  Theme Toggle (iOS-style segmented control)                        */
/* ================================================================== */

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "light", label: "Light", icon: FiSun },
    { value: "dark", label: "Dark", icon: FiMoon },
    { value: "system", label: "System", icon: FiMonitor },
  ];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
          <FiSun size={20} />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Appearance
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Choose how LandManage looks on your device
          </p>
        </div>
      </div>

      {/* Segmented control */}
      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.value;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-xs font-semibold transition sm:flex-row sm:gap-2 sm:py-2.5 ${
                isActive
                  ? "bg-white text-green-700 shadow-sm dark:bg-gray-900 dark:text-green-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <Icon size={16} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Hint */}
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {theme === "system"
          ? "Following your device's system preference."
          : theme === "dark"
            ? "Dark mode is always on."
            : "Light mode is always on."}
      </p>
    </section>
  );
};

/* ================================================================== */
/*  App Lock (PIN) Setup Section                                      */
/* ================================================================== */

const AppLockSection = ({ showToast }) => {
  // ✅ FIX: Initialize state directly from localStorage. No useEffect needed!
  const [hasPin, setHasPin] = useState(() => {
    return typeof window !== "undefined" && !!localStorage.getItem("app_pin");
  });

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");

  // State for remove PIN confirmation dialog
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);

  const handleSavePin = () => {
    setPinError("");

    if (newPin.length !== 4 && newPin.length !== 6) {
      setPinError("PIN must be exactly 4 or 6 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("PINs do not match.");
      return;
    }

    localStorage.setItem("app_pin", newPin);
    setHasPin(true);
    setPinModalOpen(false);
    setNewPin("");
    setConfirmPin("");
    showToast("App PIN set successfully.", "success");
  };

  const handleRemovePinClick = () => {
    setRemoveConfirmOpen(true);
  };

  const confirmRemovePin = () => {
    localStorage.removeItem("app_pin");
    setHasPin(false);
    setRemoveConfirmOpen(false);
    showToast("App PIN removed.", "success");
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400">
          <FiKey size={20} />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            App Lock (PIN)
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Secure your app with a 4 or 6-digit PIN
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {hasPin ? "PIN is currently enabled" : "PIN is not set"}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {hasPin
              ? "You will be asked to enter your PIN when you open the app."
              : "Set a PIN to prevent unauthorized access."}
          </p>
        </div>

        <div className="flex gap-2">
          {hasPin && (
            <button
              type="button"
              onClick={handleRemovePinClick}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
            >
              Remove PIN
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setNewPin("");
              setConfirmPin("");
              setPinError("");
              setPinModalOpen(true);
            }}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            {hasPin ? "Change PIN" : "Set PIN"}
          </button>
        </div>
      </div>

      {/* Set PIN Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Set App PIN
              </h3>
              <button
                type="button"
                onClick={() => setPinModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6">
              {pinError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                  {pinError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    New PIN (4 or 6 digits)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) =>
                      setNewPin(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Enter PIN"
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-center text-lg tracking-widest text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Confirm PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) =>
                      setConfirmPin(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Confirm PIN"
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-center text-lg tracking-widest text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-900"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSavePin}
                className="mt-6 flex h-11 w-full items-center justify-center rounded-2xl bg-green-600 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Save PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Removing PIN */}
      <ConfirmDialog
        open={removeConfirmOpen}
        title="Remove App PIN?"
        message="Are you sure you want to remove your PIN? This will allow anyone with access to your device to open the app without entering a PIN."
        confirmLabel="Yes, Remove"
        cancelLabel="Cancel"
        onConfirm={confirmRemovePin}
        onCancel={() => setRemoveConfirmOpen(false)}
      />
    </section>
  );
};

/* ================================================================== */
/*  Main Component                                                    */
/* ================================================================== */

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /* Edit profile modal state */
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editName, setEditName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  /* Password change state */
  const [pwOld, setPwOld] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwConfirmOpen, setPwConfirmOpen] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  /* Toast */
  const [toast, setToast] = useState(null);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  /* -------------------------------------------------------------- */
  /*  Load profile                                                   */
  /* -------------------------------------------------------------- */

  const loadProfile = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);

      const response = await api.get("/users/profile");

      if (response.data?.success) {
        setProfile(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      } else {
        setError(response.data?.message || "Failed to load profile.");
      }

      setError("");
    } catch (err) {
      console.error("PROFILE ERROR:", err);
      setError(err.response?.data?.message || "Failed to load your profile.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const run = () => loadProfile();
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------------------------------------- */
  /*  Open / close edit modal                                        */
  /* -------------------------------------------------------------- */

  const openEdit = () => {
    setEditName(profile?.fullName || "");
    setAvatarFile(null);
    setCoverFile(null);
    setAvatarPreview(null);
    setCoverPreview(null);
    setEditError("");
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (saving) return;
    setEditOpen(false);
  };

  /* -------------------------------------------------------------- */
  /*  File pickers                                                   */
  /* -------------------------------------------------------------- */

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setEditError("Avatar must be smaller than 5MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setEditError("");
  };

  const handleCoverPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setEditError("Cover image must be smaller than 10MB.");
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setEditError("");
  };

  /* -------------------------------------------------------------- */
  /*  Save profile changes                                           */
  /* -------------------------------------------------------------- */

  const handleSave = async () => {
    const trimmed = editName.trim();

    if (trimmed.length < 3 || trimmed.length > 50) {
      setEditError("Full name must be between 3 and 50 characters.");
      return;
    }

    try {
      setSaving(true);
      setEditError("");

      const formData = new FormData();
      formData.append("fullName", trimmed);

      if (avatarFile) formData.append("avatar", avatarFile);
      if (coverFile) formData.append("cover", coverFile);

      const response = await api.put("/users/profile", formData);

      if (response.data?.success && response.data.user) {
        setProfile(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setEditOpen(false);
      } else {
        setEditError(response.data?.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("SAVE PROFILE ERROR:", err);
      setEditError(
        err.response?.data?.message || "Failed to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------------------------------------- */
  /*  Password — validate + open confirm                             */
  /* -------------------------------------------------------------- */

  const openPasswordConfirm = () => {
    setPwError("");

    if (!pwOld.trim()) {
      setPwError("Current password is required.");
      return;
    }
    if (pwNew.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (pwNew.length > 128) {
      setPwError("New password must not exceed 128 characters.");
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError("New password and confirmation do not match.");
      return;
    }
    if (pwOld === pwNew) {
      setPwError("New password must be different from the current one.");
      return;
    }

    setPwConfirmOpen(true);
  };

  const performPasswordChange = async () => {
    try {
      setPwSaving(true);
      setPwError("");

      const response = await api.put("/users/change-password", {
        currentPassword: pwOld,
        newPassword: pwNew,
      });

      if (response.data?.success) {
        setPwConfirmOpen(false);
        setPwOld("");
        setPwNew("");
        setPwConfirm("");
        showToast("Password updated successfully.", "success");
      } else {
        setPwError(response.data?.message || "Failed to update password.");
        setPwConfirmOpen(false);
      }
    } catch (err) {
      console.error("CHANGE PASSWORD ERROR:", err);
      setPwError(err.response?.data?.message || "Failed to update password.");
      setPwConfirmOpen(false);
    } finally {
      setPwSaving(false);
    }
  };

  /* -------------------------------------------------------------- */
  /*  Helpers                                                        */
  /* -------------------------------------------------------------- */

  const getInitials = (name = "") => {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "U";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) return "—";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "—";
    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar />

      <div className="w-full lg:pl-64">
        {/* Header — Matched perfectly with Home.jsx */}
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex min-h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8 mt-16 lg:mt-0">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                My Profile
              </h1>
              <p className="mt-1 hidden text-sm text-gray-500 sm:block dark:text-gray-400">
                View and manage your account information
              </p>
            </div>

            <div className="flex gap-2">
              {profile && (
                <button
                  type="button"
                  onClick={openEdit}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-green-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 sm:h-10 sm:px-4"
                >
                  <FiEdit3 size={16} />
                  <span className="hidden sm:inline">Edit Profile</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => loadProfile(true)}
                disabled={refreshing}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 sm:h-10 sm:px-4 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <FiRefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">
                  {refreshing ? "Refreshing..." : "Refresh"}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mt-16 w-full p-4 sm:p-6 lg:mt-0 lg:p-8 pb-32">
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mx-auto max-w-5xl space-y-6">
              <div className="h-52 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-72 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
                <div className="h-72 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          ) : profile ? (
            <div className="mx-auto max-w-5xl space-y-6">
              {/* PROFILE HERO */}
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="relative h-32 sm:h-40">
                  {profile.coverImage ? (
                    <img
                      src={profile.coverImage}
                      alt="Cover"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-r from-green-700 via-green-600 to-emerald-500" />
                  )}

                  <button
                    type="button"
                    onClick={openEdit}
                    className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-black/70"
                  >
                    <FiCamera size={13} />
                    Change cover
                  </button>
                </div>

                <div className="px-5 pb-6 sm:px-7">
                  <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
                      <div className="relative shrink-0">
                        {profile.avatar ? (
                          <img
                            src={profile.avatar}
                            alt={profile.fullName}
                            className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-md sm:h-28 sm:w-28 dark:border-gray-900"
                          />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-green-100 text-2xl font-bold text-green-700 shadow-md sm:h-28 sm:w-28 sm:text-3xl dark:border-gray-900 dark:bg-green-900/40 dark:text-green-400">
                            {getInitials(profile.fullName)}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={openEdit}
                          className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-green-600 text-white shadow transition hover:bg-green-700 dark:border-gray-900"
                          aria-label="Change photo"
                        >
                          <FiCamera size={14} />
                        </button>
                      </div>

                      <div className="pb-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {profile.fullName || "User"}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {profile.email || "No email available"}
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex w-fit items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                      <FiShield size={16} />
                      <span>
                        {profile.role === "admin" ? "Administrator" : "User"}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* THEME TOGGLE */}
              <ThemeToggle />

              {/* APP LOCK (PIN) SECTION */}
              <AppLockSection showToast={showToast} />

              {/* INFORMATION */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Personal info */}
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                      <FiUser size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900 dark:text-white">
                        Personal Information
                      </h2>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Your basic account details
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Full Name
                      </p>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {profile.fullName || "Not provided"}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Email Address
                      </p>
                      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                        <FiMail
                          className="shrink-0 text-green-600 dark:text-green-400"
                          size={17}
                        />
                        <span className="break-all text-sm font-medium text-gray-800 dark:text-gray-200">
                          {profile.email || "Not provided"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Phone Number
                      </p>
                      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                        <FiPhone
                          className="shrink-0 text-green-600 dark:text-green-400"
                          size={17}
                        />
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {profile.phone || "Not provided"}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Account info */}
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                      <FiShield size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900 dark:text-white">
                        Account Information
                      </h2>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Account and membership details
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Account Role
                      </p>
                      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {profile.role === "admin" ? "Administrator" : "User"}
                        </span>
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold capitalize text-green-700 dark:bg-green-900/40 dark:text-green-400">
                          {profile.role || "user"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Member Since
                      </p>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {formatDate(profile.createdAt)}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* CHANGE PASSWORD */}
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                    <FiLock size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                      Change Password
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      Update your account password
                    </p>
                  </div>
                </div>

                {pwError && (
                  <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                    <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{pwError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <PasswordField
                      label="Current Password"
                      value={pwOld}
                      onChange={(e) => {
                        setPwOld(e.target.value);
                        setPwError("");
                      }}
                      placeholder="Enter your current password"
                      autoComplete="current-password"
                    />
                  </div>

                  <PasswordField
                    label="New Password"
                    value={pwNew}
                    onChange={(e) => {
                      setPwNew(e.target.value);
                      setPwError("");
                    }}
                    placeholder="At least 8 characters"
                  />

                  <PasswordField
                    label="Confirm New Password"
                    value={pwConfirm}
                    onChange={(e) => {
                      setPwConfirm(e.target.value);
                      setPwError("");
                    }}
                    placeholder="Re-enter new password"
                  />
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={openPasswordConfirm}
                    disabled={pwSaving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-green-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
                  >
                    <FiLock size={16} />
                    Update Password
                  </button>
                </div>
              </section>

              {/* Account status */}
              <section className="rounded-2xl border border-green-100 bg-green-50 p-5 sm:p-6 dark:border-green-800 dark:bg-green-900/20">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-green-900 dark:text-green-300">
                      Account Active
                    </h2>
                    <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                      Your account is currently active and you can use all
                      available land management features.
                    </p>
                  </div>
                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-green-700 shadow-sm dark:bg-gray-900 dark:text-green-400">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Active
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <FiUser size={24} />
              </div>
              <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                Profile unavailable
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                We could not load your profile information.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Edit profile modal */}
      {editOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={closeEdit}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Edit Profile
              </h3>
              <button
                type="button"
                onClick={closeEdit}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 disabled:opacity-60 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              {editError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                  {editError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Cover Image
                </label>
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="relative block h-32 w-full overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 transition hover:border-green-400 dark:border-gray-700"
                >
                  {coverPreview || profile?.coverImage ? (
                    <img
                      src={coverPreview || profile.coverImage}
                      alt="Cover preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-r from-green-700 via-green-600 to-emerald-500" />
                  )}

                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-xs font-semibold text-white opacity-0 transition hover:opacity-100">
                    <FiImage size={16} className="mr-1" />
                    Choose cover image
                  </span>
                </button>

                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverPick}
                  className="hidden"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 transition hover:border-green-400 dark:border-gray-700"
                  >
                    {avatarPreview || profile?.avatar ? (
                      <img
                        src={avatarPreview || profile.avatar}
                        alt="Avatar preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-green-700 dark:text-green-400">
                        {getInitials(editName || profile?.fullName || "")}
                      </span>
                    )}

                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition hover:opacity-100">
                      <FiCamera size={18} />
                    </span>
                  </button>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <p className="font-medium text-gray-700 dark:text-gray-200">
                      Click to upload a new picture
                    </p>
                    <p className="mt-0.5">PNG, JPG or WebP · Max 5MB</p>
                  </div>

                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarPick}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    setEditError("");
                  }}
                  placeholder="Enter your full name"
                  maxLength={50}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
                />
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {editName.trim().length}/50 characters
                </p>
              </div>
            </div>

            <div className="flex gap-2 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
              <button
                type="button"
                onClick={closeEdit}
                disabled={saving}
                className="h-11 flex-1 rounded-2xl bg-gray-100 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-green-600 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiCheck size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password confirm dialog */}
      <ConfirmDialog
        open={pwConfirmOpen}
        title="Update your password?"
        message="You'll be signed out of other devices. Make sure you remember the new password."
        confirmLabel="Yes, Update"
        cancelLabel="Cancel"
        loading={pwSaving}
        onConfirm={performPasswordChange}
        onCancel={() => setPwConfirmOpen(false)}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default Profile;