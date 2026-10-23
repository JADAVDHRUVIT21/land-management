import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import {
  FiArrowLeft,
  FiEdit3,
  FiEye,
  FiImage,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiPhone,
  FiPlay,
  FiRefreshCw,
  FiUser,
  FiVideo,
  FiX,
  FiNavigation,
  FiExternalLink,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import api from "../services/api";

/* Fix Leaflet marker icon */
const markerIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/* Rent helpers */
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

/* ------------------------------------------------------------------ */
/*  Reverse geocoding (OpenStreetMap Nominatim — free, no API key)     */
/* ------------------------------------------------------------------ */

const reverseGeocode = async (lat, lng, signal) => {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?format=json` +
      `&lat=${lat}` +
      `&lon=${lng}` +
      `&zoom=18` +
      `&addressdetails=1` +
      `&accept-language=en`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
      },
      signal,
    });
    const data = await response.json();
    return data?.display_name || null;
  } catch (err) {
    if (err?.name === "AbortError") return null;
    console.error("Reverse geocode error:", err);
    return null;
  }
};

function LandDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [land, setLand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  /* Reverse-geocoded address */
  const [address, setAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);

  const storedUser = (() => {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  })();

  const getUserId = (user) => {
    if (!user) return null;
    return user._id || user.id || user.userId || null;
  };

  const currentUserId = getUserId(storedUser);

  const getOwnerId = (owner) => {
    if (!owner) return null;
    if (typeof owner === "string") return owner;
    return owner._id || owner.id || null;
  };

  const isOwner =
    land && currentUserId && getOwnerId(land.owner) === currentUserId;

  /* -------- Load land -------- */
  useEffect(() => {
    let cancelled = false;

    const loadLand = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/lands/${id}`);
        if (!cancelled) {
          setLand(response.data?.land || response.data);
        }
      } catch (err) {
        console.error("Land details error:", err);
        if (!cancelled) {
          setError(
            err?.response?.data?.message || "Unable to load land details.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadLand();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* -------- Reverse-geocode once land loads -------- */
  useEffect(() => {
    if (!land) return;

    const lat = land?.location?.latitude;
    const lng = land?.location?.longitude;

    if (
      lat === undefined ||
      lat === null ||
      lat === "" ||
      lng === undefined ||
      lng === null ||
      lng === ""
    ) {
      return;
    }

    const latNum = Number(lat);
    const lngNum = Number(lng);

    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return;

    let cancelled = false;
    const controller = new AbortController();

    const run = async () => {
      setAddressLoading(true);
      const result = await reverseGeocode(latNum, lngNum, controller.signal);
      if (cancelled) return;
      setAddress(result);
      setAddressLoading(false);
    };

    run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [land]);

  const handleRetry = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(`/lands/${id}`);
      setLand(response.data?.land || response.data);
    } catch (err) {
      console.error("Land details error:", err);
      setError(err?.response?.data?.message || "Unable to load land details.");
    } finally {
      setLoading(false);
    }
  };

  const getImages = () => {
    if (!land?.image || !Array.isArray(land.image)) return [];
    return land.image
      .map((item) => {
        if (typeof item === "string") return item;
        return item?.url || null;
      })
      .filter(Boolean);
  };

  const getVideos = () => {
    if (!land?.video || !Array.isArray(land.video)) return [];
    return land.video
      .map((item) => {
        if (typeof item === "string") return item;
        return item?.url || null;
      })
      .filter(Boolean);
  };

  const images = getImages();
  const videos = getVideos();

  const getOwnerName = () => {
    if (!land?.owner) return "Land Owner";
    if (typeof land.owner === "string") return "Land Owner";
    return land.owner.fullName || "Land Owner";
  };

  const getOwnerEmail = () => {
    if (!land?.owner || typeof land.owner === "string") return "";
    return land.owner.email || "";
  };

  const getOwnerPhone = () => {
    if (!land?.owner || typeof land.owner === "string") return "";
    return land.owner.phone || "";
  };

  const handleMessageOwner = () => {
    navigate("/messages", {
      state: { landId: land?._id, land: land, owner: land?.owner },
    });
  };

  /* -------- Location helpers -------- */

  const getLat = () => {
    const v = land?.location?.latitude;
    return v !== undefined && v !== null && v !== "" ? Number(v) : null;
  };

  const getLng = () => {
    const v = land?.location?.longitude;
    return v !== undefined && v !== null && v !== "" ? Number(v) : null;
  };

  const hasCoordinates = () => {
    const lat = getLat();
    const lng = getLng();
    return (
      typeof lat === "number" &&
      !Number.isNaN(lat) &&
      typeof lng === "number" &&
      !Number.isNaN(lng)
    );
  };

  const openInGoogleMaps = () => {
    if (!hasCoordinates()) return;
    const lat = getLat();
    const lng = getLng();
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  /* Build a short, friendly address from village/district/state */
  const shortAddress = [land?.village, land?.district, land?.state]
    .filter(Boolean)
    .join(", ");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <main className="ml-0 min-h-screen lg:ml-[230px]">
          <div className="flex min-h-screen items-center justify-center">
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
              <FiRefreshCw size={20} className="animate-spin" />
              <span className="text-sm">Loading land details...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !land) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <main className="ml-0 min-h-screen lg:ml-[230px]">
          <div className="flex min-h-screen items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-900/40 dark:text-red-400">
                <FiMapPin size={26} />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
                Unable to load land
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {error || "Land details could not be found."}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const rentMode = isRentListing(land);
  const lat = getLat();
  const lng = getLng();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />

      <main className="ml-0 min-h-screen lg:ml-[230px]">
        {/* 🔥 RESTRUCTURED HEADER */}
        <header className="sticky top-16 z-30 mt-16 border-b border-gray-200 bg-white px-5 py-4 sm:px-7 lg:top-0 lg:mt-0 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-4">
            {/* Left side: Back button + Title */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                aria-label="Go back"
              >
                <FiArrowLeft size={18} />
              </button>

              <div>
                <h1 className="text-lg font-bold text-gray-900 sm:text-xl dark:text-white">
                  Land Details
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Survey No. {land.surveyNumber}
                </p>
              </div>
            </div>

            {/* Right side: Action Button */}
            <div>
              {isOwner ? (
                <Link
                  to={`/edit-land/${land._id}`}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-green-600 bg-green-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700 sm:px-4 sm:text-sm"
                >
                  <FiEdit3 size={15} />
                  Edit Land
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleMessageOwner}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-green-600 bg-green-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700 sm:px-4 sm:text-sm"
                >
                  <FiMessageCircle size={15} />
                  Message Owner
                </button>
              )}
            </div>
          </div>
        </header>

        {/* 🔥 ADDED pb-32 HERE */}
        <div className="p-5 pb-32 sm:p-7">
          <div className="mx-auto max-w-7xl">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="relative h-[280px] bg-gray-100 sm:h-[380px] lg:h-[450px] dark:bg-gray-800">
                {images.length > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setPreview({ type: "image", src: images[0] })
                    }
                    className="h-full w-full cursor-pointer"
                  >
                    <img
                      src={images[0]}
                      alt={`Land ${land.surveyNumber}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ) : (
                  <div className="flex h-full items-center justify-center bg-green-50 text-green-400 dark:bg-green-900/20 dark:text-green-500">
                    <FiImage size={55} />
                  </div>
                )}

                <div className="absolute left-4 top-4 flex items-center gap-2">
                  <span
                    className={`rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm ${
                      rentMode ? "bg-blue-600" : "bg-green-600"
                    }`}
                  >
                    {rentMode ? "For Rent" : "For Sale"}
                  </span>
                </div>

                {images.length > 1 && (
                  <div className="absolute bottom-4 right-4 rounded-xl bg-white/95 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm dark:bg-gray-900/90 dark:text-gray-200">
                    {images.length} Images
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Property Information
                      </h2>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Basic information about this land
                      </p>
                    </div>
                    <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                      {land.landType}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Survey Number
                      </p>
                      <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                        {land.surveyNumber}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Area
                      </p>
                      <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                        {land.area} {land.areaUnit || "sqft"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Village
                      </p>
                      <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                        {land.village}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        District
                      </p>
                      <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                        {land.district}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        State
                      </p>
                      <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                        {land.state}
                      </p>
                    </div>

                    <div
                      className={`rounded-xl p-4 ${
                        rentMode
                          ? "bg-blue-50 dark:bg-blue-900/30"
                          : "bg-green-50 dark:bg-green-900/30"
                      }`}
                    >
                      <p
                        className={`text-xs ${
                          rentMode
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {rentMode ? "Monthly Rent" : "Asking Price"}
                      </p>
                      <p
                        className={`mt-1 text-lg font-bold ${
                          rentMode
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-green-700 dark:text-green-400"
                        }`}
                      >
                        ₹{Number(land.price || 0).toLocaleString("en-IN")}
                        {rentMode && rentPeriodSuffix(land.rentPeriod)}
                      </p>
                      {rentMode && !land.rentPeriod && (
                        <p className="mt-0.5 text-[11px] text-blue-500 dark:text-blue-400">
                          Period not specified
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {rentMode && (
                  <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 shadow-sm sm:p-6 dark:border-blue-900/50 dark:bg-blue-900/20">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                        <span className="text-base font-bold">₹</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Rental Details
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Terms for renting this property
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-xl bg-white p-4 dark:bg-gray-800">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Rent Period
                        </p>
                        <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                          {land.rentPeriod || "Not specified"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-4 dark:bg-gray-800">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Minimum Duration
                        </p>
                        <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                          {land.minimumRentDuration || "Not specified"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-4 dark:bg-gray-800">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Security Deposit
                        </p>
                        <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                          {land.securityDeposit !== undefined &&
                          land.securityDeposit !== null &&
                          land.securityDeposit !== ""
                            ? `₹${Number(land.securityDeposit).toLocaleString(
                                "en-IN",
                              )}`
                            : "No deposit"}
                        </p>
                        {land.securityDeposit ? (
                          <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                            Refundable
                          </p>
                        ) : null}
                      </div>

                      <div className="rounded-xl bg-white p-4 dark:bg-gray-800">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Negotiable
                        </p>
                        <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                          {land.isNegotiable ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {land.description && (
                  <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Description
                    </h2>
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-600 dark:text-gray-400">
                      {land.description}
                    </p>
                  </section>
                )}

                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                        <FiMapPin size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Location
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {shortAddress || "Location not specified"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {hasCoordinates() ? (
                    <>
                      <div className="mt-5 flex items-start gap-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                        <FiMapPin
                          size={17}
                          className="mt-0.5 shrink-0 text-green-600 dark:text-green-400"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                            Address
                          </p>
                          {addressLoading ? (
                            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <FiRefreshCw size={13} className="animate-spin" />
                              Finding address...
                            </div>
                          ) : address ? (
                            <p className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-200">
                              {address}
                            </p>
                          ) : (
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              Address not available — click below to view on the
                              map.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={openInGoogleMaps}
                          className="group flex h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                        >
                          <FiNavigation size={16} />
                          Track Location
                          <FiExternalLink
                            size={13}
                            className="opacity-70 transition group-hover:opacity-100"
                          />
                        </button>

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                          <FiMapPin size={16} />
                          Get Directions
                        </a>
                      </div>

                      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                        {/* 🔥 FIXED: Added isolate z-0 and touch-action */}
                        <div
                          className="isolate z-0"
                          style={{ touchAction: "pan-y" }}
                        >
                          <MapContainer
                            center={[lat, lng]}
                            zoom={15}
                            scrollWheelZoom={false}
                            style={{ height: "240px", width: "100%" }}
                          >
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={[lat, lng]} icon={markerIcon}>
                              <Popup>
                                <div className="text-xs">
                                  <strong>
                                    Survey No. {land.surveyNumber}
                                  </strong>
                                  <br />
                                  {land.village}, {land.district}
                                </div>
                              </Popup>
                            </Marker>
                          </MapContainer>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mt-5 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center dark:border-gray-700 dark:bg-gray-800">
                      <FiMapPin
                        size={24}
                        className="mx-auto text-gray-400 dark:text-gray-500"
                      />
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Exact location not provided by the owner.
                      </p>
                    </div>
                  )}
                </section>

                {images.length > 0 && (
                  <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                      <FiImage
                        size={20}
                        className="text-green-600 dark:text-green-400"
                      />
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Property Images
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {images.length} image
                          {images.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {images.map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() =>
                            setPreview({ type: "image", src: image })
                          }
                          className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800"
                        >
                          <img
                            src={image}
                            alt={`Land ${index + 1}`}
                            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                            <FiEye
                              size={24}
                              className="text-white opacity-0 transition group-hover:opacity-100"
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {videos.length > 0 && (
                  <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                      <FiVideo
                        size={20}
                        className="text-green-600 dark:text-green-400"
                      />
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Property Videos
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {videos.length} video
                          {videos.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {videos.map((video, index) => (
                        <button
                          key={`${video}-${index}`}
                          type="button"
                          onClick={() =>
                            setPreview({ type: "video", src: video })
                          }
                          className="group relative overflow-hidden rounded-xl bg-gray-900"
                        >
                          <video
                            src={video}
                            className="aspect-video w-full object-cover"
                            muted
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/30">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-green-600 shadow-lg">
                              <FiPlay size={22} className="ml-1" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div className="space-y-6">
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Land Owner
                  </h2>

                  <div className="mt-5 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                      <FiUser size={25} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900 dark:text-white">
                        {getOwnerName()}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Property Owner
                      </p>
                    </div>
                  </div>

                  {!isOwner && (
                    <button
                      type="button"
                      onClick={handleMessageOwner}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                    >
                      <FiMessageCircle size={17} />
                      Message Owner
                    </button>
                  )}

                  {getOwnerEmail() && (
                    <div className="mt-5 flex items-start gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
                      <FiMail
                        size={17}
                        className="mt-0.5 shrink-0 text-green-600 dark:text-green-400"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Email
                        </p>
                        <p className="mt-1 break-all text-sm text-gray-700 dark:text-gray-300">
                          {getOwnerEmail()}
                        </p>
                      </div>
                    </div>
                  )}

                  {getOwnerPhone() && (
                    <div className="mt-4 flex items-start gap-3">
                      <FiPhone
                        size={17}
                        className="mt-0.5 shrink-0 text-green-600 dark:text-green-400"
                      />
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Phone
                        </p>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                          {getOwnerPhone()}
                        </p>
                      </div>
                    </div>
                  )}
                </section>

                {isOwner && (
                  <section className="rounded-2xl border border-green-100 bg-green-50 p-5 dark:border-green-800 dark:bg-green-900/20">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      This is your land.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-green-700 dark:text-green-400">
                      You can update your property information, images, videos
                      and listing details.
                    </p>

                    <Link
                      to={`/edit-land/${land._id}`}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-green-600 bg-white px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100 dark:bg-gray-900 dark:text-green-400 dark:hover:bg-green-900/40"
                    >
                      <FiEdit3 size={17} />
                      Edit Land
                    </Link>
                  </section>
                )}

                {!isOwner && (
                  <section className="rounded-2xl border border-green-100 bg-green-50 p-5 dark:border-green-800 dark:bg-green-900/20">
                    <h3 className="font-semibold text-green-900 dark:text-green-300">
                      Interested in this land?
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-green-700 dark:text-green-400">
                      Send a message to the owner to ask questions or discuss
                      the property.
                    </p>
                    <button
                      type="button"
                      onClick={handleMessageOwner}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      <FiMessageCircle size={17} />
                      Message Owner
                    </button>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {preview && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
        >
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg transition hover:bg-white"
          >
            <FiX size={22} />
          </button>

          <div
            className="max-h-[90vh] max-w-6xl overflow-hidden rounded-2xl"
            onClick={(event) => event.stopPropagation()}
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
    </div>
  );
}

export default LandDetail;
