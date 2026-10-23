import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiShield,
  FiCalendar,
  FiRefreshCw,
  FiAlertCircle,
  FiX,
  FiCheck,
  FiMap,
  FiMessageSquare,
  FiHome,
  FiSlash,
  FiUnlock,
  FiTrash2,
} from "react-icons/fi";

import api from "../services/api";

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

const getInitials = (name = "") => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "U";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const formatDate = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ================================================================== */
/*  Toast                                                              */
/* ================================================================== */

const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-400"
      : "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/30 dark:text-green-400";

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
/*  Confirm Dialog                                                     */
/* ================================================================== */

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  loading = false,
  variant = "green",
  icon: Icon = FiShield,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const variants = {
    green: {
      circleBg:
        "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      btn: "bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500",
    },
    red: {
      circleBg: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
      btn: "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500",
    },
  };

  const v = variants[variant] || variants.green;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 text-center">
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${v.circleBg}`}
          >
            <Icon size={26} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
            {message}
          </p>
        </div>

        <div className="mt-6 flex gap-2 border-t border-gray-100 p-3 dark:border-gray-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-11 flex-1 rounded-2xl bg-gray-100 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white transition disabled:opacity-60 ${v.btn}`}
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Icon size={15} />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  Main                                                               */
/* ================================================================== */

