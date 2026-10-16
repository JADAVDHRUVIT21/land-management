import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiRefreshCw,
  FiLoader,
  FiAlertCircle,
  FiCheck,
  FiX,
  FiUser,
  FiUserCheck,
  FiUserX,
  FiMail,
  FiPhone,
  FiChevronLeft,
  FiChevronRight,
  FiShield,
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
    month: "short",
    year: "numeric",
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
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-green-200 bg-green-50 text-green-700";

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
      circleBg: "bg-green-50 text-green-600",
      btn: "bg-green-600 hover:bg-green-700",
    },
    red: {
      circleBg: "bg-red-50 text-red-600",
      btn: "bg-red-500 hover:bg-red-600",
    },
  };

  const v = variants[variant] || variants.green;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 text-center">
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${v.circleBg}`}
          >
            <Icon size={26} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-gray-500">{message}</p>
        </div>

        <div className="mt-6 flex gap-2 border-t border-gray-100 p-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-11 flex-1 rounded-2xl bg-gray-100 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-60"
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

function Users() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const searchTimeoutRef = useRef(null);

  const showToast = useCallback(
    (message, type = "success") => setToast({ message, type }),
    [],
  );

  /* Fetch users */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!refreshing) setLoading(true);
        setError("");

        const params = { page, limit };
        if (appliedSearch) params.search = appliedSearch;
        if (roleFilter !== "all") params.role = roleFilter;

        const response = await api.get("/dashboard/admin/users", { params });
        if (cancelled) return;

        const data = response.data || {};
        setUsers(Array.isArray(data.users) ? data.users : []);
        setTotal(Number(data.total) || 0);
        setTotalPages(Number(data.totalPages) || 1);
      } catch (err) {
        if (cancelled) return;
        console.error("Users fetch error:", err);
        setError(
          err.response?.data?.message || "Failed to load users. Try again.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [page, appliedSearch, roleFilter, refreshing]);

  /* Debounce search */
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      setAppliedSearch(search.trim());
      setPage(1);
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search]);

  const handleRefresh = () => {
    setRefreshing(true);
    showToast("Refreshed");
  };

  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
    setPage(1);
  };

  /* Toggle role */
  const performToggleRole = async () => {
    if (!confirm?.user) return;

    try {
      setActionLoading(true);

      const res = await api.put(
        `/dashboard/admin/users/${confirm.user._id}/toggle-role`,
      );

      const newRole = res.data?.user?.role;
      setUsers((current) =>
        current.map((u) =>
          u._id === confirm.user._id ? { ...u, role: newRole } : u,
        ),
      );

      showToast(`${confirm.user.fullName || "User"} is now ${newRole}.`);
      setConfirm(null);
    } catch (err) {
      console.error("Toggle role error:", err);
      showToast(
        err.response?.data?.message || "Failed to update role.",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* Delete user */
  const performDelete = async () => {
    if (!confirm?.user) return;

    try {
      setActionLoading(true);

      await api.delete(`/users/${confirm.user._id}`);

      setUsers((current) => current.filter((u) => u._id !== confirm.user._id));
      setTotal((t) => Math.max(0, t - 1));

      showToast("User deleted successfully.");
      setConfirm(null);
    } catch (err) {
      console.error("Delete user error:", err);
      showToast(
        err.response?.data?.message || "Failed to delete user.",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const pageNumbers = useMemo(() => {
    const nums = [];
    const max = 5;
    let start = Math.max(1, page - Math.floor(max / 2));
    let end = start + max - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - max + 1);
    }

    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      {/* Heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-green-600">
            LandManage / Users
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            User Management
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            View, search, and manage all users on the platform.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex h-[42px] w-fit items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
        >
          <FiRefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <FiSearch
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Clear search"
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {[
              { value: "all", label: "All" },
              { value: "user", label: "Users" },
              { value: "admin", label: "Admins" },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleRoleFilterChange(tab.value)}
                className={`h-11 rounded-xl px-4 text-sm font-semibold transition ${
                  roleFilter === tab.value
                    ? "bg-green-600 text-white shadow-sm"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Users table */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex items-center gap-3 text-gray-500">
              <FiLoader size={20} className="animate-spin" />
              <span className="text-sm">Loading users...</span>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <FiUser size={28} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-900">
              No users found
            </h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              {appliedSearch || roleFilter !== "all"
                ? "Try changing your search or filter."
                : "Users will appear here as they register."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      User
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Contact
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Role
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Joined
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      onClick={() => navigate(`/users/${user._id}`)}
                      className="cursor-pointer transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.fullName}
                              className="h-10 w-10 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                              {getInitials(user.fullName)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {user.fullName || "Unnamed"}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-gray-400">
                              ID: {String(user._id).slice(-8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="space-y-0.5 text-xs">
                          <p className="flex items-center gap-1.5 text-gray-700">
                            <FiMail size={12} className="text-gray-400" />
                            <span className="truncate">{user.email}</span>
                          </p>
                          {user.phone && (
                            <p className="flex items-center gap-1.5 text-gray-500">
                              <FiPhone size={12} className="text-gray-400" />
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            user.role === "admin"
                              ? "bg-purple-50 text-purple-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {user.role === "admin" ? (
                            <>
                              <FiShield size={11} />
                              Admin
                            </>
                          ) : (
                            <>
                              <FiUser size={11} />
                              User
                            </>
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <p className="text-sm text-gray-600">
                          {formatDate(user.createdAt)}
                        </p>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setConfirm({
                                type: "role",
                                user,
                                variant:
                                  user.role === "admin" ? "red" : "green",
                                icon:
                                  user.role === "admin" ? FiUserX : FiUserCheck,
                                title:
                                  user.role === "admin"
                                    ? "Demote this user?"
                                    : "Promote to admin?",
                                message:
                                  user.role === "admin"
                                    ? `"${user.fullName}" will lose admin access and become a regular user.`
                                    : `"${user.fullName}" will gain full admin access to the platform.`,
                                confirmLabel:
                                  user.role === "admin"
                                    ? "Yes, Demote"
                                    : "Yes, Promote",
                                onConfirm: performToggleRole,
                              })
                            }
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                              user.role === "admin"
                                ? "border border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                                : "border border-green-100 bg-green-50 text-green-700 hover:bg-green-100"
                            }`}
                          >
                            {user.role === "admin" ? (
                              <>
                                <FiUserX size={13} />
                                Demote
                              </>
                            ) : (
                              <>
                                <FiUserCheck size={13} />
                                Promote
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setConfirm({
                                type: "delete",
                                user,
                                variant: "red",
                                icon: FiTrash2,
                                title: "Delete this user?",
                                message: `"${user.fullName}" and all associated data will be permanently removed. This action cannot be undone.`,
                                confirmLabel: "Yes, Delete",
                                onConfirm: performDelete,
                              })
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            <FiTrash2 size={13} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <ul className="divide-y divide-gray-100 md:hidden">
              {users.map((user) => (
                <li
                  key={user._id}
                  onClick={() => navigate(`/users/${user._id}`)}
                  className="cursor-pointer p-4 transition hover:bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                        {getInitials(user.fullName)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {user.fullName || "Unnamed"}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            user.role === "admin"
                              ? "bg-purple-50 text-purple-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {user.email}
                      </p>
                      {user.phone && (
                        <p className="mt-0.5 text-xs text-gray-400">
                          {user.phone}
                        </p>
                      )}

                      <div
                        className="mt-3 flex gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setConfirm({
                              type: "role",
                              user,
                              variant: user.role === "admin" ? "red" : "green",
                              icon:
                                user.role === "admin" ? FiUserX : FiUserCheck,
                              title:
                                user.role === "admin"
                                  ? "Demote this user?"
                                  : "Promote to admin?",
                              message:
                                user.role === "admin"
                                  ? `"${user.fullName}" will lose admin access.`
                                  : `"${user.fullName}" will gain admin access.`,
                              confirmLabel:
                                user.role === "admin"
                                  ? "Yes, Demote"
                                  : "Yes, Promote",
                              onConfirm: performToggleRole,
                            })
                          }
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                            user.role === "admin"
                              ? "border border-red-100 bg-red-50 text-red-600"
                              : "border border-green-100 bg-green-50 text-green-700"
                          }`}
                        >
                          {user.role === "admin" ? (
                            <>
                              <FiUserX size={13} />
                              Demote
                            </>
                          ) : (
                            <>
                              <FiUserCheck size={13} />
                              Promote
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setConfirm({
                              type: "delete",
                              user,
                              variant: "red",
                              icon: FiTrash2,
                              title: "Delete this user?",
                              message: `"${user.fullName}" will be permanently removed.`,
                              confirmLabel: "Yes, Delete",
                              onConfirm: performDelete,
                            })
                          }
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600"
                        >
                          <FiTrash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Pagination */}
      {!loading && users.length > 0 && totalPages > 1 && (
        <section className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {(page - 1) * limit + 1}
            </span>{" "}
            –{" "}
            <span className="font-semibold text-gray-900">
              {Math.min(page * limit, total)}
            </span>{" "}
            of <span className="font-semibold text-gray-900">{total}</span>{" "}
            users
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiChevronLeft size={16} />
            </button>

            {pageNumbers.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={`h-9 min-w-[36px] rounded-lg px-3 text-sm font-semibold transition ${
                  n === page
                    ? "bg-green-600 text-white shadow-sm"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {n}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </section>
      )}

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

export default Users;