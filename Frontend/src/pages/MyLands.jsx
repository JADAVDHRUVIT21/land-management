import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiEye,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiPlus,
  FiMapPin,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiTag,
  FiImage,
  FiVideo,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import api from "../services/api";

/* ------------------------------------------------------------------ */
/*  Confirm Modal                                                      */
/* ------------------------------------------------------------------ */

const ConfirmModal = ({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
            <FiAlertCircle size={26} />
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
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
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

/* ------------------------------------------------------------------ */
/*  Toast                                                              */
/* ------------------------------------------------------------------ */

const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3200);
    return () => clearTimeout(timer);
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

/* ------------------------------------------------------------------ */
/*  Media URL helpers                                                  */
/* ------------------------------------------------------------------ */

const getFirstImageUrl = (land) => {
  if (!land?.image) return null;
  const img = land.image;

  if (Array.isArray(img)) {
    if (img.length === 0) return null;
    const first = img[0];
    if (!first) return null;
    if (typeof first === "string") return first;
    if (typeof first === "object" && first.url) return first.url;
    return null;
  }

  if (typeof img === "string") return img;
  if (typeof img === "object" && img.url) return img.url;
  return null;
};

const getImageCount = (land) =>
  Array.isArray(land?.image) ? land.image.length : 0;

const getVideoCount = (land) =>
  Array.isArray(land?.video) ? land.video.length : 0;

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

const MyLands = () => {
  const navigate = useNavigate();

  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [toast, setToast] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [togglingId, setTogglingId] = useState(null);

  const fetchMyLands = useCallback(async () => {
    try {
      const response = await api.get("/lands/my");
      // eslint-disable-next-line no-console
      console.log("MyLands GET response:", response.data?.lands);
      setLands(response.data?.lands || []);
    } catch (error) {
      console.error("Fetch My Lands Error:", error);
      setToast({
        message:
          error.response?.data?.message ||
          "Failed to load your lands. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const run = () => fetchMyLands();
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMyLands();
  };

  const requestDelete = (land) => {
    setConfirmTarget(land);
    setConfirmOpen(true);
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setConfirmTarget(null);
  };

  const confirmDelete = async () => {
    if (!confirmTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/lands/${confirmTarget._id}`);
      setLands((current) =>
        current.filter((item) => item._id !== confirmTarget._id),
      );
      setToast({ message: "Land deleted successfully.", type: "success" });
      setConfirmOpen(false);
      setConfirmTarget(null);
    } catch (error) {
      console.error("Delete Land Error:", error);
      setToast({
        message:
          error.response?.data?.message ||
          "Failed to delete the land. Please try again.",
        type: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const toggleListing = async (land) => {
    try {
      setTogglingId(land._id);
      const nextIsForSale = !land.isForSale;
      const response = await api.patch(`/lands/${land._id}/for-sale`, {
        isForSale: nextIsForSale,
      });
      const updated = response.data?.land;
      setLands((current) =>
        current.map((item) =>
          item._id === land._id
            ? updated || { ...item, ...land, isForSale: nextIsForSale }
            : item,
        ),
      );
      setToast({
        message: nextIsForSale
          ? "Land is now listed for sale."
          : "Land moved back to draft.",
        type: "success",
      });
    } catch (error) {
      console.error("Toggle Listing Error:", error);
      setToast({
        message:
          error.response?.data?.message ||
          "Failed to update the listing. Please try again.",
        type: "error",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const formatPrice = (value) => {
    if (value === undefined || value === null || value === "") return "—";
    return `₹${Number(value).toLocaleString("en-IN")}`;
  };

  const formatArea = (land) => {
    if (!land?.area) return "—";
    const unit = land.areaUnit ? ` ${land.areaUnit}` : "";
    return `${land.area}${unit}`;
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50">
      <Sidebar />

      <div className="w-full lg:pl-64">
        <header className="sticky top-0 z-30 mt-16 border-b border-gray-200 bg-white lg:mt-0">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:h-20 lg:px-8">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">
                My Lands
              </h1>
              <p className="mt-1 hidden text-sm text-gray-500 sm:block">
                Manage your land properties and listings
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/add-land")}
              className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              <FiPlus size={16} />
              <span className="hidden sm:inline">Add Land</span>
            </button>
          </div>
        </header>

        <main className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto mb-6 flex w-full max-w-6xl items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Your Properties
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {lands.length} {lands.length === 1 ? "property" : "properties"}{" "}
                in your portfolio
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
            >
              <FiRefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          <div className="mx-auto w-full max-w-6xl">
            {loading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-80 animate-pulse rounded-3xl border border-gray-200 bg-white"
                  />
                ))}
              </div>
            ) : lands.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                  <FiMapPin size={26} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  No lands yet
                </h3>
                <p className="mt-2 max-w-sm text-sm text-gray-500">
                  Start building your land portfolio by adding your first
                  property.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/add-land")}
                  className="mt-5 flex h-11 items-center gap-2 rounded-2xl bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  <FiPlus size={16} />
                  Add Land
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {lands.map((land) => {
                  const firstImageUrl = getFirstImageUrl(land);
                  const imageCount = getImageCount(land);
                  const videoCount = getVideoCount(land);

                  return (
                    <div
                      key={land._id}
                      className="flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                    >
                      <div className="relative h-44 w-full bg-gray-100">
                        {firstImageUrl ? (
                          <img
                            src={firstImageUrl}
                            alt={land.surveyNumber}
                            className="h-44 w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const parent = e.currentTarget.parentElement;
                              if (
                                parent &&
                                !parent.querySelector("[data-fallback-pin]")
                              ) {
                                const fallback = document.createElement("div");
                                fallback.setAttribute(
                                  "data-fallback-pin",
                                  "true",
                                );
                                fallback.className =
                                  "flex h-44 w-full items-center justify-center text-gray-300";
                                fallback.innerHTML =
                                  '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <div className="flex h-44 w-full items-center justify-center text-gray-300">
                            <FiMapPin size={40} />
                          </div>
                        )}

                        <div className="absolute left-3 top-3">
                          {land.isForSale ? (
                            <span className="flex items-center gap-1.5 rounded-full bg-green-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
                              <FiTag size={11} />
                              Listed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 rounded-full bg-gray-900/80 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
                              Not Listed
                            </span>
                          )}
                        </div>

                        {(imageCount > 0 || videoCount > 0) && (
                          <div className="absolute right-3 top-3 flex items-center gap-1.5">
                            {imageCount > 0 && (
                              <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
                                <FiImage size={11} />
                                {imageCount}
                              </span>
                            )}
                            {videoCount > 0 && (
                              <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
                                <FiVideo size={11} />
                                {videoCount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="truncate text-base font-semibold text-gray-900">
                            Survey No. {land.surveyNumber}
                          </h3>
                          <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                            {land.landType}
                          </span>
                        </div>

                        <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                          <FiMapPin size={12} />
                          <span className="truncate">
                            {[land.village, land.district, land.state]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-gray-50 p-3">
                          <div>
                            <p className="text-[11px] font-medium text-gray-400">
                              Area
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-gray-800">
                              {formatArea(land)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-gray-400">
                              Price
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-gray-800">
                              {formatPrice(land.price)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/lands/${land._id}`)}
                            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                          >
                            <FiEye size={14} />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/edit-land/${land._id}`)}
                            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                          >
                            <FiEdit2 size={14} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDelete(land)}
                            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                          >
                            <FiTrash2 size={14} />
                            Delete
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleListing(land)}
                          disabled={togglingId === land._id}
                          className={`mt-2 flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            land.isForSale
                              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {togglingId === land._id ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Updating...
                            </>
                          ) : land.isForSale ? (
                            <>
                              <FiX size={15} />
                              Remove from Sale
                            </>
                          ) : (
                            <>
                              <FiTag size={15} />
                              List for Sale
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete this land?"
        message={
          confirmTarget
            ? `"Survey No. ${confirmTarget.surveyNumber}" will be permanently removed. This action cannot be undone.`
            : ""
        }
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default MyLands;
