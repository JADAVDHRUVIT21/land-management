import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiRefreshCw,
  FiLoader,
  FiAlertCircle,
  FiCheck,
  FiX,
  FiMap,
  FiMapPin,
  FiTrash2,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiTag,
} from "react-icons/fi";

import api from "../services/api";

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

const formatPrice = (value) => {
  if (value === undefined || value === null || value === "") return "—";
  return `₹${Number(value).toLocaleString("en-IN")}`;
};

const getOwnerInitials = (name = "") => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "U";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
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
  variant = "red",
  icon: Icon = FiTrash2,
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

  const v = variants[variant] || variants.red;

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

function Lands() {
  const navigate = useNavigate();

  const [lands, setLands] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [listingFilter, setListingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
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

  /* Fetch lands */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!refreshing) setLoading(true);
        setError("");

        const params = { page, limit };
        if (appliedSearch) params.search = appliedSearch;
        if (listingFilter !== "all") params.listingType = listingFilter;
        if (statusFilter !== "all") params.status = statusFilter;

        // 🔥 FIXED: Changed from "/dashboard/admin/lands" to "/lands"
        const response = await api.get("/lands", { params });
        if (cancelled) return;

        const data = response.data || {};
        setLands(Array.isArray(data.lands) ? data.lands : []);
        setTotal(Number(data.total) || 0);
        setTotalPages(Number(data.totalPages) || 1);
      } catch (err) {
        if (cancelled) return;
        console.error("Lands fetch error:", err);
        setError(
          err.response?.data?.message || "Failed to load lands. Try again.",
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
  }, [page, appliedSearch, listingFilter, statusFilter, refreshing]);

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

  const handleListingFilterChange = (value) => {
    setListingFilter(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  /* Delete land */
  const performDelete = async () => {
    if (!confirm?.land) return;

    try {
      setActionLoading(true);

      await api.delete(`/lands/${confirm.land._id}`);

      setLands((current) => current.filter((l) => l._id !== confirm.land._id));
      setTotal((t) => Math.max(0, t - 1));

      showToast("Land deleted successfully.");
      setConfirm(null);
    } catch (err) {
      console.error("Delete land error:", err);
      showToast(
        err.response?.data?.message || "Failed to delete land.",
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
          <p className="text-sm font-medium text-green-600 dark:text-green-500">
            LandManage / Lands
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
            Land Properties
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            View, search, and manage all land listings on the platform.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex h-[42px] w-fit items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <FiRefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-400">
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
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <FiSearch
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by survey number, village, district, or state..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-green-500 dark:focus:bg-gray-800 dark:focus:ring-green-900/30"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                aria-label="Clear search"
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Type:
              </span>
              {[
                { value: "all", label: "All" },
                { value: "For Sale", label: "For Sale" },
                { value: "For Rent", label: "For Rent" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleListingFilterChange(tab.value)}
                  className={`h-9 rounded-lg px-3 text-xs font-semibold transition ${
                    listingFilter === tab.value
                      ? "bg-green-600 text-white shadow-sm dark:bg-green-600"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Status:
              </span>
              {[
                { value: "all", label: "All" },
                { value: "listed", label: "Listed" },
                { value: "unlisted", label: "Unlisted" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleStatusFilterChange(tab.value)}
                  className={`h-9 rounded-lg px-3 text-xs font-semibold transition ${
                    statusFilter === tab.value
                      ? "bg-green-600 text-white shadow-sm dark:bg-green-600"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Lands table */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
              <FiLoader size={20} className="animate-spin" />
              <span className="text-sm">Loading lands...</span>
            </div>
          </div>
        ) : lands.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
              <FiMap size={28} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
              No lands found
            </h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
              {appliedSearch ||
              listingFilter !== "all" ||
              statusFilter !== "all"
                ? "Try changing your search or filters."
                : "Land listings will appear here as they're added."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Land
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Location
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Type / Listing
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Price
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Owner
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {lands.map((land) => (
                    <tr
                      key={land._id}
                      className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {land.image ? (
                            <img
                              src={land.image}
                              alt={land.surveyNumber}
                              className="h-12 w-12 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                              <FiMapPin size={18} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              Survey No. {land.surveyNumber}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                              {land.area} {land.areaUnit || "sqft"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <p className="truncate text-sm text-gray-700 dark:text-gray-300">
                          {land.village}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                          {land.district}, {land.state}
                        </p>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {land.landType}
                          </span>
                          <span
                            className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              land.listingType === "For Rent"
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            }`}
                          >
                            <FiTag size={10} />
                            {land.listingType}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatPrice(land.price)}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                          {land.isForSale ? "Listed" : "Draft"}
                        </p>
                      </td>

                      <td className="px-5 py-3.5">
                        {land.owner ? (
                          <div className="flex items-center gap-2">
                            {land.owner.avatar ? (
                              <img
                                src={land.owner.avatar}
                                alt={land.owner.fullName}
                                className="h-7 w-7 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                                {getOwnerInitials(land.owner.fullName)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">
                                {land.owner.fullName || "—"}
                              </p>
                              <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">
                                {land.owner.email}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            —
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/lands/${land._id}`)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <FiEye size={13} />
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setConfirm({
                                type: "delete",
                                land,
                                variant: "red",
                                icon: FiTrash2,
                                title: "Delete this land?",
                                message: `Survey No. ${land.surveyNumber} will be permanently removed. This action cannot be undone.`,
                                confirmLabel: "Yes, Delete",
                                onConfirm: performDelete,
                              })
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/30 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
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

            {/* Mobile cards */}
            <ul className="divide-y divide-gray-100 md:hidden dark:divide-gray-800">
              {lands.map((land) => (
                <li key={land._id} className="p-4">
                  <div className="flex items-start gap-3">
                    {land.image ? (
                      <img
                        src={land.image}
                        alt={land.surveyNumber}
                        className="h-14 w-14 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                        <FiMapPin size={20} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          Survey No. {land.surveyNumber}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            land.listingType === "For Rent"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          }`}
                        >
                          {land.listingType}
                        </span>
                      </div>

                      <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                        {land.village}, {land.district}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {formatPrice(land.price)}
                      </p>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/lands/${land._id}`)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                          <FiEye size={13} />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirm({
                              type: "delete",
                              land,
                              variant: "red",
                              icon: FiTrash2,
                              title: "Delete this land?",
                              message: `Survey No. ${land.surveyNumber} will be permanently removed.`,
                              confirmLabel: "Yes, Delete",
                              onConfirm: performDelete,
                            })
                          }
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 dark:border-red-900/30 dark:bg-gray-800 dark:text-red-400"
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
      {!loading && lands.length > 0 && totalPages > 1 && (
        <section className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {(page - 1) * limit + 1}
            </span>{" "}
            –{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {Math.min(page * limit, total)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {total}
            </span>{" "}
            lands
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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
                    ? "bg-green-600 text-white shadow-sm dark:bg-green-600"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {n}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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

export default Lands;
