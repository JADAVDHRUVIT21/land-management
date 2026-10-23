import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiCalendar,
  FiTag,
  FiRefreshCw,
  FiAlertCircle,
  FiX,
  FiCheck,
  FiTrash2,
  FiImage,
  FiVideo,
  FiPlay,
  FiEye,
} from "react-icons/fi";

import api from "../services/api";

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

const formatPrice = (value) => {
  if (value === undefined || value === null || value === "") return "—";
  return `₹${Number(value).toLocaleString("en-IN")}`;
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

const getOwnerInitials = (name = "") => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "U";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const isRentListing = (land) => land?.listingType === "For Rent";

const rentPeriodSuffix = (period) => {
  if (!period) return "";
  const map = {
    "Per Month": "/month",
    "Per Year": "/year",
    "Per Day": "/day",
    "Per Week": "/week",
  };
  return map[period] || "";
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
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <FiTrash2 size={26} />
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
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60 dark:bg-red-600 dark:hover:bg-red-500"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <FiTrash2 size={15} />
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

function LandDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [land, setLand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [preview, setPreview] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const showToast = useCallback(
    (message, type = "success") => setToast({ message, type }),
    [],
  );

  /* Fetch land */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/lands/${id}`);
        if (cancelled) return;

        setLand(response.data?.land || response.data || null);
      } catch (err) {
        if (cancelled) return;
        console.error("Land detail fetch error:", err);
        setError(err.response?.data?.message || "Failed to load land details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* Delete land */
  const performDelete = async () => {
    try {
      setDeleting(true);

      await api.delete(`/lands/${id}`);

      showToast("Land deleted successfully.", "success");

      setTimeout(() => {
        navigate("/lands", { replace: true });
      }, 800);
    } catch (err) {
      console.error("Delete land error:", err);
      showToast(
        err.response?.data?.message || "Failed to delete land.",
        "error",
      );
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  /* Extract images and videos */
  const images = Array.isArray(land?.image)
    ? land.image
        .map((i) => (typeof i === "string" ? i : i?.url))
        .filter(Boolean)
    : [];

  const videos = Array.isArray(land?.video)
    ? land.video
        .map((v) => (typeof v === "string" ? v : v?.url))
        .filter(Boolean)
    : [];

  /* Loading */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900" />
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
  if (error || !land) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate("/lands")}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-green-600 dark:text-gray-400 dark:hover:text-green-500"
        >
          <FiArrowLeft size={16} />
          Back to Lands
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-900/20">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
            <FiAlertCircle size={26} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-red-900 dark:text-red-300">
            Unable to load land
          </h2>
          <p className="mt-2 text-sm text-red-700 dark:text-red-400">
            {error || "Land details could not be found."}
          </p>
        </div>
      </div>
    );
  }

  const rentMode = isRentListing(land);
  const owner =
    land.owner && typeof land.owner === "object" ? land.owner : null;

  return (
    <div className="space-y-6">
      {/* Back + actions */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <Link
          to="/lands"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-green-600 dark:text-gray-400 dark:hover:text-green-500"
        >
          <FiArrowLeft size={16} />
          Back to Lands
        </Link>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500"
        >
          <FiTrash2 size={15} />
          Delete Land
        </button>
      </div>

      {/* Hero: image + badges */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="relative h-[240px] bg-gray-100 sm:h-[320px] dark:bg-gray-800">
          {images.length > 0 ? (
            <img
              src={images[0]}
              alt={`Survey No. ${land.surveyNumber}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-green-50 text-green-500 dark:bg-green-900/20 dark:text-green-500">
              <FiImage size={48} />
            </div>
          )}

          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm ${
                rentMode
                  ? "bg-blue-600 dark:bg-blue-600"
                  : "bg-green-600 dark:bg-green-600"
              }`}
            >
              {rentMode ? "For Rent" : "For Sale"}
            </span>

            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm ${
                land.isForSale
                  ? "bg-green-600 dark:bg-green-600"
                  : "bg-gray-700 dark:bg-gray-600"
              }`}
            >
              {land.isForSale ? "Listed" : "Draft"}
            </span>
          </div>
        </div>
      </section>

      {/* Info grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Property Information */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Property Information
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Basic details about this land
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow label="Survey Number" value={land.surveyNumber} />
              <InfoRow
                label="Area"
                value={`${land.area} ${land.areaUnit || "sqft"}`}
              />
              <InfoRow label="Village" value={land.village} />
              <InfoRow label="District" value={land.district} />
              <InfoRow label="State" value={land.state} />
              <InfoRow label="Land Type" value={land.landType} />
              <InfoRow label="Listing Type" value={land.listingType} />
              <InfoRow
                label={rentMode ? "Monthly Rent" : "Asking Price"}
                value={`${formatPrice(land.price)}${
                  rentMode ? rentPeriodSuffix(land.rentPeriod) : ""
                }`}
                highlight
              />
            </div>
          </section>

          {/* Rental Details */}
          {rentMode && (
            <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-6 shadow-sm dark:border-blue-900/50 dark:bg-blue-900/10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Rental Details
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Terms for renting this property
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow
                  label="Rent Period"
                  value={land.rentPeriod || "Not specified"}
                />
                <InfoRow
                  label="Minimum Duration"
                  value={land.minimumRentDuration || "Not specified"}
                />
                <InfoRow
                  label="Security Deposit"
                  value={
                    land.securityDeposit
                      ? formatPrice(land.securityDeposit)
                      : "No deposit"
                  }
                />
                <InfoRow
                  label="Negotiable"
                  value={land.isNegotiable ? "Yes" : "No"}
                />
              </div>
            </section>
          )}

          {/* Description */}
          {land.description && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Description
              </h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-600 dark:text-gray-300">
                {land.description}
              </p>
            </section>
          )}

          {/* Location */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Location
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {[land.village, land.district, land.state]
                .filter(Boolean)
                .join(", ")}
            </p>

            {land.location?.latitude && land.location?.longitude && (
              <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2 dark:bg-gray-800/50">
                <InfoRow label="Latitude" value={land.location.latitude} />
                <InfoRow label="Longitude" value={land.location.longitude} />
              </div>
            )}
          </section>

          {/* Images */}
          {images.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <FiImage
                  size={20}
                  className="text-green-600 dark:text-green-500"
                />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Property Images
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {images.length} image{images.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((url, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPreview({ type: "image", src: url })}
                    className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800"
                  >
                    <img
                      src={url}
                      alt={`Land ${index + 1}`}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                      <FiEye
                        size={22}
                        className="text-white opacity-0 transition group-hover:opacity-100"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Videos */}
          {videos.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <FiVideo
                  size={20}
                  className="text-green-600 dark:text-green-500"
                />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Property Videos
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {videos.length} video{videos.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {videos.map((url, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPreview({ type: "video", src: url })}
                    className="group relative overflow-hidden rounded-xl bg-gray-900"
                  >
                    <video
                      src={url}
                      className="aspect-video w-full object-cover"
                      muted
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/30">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-green-600 shadow-lg dark:bg-gray-800 dark:text-green-500">
                        <FiPlay size={20} className="ml-0.5" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar: owner */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Land Owner
            </h2>

            {owner ? (
              <>
                <div className="mt-5 flex items-center gap-4">
                  {owner.avatar ? (
                    <img
                      src={owner.avatar}
                      alt={owner.fullName}
                      className="h-14 w-14 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-100 text-base font-bold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                      {getOwnerInitials(owner.fullName)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900 dark:text-white">
                      {owner.fullName || "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      Property Owner
                    </p>
                  </div>
                </div>

                {owner.email && (
                  <div className="mt-5 flex items-start gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
                    <FiMail
                      size={16}
                      className="mt-0.5 shrink-0 text-green-600 dark:text-green-500"
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Email
                      </p>
                      <p className="mt-1 break-all text-sm text-gray-700 dark:text-gray-300">
                        {owner.email}
                      </p>
                    </div>
                  </div>
                )}

                {owner.phone && (
                  <div className="mt-4 flex items-start gap-3">
                    <FiPhone
                      size={16}
                      className="mt-0.5 shrink-0 text-green-600 dark:text-green-500"
                    />
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Phone
                      </p>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {owner.phone}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Owner information not available.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Metadata
            </h2>

            <div className="mt-4 space-y-3">
              <MetaRow
                icon={<FiCalendar size={14} />}
                label="Created"
                value={formatDate(land.createdAt)}
              />
              <MetaRow
                icon={<FiRefreshCw size={14} />}
                label="Updated"
                value={formatDate(land.updatedAt)}
              />
              <MetaRow
                icon={<FiTag size={14} />}
                label="Land ID"
                value={String(land._id).slice(-8)}
              />
            </div>
          </section>
        </div>
      </div>

      {/* Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
        >
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg transition hover:bg-white dark:bg-gray-800/90 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <FiX size={22} />
          </button>

          <div
            className="max-h-[90vh] max-w-6xl overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {preview.type === "image" ? (
              <img
                src={preview.src}
                alt="Land preview"
                className="max-h-[90vh] max-w-full rounded-2xl object-contain"
              />
            ) : (
              <video
                src={preview.src}
                controls
                autoPlay
                className="max-h-[90vh] max-w-full rounded-2xl"
              />
            )}
          </div>
        </div>
      )}

      {/* Confirm delete */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete this land?"
        message={`Survey No. ${land.surveyNumber} will be permanently removed. This action cannot be undone.`}
        confirmLabel="Yes, Delete"
        loading={deleting}
        onConfirm={performDelete}
        onCancel={() => {
          if (deleting) return;
          setConfirmOpen(false);
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

const InfoRow = ({ label, value, highlight = false }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
    <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
      {label}
    </p>
    <p
      className={`mt-1.5 break-words ${
        highlight
          ? "text-base font-bold text-green-700 dark:text-green-400"
          : "text-sm font-medium text-gray-900 dark:text-white"
      }`}
    >
      {value || "—"}
    </p>
  </div>
);

const MetaRow = ({ icon, label, value }) => (
  <div className="flex items-center justify-between gap-3 text-sm">
    <span className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
      {icon}
      {label}
    </span>
    <span className="font-medium text-gray-900 dark:text-white">{value}</span>
  </div>
);

export default LandDetail;
