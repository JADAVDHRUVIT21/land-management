import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiUsers,
  FiMap,
  FiDollarSign,
  FiFileText,
  FiArrowUpRight,
  FiArrowDownRight,
  FiActivity,
  FiClock,
  FiRefreshCw,
  FiAlertCircle,
  FiCheck,
  FiX,
  FiUser,
  FiHome,
  FiTrendingUp,
  FiMessageSquare,
} from "react-icons/fi";

import api from "../services/api.js";

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
/*  Helpers                                                            */
/* ================================================================== */

const formatNumber = (value) => {
  if (value === undefined || value === null) return "—";
  return Number(value).toLocaleString("en-IN");
};

const timeAgo = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  const diff = (Date.now() - d.getTime()) / 1000;

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
};

const getInitials = (name = "") => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "U";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

/* ================================================================== */
/*  Main                                                               */
/* ================================================================== */

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentLands, setRecentLands] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = useCallback(
    (message, type = "success") => setToast({ message, type }),
    [],
  );

  /* ================================================================
   *  Initial fetch on mount.
   *
   *  Uses an inline async IIFE so ESLint's react-hooks/exhaustive-deps
   *  rule doesn't flag any missing dependencies. The `cancelled` flag
   *  prevents state updates after unmount.
   * ================================================================ */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [statsRes, usersRes, landsRes] = await Promise.all([
          api.get("/dashboard/admin/stats"),
          api.get("/dashboard/admin/recent-users", {
            params: { limit: 5 },
          }),
          api.get("/dashboard/admin/recent-lands", {
            params: { limit: 5 },
          }),
        ]);

        if (cancelled) return;

        setStats(statsRes.data?.stats || null);
        setRecentUsers(usersRes.data?.users || []);
        setRecentLands(landsRes.data?.lands || []);
      } catch (err) {
        if (cancelled) return;

        console.error("Admin Dashboard Fetch Error:", err);
        setError(
          err.response?.data?.message || "Failed to load admin dashboard data.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ================================================================
   *  Manual refresh — same fetch, but doesn't touch `loading` state,
   *  uses `refreshing` instead so we don't blank out the page.
   * ================================================================ */
  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");

    try {
      const [statsRes, usersRes, landsRes] = await Promise.all([
        api.get("/dashboard/admin/stats"),
        api.get("/dashboard/admin/recent-users", { params: { limit: 5 } }),
        api.get("/dashboard/admin/recent-lands", { params: { limit: 5 } }),
      ]);

      setStats(statsRes.data?.stats || null);
      setRecentUsers(usersRes.data?.users || []);
      setRecentLands(landsRes.data?.lands || []);
      showToast("Refreshed");
    } catch (err) {
      console.error("Admin Dashboard Refresh Error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to refresh admin dashboard data.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  /* ---------------- Stats cards ---------------- */
  const statCards = useMemo(() => {
    const s = stats || {};

    return [
      {
        title: "Total Users",
        value: formatNumber(s.users?.total),
        subtitle: s.users?.newThisMonth
          ? `+${formatNumber(s.users.newThisMonth)} this month`
          : "No new users this month",
        icon: FiUsers,
        iconBg: "bg-blue-50 dark:bg-blue-900/30",
        iconColor: "text-blue-600 dark:text-blue-400",
      },
      {
        title: "Total Lands",
        value: formatNumber(s.lands?.total),
        subtitle: s.lands?.addedThisMonth
          ? `+${formatNumber(s.lands.addedThisMonth)} this month`
          : "No new lands this month",
        icon: FiMap,
        iconBg: "bg-green-50 dark:bg-green-900/30",
        iconColor: "text-green-600 dark:text-green-400",
      },
      {
        title: "Listed Lands",
        value: formatNumber(s.lands?.listed),
        subtitle: `${formatNumber(s.lands?.forSale)} for sale · ${formatNumber(
          s.lands?.forRent,
        )} for rent`,
        icon: FiDollarSign,
        iconBg: "bg-purple-50 dark:bg-purple-900/30",
        iconColor: "text-purple-600 dark:text-purple-400",
      },
      {
        title: "Support Tickets",
        value: formatNumber(s.tickets?.total),
        subtitle: s.tickets?.open
          ? `${formatNumber(s.tickets.open)} open`
          : "No open tickets",
        icon: FiFileText,
        iconBg: "bg-orange-50 dark:bg-orange-900/30",
        iconColor: "text-orange-600 dark:text-orange-400",
      },
    ];
  }, [stats]);

  /* ================================================================ */
  /*  Loading skeleton                                                */
  /* ================================================================ */
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-24 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl border border-gray-200 bg-white xl:col-span-2 dark:border-gray-800 dark:bg-gray-900" />
          <div className="h-80 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ---------------- Error banner ---------------- */}
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
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

      {/* ---------------- Page heading ---------------- */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-green-600">
            LandManage / Overview
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Monitor your land management platform from one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            <FiActivity className="text-green-600" size={17} />
            Admin Overview
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex h-[42px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <FiRefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </section>

      {/* ---------------- Stat cards ---------------- */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {item.title}
                  </p>

                  <p className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {item.value}
                  </p>
                </div>

                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.iconBg} ${item.iconColor}`}
                >
                  <Icon size={22} />
                </div>
              </div>

              <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {item.subtitle}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      {/* ---------------- Main content ---------------- */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent users */}
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Signups
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The latest users who joined your platform.
              </p>
            </div>

            <Link
              to="/admin/users"
              className="shrink-0 text-sm font-medium text-green-600 transition hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
            >
              View All
            </Link>
          </div>

          {recentUsers.length === 0 ? (
            <div className="mt-7 flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 text-center dark:border-gray-700 dark:bg-gray-800">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-gray-400 shadow-sm dark:bg-gray-900 dark:text-gray-500">
                <FiUser size={26} />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
                No users yet
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500 dark:text-gray-400">
                New users will appear here as soon as they sign up.
              </p>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-gray-100 dark:divide-gray-800">
              {recentUsers.map((user) => (
                <li
                  key={user._id}
                  className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                      {getInitials(user.fullName)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {user.fullName || "User"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {timeAgo(user.createdAt)}
                    </p>
                    {user.role === "admin" && (
                      <span className="mt-1 inline-block rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        Admin
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        {/* Recent lands */}
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <FiHome size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                New Listings
              </h2>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Latest land properties
              </p>
            </div>
          </div>

          {recentLands.length === 0 ? (
            <div className="mt-6 rounded-xl bg-gray-50 p-5 text-center dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No land listings yet.
              </p>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {recentLands.map((land) => (
                <li key={land._id}>
                  <Link
                    to={`/lands/${land._id}`}
                    className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3 transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-green-700"
                  >
                    {land.image ? (
                      <img
                        src={land.image}
                        alt={land.surveyNumber}
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                        <FiMap size={18} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        Survey No. {land.surveyNumber}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                        {land.village}, {land.district}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-green-700 dark:text-green-400">
                        ₹{Number(land.price || 0).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="shrink-0 self-center">
                      <FiArrowUpRight
                        size={16}
                        className="text-gray-400 dark:text-gray-500"
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      {/* ---------------- Secondary stats row ---------------- */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat
          title="New Users (7d)"
          value={formatNumber(stats?.users?.newLast7Days)}
          icon={<FiTrendingUp size={18} />}
          iconClass="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />

        <MiniStat
          title="Total Admins"
          value={formatNumber(stats?.users?.admins)}
          icon={<FiUsers size={18} />}
          iconClass="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />

        <MiniStat
          title="Open Tickets"
          value={formatNumber(stats?.tickets?.open)}
          icon={<FiClock size={18} />}
          iconClass="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />

        <MiniStat
          title="Total Messages"
          value={formatNumber(stats?.messages?.total)}
          icon={<FiMessageSquare size={18} />}
          iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
        />
      </section>

      {/* ---------------- Land type breakdown ---------------- */}
      {stats?.lands?.byType?.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Lands by Type
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Distribution of properties by land category
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <FiMap size={20} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.lands.byType.map((row) => (
              <div
                key={row.type}
                className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800"
              >
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {row.type}
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(row.count)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- Info banner ---------------- */}
      <section className="rounded-2xl border border-green-100 bg-green-50/70 p-5 sm:p-6 dark:border-green-800 dark:bg-green-900/20">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-green-700 shadow-sm dark:bg-gray-900 dark:text-green-400">
            <FiArrowDownRight size={22} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Live data is now connected
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">
              Your admin dashboard is now pulling real data from the backend —
              users, lands, tickets, and messages. Use the Users page to manage
              accounts, and refresh anytime to see the latest numbers.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- Toast ---------------- */}
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
/*  Mini Stat Card                                                     */
/* ================================================================== */

const MiniStat = ({ title, value, icon, iconClass }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {title}
      </p>
      <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  </div>
);

export default Dashboard;