function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = useCallback(
    (message, type = "success") => setToast({ message, type }),
    [],
  );

  /* Fetch user + stats */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/dashboard/admin/users/${id}`);
        if (cancelled) return;

        setUser(response.data?.user || null);
        setStats(response.data?.stats || null);
      } catch (err) {
        if (cancelled) return;
        console.error("User detail fetch error:", err);
        setError(err.response?.data?.message || "Failed to load user details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* 🔥 Toggle Block/Unblock */
  const performToggleBlock = async () => {
    try {
      setActionLoading(true);

      const res = await api.put(`/dashboard/admin/users/${id}/block`);

      const newStatus = res.data?.user?.isBlocked;
      setUser((u) => (u ? { ...u, isBlocked: newStatus } : u));

      showToast(`User is now ${newStatus ? "Blocked" : "Active"}.`, "success");
      setConfirm(null);
    } catch (err) {
      console.error("Toggle block error:", err);
      showToast(
        err.response?.data?.message || "Failed to update user status.",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* Delete user */
  const performDelete = async () => {
    try {
      setActionLoading(true);

      await api.delete(`/users/${id}`);

      showToast("User deleted successfully.", "success");

      setTimeout(() => {
        navigate("/users", { replace: true });
      }, 800);
    } catch (err) {
      console.error("Delete user error:", err);
      showToast(
        err.response?.data?.message || "Failed to delete user.",
        "error",
      );
      setActionLoading(false);
    }
  };

  /* Loading */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="h-48 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
      </div>
    );
  }

  /* Error */
  if (error || !user) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate("/users")}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-green-600 dark:text-gray-400 dark:hover:text-green-500"
        >
          <FiArrowLeft size={16} />
          Back to Users
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/30">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
            <FiAlertCircle size={26} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-red-900 dark:text-red-300">
            Unable to load user
          </h2>
          <p className="mt-2 text-sm text-red-700 dark:text-red-400">
            {error || "User details could not be found."}
          </p>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === "admin";
  const isBlocked = user.isBlocked;

  return (
    <div className="space-y-6">
      {/* Back + actions */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <Link
          to="/users"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-green-600 dark:text-gray-400 dark:hover:text-green-500"
        >
          <FiArrowLeft size={16} />
          Back to Users
        </Link>

        <div className="flex items-center gap-2">
          {/* 🔥 BLOCK / UNBLOCK BUTTON */}
          <button
            type="button"
            onClick={() =>
              setConfirm({
                type: "block",
                variant: isBlocked ? "green" : "red",
                icon: isBlocked ? FiUnlock : FiSlash,
                title: isBlocked ? "Unblock this user?" : "Block this user?",
                message: isBlocked
                  ? `"${user.fullName}" will be able to log in and use the app again.`
                  : `"${user.fullName}" will be blocked and unable to log in.`,
                confirmLabel: isBlocked ? "Yes, Unblock" : "Yes, Block",
                onConfirm: performToggleBlock,
              })
            }
            className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-sm transition ${
              isBlocked
                ? "border border-green-100 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
                : "border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
            }`}
          >
            {isBlocked ? (
              <>
                <FiUnlock size={15} />
                Unblock User
              </>
            ) : (
              <>
                <FiSlash size={15} />
                Block User
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              setConfirm({
                type: "delete",
                variant: "red",
                icon: FiTrash2,
                title: "Delete this user?",
                message: `"${user.fullName}" and all associated data will be permanently removed. This action cannot be undone.`,
                confirmLabel: "Yes, Delete",
                onConfirm: performDelete,
              })
            }
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500"
          >
            <FiTrash2 size={15} />
            Delete User
          </button>
        </div>
      </div>

      {/* Profile card */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="h-28 bg-gradient-to-r from-green-600 via-green-500 to-emerald-500" />

        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-14 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="h-24 w-24 shrink-0 rounded-2xl border-4 border-white object-cover shadow-md sm:h-28 sm:w-28 dark:border-gray-900"
                />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-green-100 text-2xl font-bold text-green-700 shadow-md sm:h-28 sm:w-28 sm:text-3xl dark:border-gray-900 dark:bg-green-900/40 dark:text-green-400">
                  {getInitials(user.fullName)}
                </div>
              )}

              <div className="pb-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.fullName || "Unnamed User"}
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                  isAdmin
                    ? "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {isAdmin ? (
                  <>
                    <FiShield size={16} />
                    Administrator
                  </>
                ) : (
                  <>
                    <FiUser size={16} />
                    Regular User
                  </>
                )}
              </span>

              {isBlocked && (
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  <FiSlash size={16} />
                  Blocked
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stat row */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatTile
          icon={<FiMap size={20} />}
          iconClass="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          label="Total Lands"
          value={stats?.lands ?? 0}
        />
        <StatTile
          icon={<FiHome size={20} />}
          iconClass="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          label="Listed Lands"
          value={stats?.listed ?? 0}
        />
        <StatTile
          icon={<FiMessageSquare size={20} />}
          iconClass="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          label="Messages"
          value={stats?.messages ?? 0}
        />
      </section>

      {/* Info grid */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Account Information
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Full details for this user's account
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow
            icon={<FiUser size={15} />}
            label="Full Name"
            value={user.fullName || "—"}
          />
          <InfoRow
            icon={<FiMail size={15} />}
            label="Email Address"
            value={user.email || "—"}
          />
          <InfoRow
            icon={<FiPhone size={15} />}
            label="Phone Number"
            value={user.phone || "—"}
          />
          <InfoRow
            icon={<FiShield size={15} />}
            label="Role"
            value={isAdmin ? "Administrator" : "User"}
          />
          <InfoRow
            icon={<FiCalendar size={15} />}
            label="Joined"
            value={formatDate(user.createdAt)}
          />
          <InfoRow
            icon={<FiRefreshCw size={15} />}
            label="Last Updated"
            value={formatDateTime(user.updatedAt)}
          />
        </div>
      </section>

      {/* Confirm */}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        loading={actionLoading}
        variant={confirm?.variant}
        icon={confirm?.icon}
        onConfirm={confirm?.onConfirm}
        onCancel={() => {
          if (actionLoading) return;
          setConfirm(null);
        }}
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

/* ================================================================== */
/*  Sub-components                                                     */
/* ================================================================== */

const StatTile = ({ icon, iconClass, label, value }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
    >
      {icon}
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
        {Number(value).toLocaleString("en-IN")}
      </p>
    </div>
  </div>
);

const InfoRow = ({ icon, label, value }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
    <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
      {icon}
      {label}
    </p>
    <p className="mt-1.5 break-words text-sm font-medium text-gray-900 dark:text-white">
      {value}
    </p>
  </div>
);

export default UserDetail;
