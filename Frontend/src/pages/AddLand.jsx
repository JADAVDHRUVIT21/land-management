import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
  ZoomControl,
} from "react-leaflet";

import L from "leaflet";

import {
  FiArrowLeft,
  FiUploadCloud,
  FiMapPin,
  FiImage,
  FiVideo,
  FiCheck,
  FiX,
  FiNavigation,
  FiSearch,
  FiChevronDown,
  FiZoomIn,
  FiZoomOut,
  FiAlertCircle,
  FiCamera,
  FiFolder,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import api from "../services/api";

/* marker icon (unchanged) */
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

const DEFAULT_LOCATION = [22.2587, 71.1924];

const AREA_UNITS = [
  { value: "sqft", label: "Sq Ft" },
  { value: "sqyd", label: "Sq Yd" },
  { value: "sqm", label: "Sq M" },
  { value: "acre", label: "Acre" },
  { value: "hectare", label: "Hectare" },
  { value: "guntha", label: "Guntha" },
  { value: "bigha", label: "Bigha" },
];

const RENT_PERIODS = [
  { value: "", label: "Select period (optional)" },
  { value: "Per Month", label: "Per Month" },
  { value: "Per Year", label: "Per Year" },
  { value: "Per Day", label: "Per Day" },
  { value: "Per Week", label: "Per Week" },
];

// 🔥 UPDATED: Only House, Flat, Land, Hostel
const LAND_TYPES = [
  { value: "House", label: "House" },
  { value: "Flat", label: "Flat" },
  { value: "Land", label: "Land" },
  { value: "Hostel", label: "Hostel" },
];

/* ---------------- LocationMarker ---------------- */
const LocationMarker = ({ position, setPosition, setFormData }) => {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      setPosition([lat, lng]);
      setFormData((current) => ({
        ...current,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      }));
    },
  });
  if (!position) return null;
  return <Marker position={position} icon={markerIcon} />;
};

/* ---------------- MapController ---------------- */
const MapController = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    map.flyTo(position, Math.max(map.getZoom(), 15), { duration: 1 });
  }, [position, map]);
  return null;
};

/* ---------------- MapSearch ---------------- */
const MapSearch = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearching(true);
    setShowResults(true);
    setSearchError("");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          trimmed,
        )}&limit=5`,
        { headers: { Accept: "application/json" } },
      );
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        setResults([]);
        setSearchError("No matching locations found.");
      } else {
        setResults(data);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
      setSearchError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      performSearch();
    }
  };

  const handleSelectResult = (result) => {
    onSearch([parseFloat(result.lat), parseFloat(result.lon)]);
    setShowResults(false);
    setQuery(result.display_name);
  };

  return (
    <div
      ref={containerRef}
      className="absolute left-3 right-3 top-3 z-[1000] sm:left-4 sm:right-auto sm:w-80"
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FiSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search location..."
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 shadow-md outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-green-900/40"
          />
        </div>
        <button
          type="button"
          onClick={performSearch}
          disabled={searching}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-gray-600 shadow-md transition hover:bg-gray-50 disabled:opacity-60 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {searching ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
          ) : (
            <FiSearch size={16} />
          )}
        </button>
      </div>

      {showResults && results.length > 0 && (
        <div className="mt-1 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {results.map((result, index) => (
            <button
              key={`${result.place_id}-${index}`}
              type="button"
              onClick={() => handleSelectResult(result)}
              className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <FiMapPin
                size={14}
                className="mt-0.5 shrink-0 text-green-600 dark:text-green-400"
              />
              <span className="line-clamp-2">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {showResults && !searching && searchError && (
        <div className="mt-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-500 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          {searchError}
        </div>
      )}
    </div>
  );
};

/* ---------------- MediaPreviewModal ---------------- */
const MediaPreviewModal = ({ media, onClose, type = "image" }) => {
  const [currentIndex, setCurrentIndex] = useState(media?.index ?? 0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const zoomIn = () => setZoom((z) => Math.min(z + 0.5, 5));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.5, 1));

  const goToIndex = (nextIndex) => {
    setCurrentIndex(nextIndex);
    resetView();
  };

  const goNext = () => {
    if (!media?.items || media.items.length <= 1) return;
    const next = currentIndex === media.items.length - 1 ? 0 : currentIndex + 1;
    goToIndex(next);
  };

  const goPrev = () => {
    if (!media?.items || media.items.length <= 1) return;
    const prev = currentIndex === 0 ? media.items.length - 1 : currentIndex - 1;
    goToIndex(prev);
  };

  const handleWheel = (e) => {
    if (type !== "image") return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setZoom((z) => Math.min(Math.max(z + delta, 1), 5));
  };

  const handleMouseDown = (e) => {
    if (type !== "image" || zoom <= 1) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media, onClose, currentIndex]);

  if (!media || !media.items || media.items.length === 0) return null;

  const currentItem = media.items[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <FiX size={20} />
      </button>

      <div className="absolute left-4 top-4 z-20 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white">
        {currentIndex + 1} / {media.items.length}
      </div>

      {type === "image" && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/10 px-2 py-1.5 backdrop-blur">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              zoomOut();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/20"
          >
            <FiZoomOut size={18} />
          </button>
          <span className="min-w-[52px] text-center text-xs text-white">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              zoomIn();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/20"
          >
            <FiZoomIn size={18} />
          </button>
          {zoom > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetView();
              }}
              className="ml-1 rounded-full px-3 py-1.5 text-xs text-white transition hover:bg-white/20"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {media.items.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <FiArrowLeft size={20} />
        </button>
      )}

      {media.items.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <FiArrowLeft size={20} className="rotate-180" />
        </button>
      )}

      <div
        className="flex h-full max-h-[90vh] w-full max-w-[95vw] select-none items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        style={{ cursor: type === "image" && zoom > 1 ? "grab" : "default" }}
      >
        {type === "image" ? (
          <img
            src={URL.createObjectURL(currentItem)}
            alt={`Preview ${currentIndex + 1}`}
            draggable={false}
            className="max-h-[85vh] max-w-[90vw] object-contain transition-transform duration-100"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          />
        ) : (
          <video
            src={URL.createObjectURL(currentItem)}
            controls
            autoPlay
            className="max-h-[85vh] max-w-[90vw] rounded-lg"
          />
        )}
      </div>
    </div>
  );
};

/* ---------------- IOSSelect ---------------- */
const IOSSelect = ({ label, name, value, onChange, options, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  const baseBorder = error
    ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100 dark:border-red-800 dark:bg-red-900/30 dark:focus:ring-red-900/40"
    : "border-gray-200 bg-gray-50 focus:border-green-500 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-green-900/40";

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-12 w-full items-center justify-between gap-2 rounded-2xl border px-4 text-sm text-gray-900 outline-none transition focus:bg-white focus:ring-4 dark:text-white dark:focus:bg-gray-900 ${baseBorder}`}
      >
        <span className="truncate text-left">
          {selectedOption?.label || "Select..."}
        </span>
        <FiChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform dark:text-gray-500 ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm transition ${option.value === value
                ? "bg-green-50 font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && (
                <FiCheck
                  size={16}
                  className="shrink-0 text-green-600 dark:text-green-400"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------------- Toast ---------------- */
const Toast = ({ message, type = "error", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
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
        <FiAlertCircle size={16} />
        <span>{message}</span>
        <button type="button" onClick={onClose} className="ml-2 shrink-0">
          <FiX size={16} />
        </button>
      </div>
    </div>
  );
};

/* ---------------- Main Component ---------------- */
const AddLand = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    surveyNumber: "",
    area: "",
    areaUnit: "sqft",
    village: "",
    district: "",
    state: "",
    landType: "House", // 🔥 Default updated to House
    listingType: "For Sale",
    price: "",
    description: "",
    latitude: "",
    longitude: "",
    rentPeriod: "",
    minimumRentDuration: "",
    securityDeposit: "",
    isNegotiable: false,
  });

  const [mapPosition, setMapPosition] = useState(DEFAULT_LOCATION);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [toast, setToast] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [previewMedia, setPreviewMedia] = useState(null);
  const [previewType, setPreviewType] = useState("image");
  const [previewKey, setPreviewKey] = useState(0);

  // Camera/gallery source picker for images and videos.
  const [mediaSourceModal, setMediaSourceModal] = useState(null);
  const cameraImageInputRef = useRef(null);
  const galleryImageInputRef = useRef(null);
  const cameraVideoInputRef = useRef(null);
  const galleryVideoInputRef = useRef(null);

  const isRentListing = formData.listingType === "For Rent";

  const clearFieldError = (name) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    clearFieldError(name);

    if (name === "price") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData((current) => ({ ...current, price: numericValue }));
      return;
    }

    if (name === "securityDeposit") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData((current) => ({
        ...current,
        securityDeposit: numericValue,
      }));
      return;
    }

    if (name === "area") {
      const cleaned = value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
      setFormData((current) => ({ ...current, area: cleaned }));
      return;
    }

    if (name === "isNegotiable") {
      setFormData((current) => ({
        ...current,
        isNegotiable: Boolean(value),
      }));
      return;
    }

    setFormData((current) => ({ ...current, [name]: value }));
  };

  const formatPrice = (value) => {
    if (!value) return "";
    return Number(value).toLocaleString("en-IN");
  };

  const handleLocationSearch = useCallback((position) => {
    setMapPosition(position);
    setFormData((current) => ({
      ...current,
      latitude: position[0].toFixed(6),
      longitude: position[1].toFixed(6),
    }));
    clearFieldError("latitude");
    clearFieldError("longitude");
  }, []);

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    if (selectedFiles.length === 0) return;

    const oversized = selectedFiles.filter(
      (file) => file.size > 10 * 1024 * 1024,
    );
    const validFiles = selectedFiles.filter(
      (file) => file.size <= 10 * 1024 * 1024,
    );

    if (oversized.length > 0) {
      setToast({
        message: `${oversized.length} image(s) exceed 10MB and were skipped.`,
        type: "error",
      });
    }

    setImages((current) => {
      const remaining = 10 - current.length;
      if (remaining <= 0) {
        setToast({
          message: "You already have 10 images. Remove some to add more.",
          type: "error",
        });
        return current;
      }
      const toAdd = validFiles.slice(0, remaining);
      if (toAdd.length < validFiles.length) {
        setToast({
          message: `Only ${toAdd.length} image(s) added. Max limit is 10.`,
          type: "error",
        });
      }
      return [...current, ...toAdd];
    });
  };

  const openMediaSource = (type) => {
    const currentCount = type === "image" ? images.length : videos.length;
    const maxCount = type === "image" ? 10 : 5;

    if (currentCount >= maxCount) {
      setToast({
        message: `Maximum ${maxCount} ${type}s reached. Remove some to add more.`,
        type: "error",
      });
      return;
    }

    setMediaSourceModal(type);
  };

  const openMediaPicker = (source) => {
    const inputRefs = {
      cameraImage: cameraImageInputRef,
      galleryImage: galleryImageInputRef,
      cameraVideo: cameraVideoInputRef,
      galleryVideo: galleryVideoInputRef,
    };
    const inputRef = inputRefs[source];
    setMediaSourceModal(null);

    // Let the modal close before opening the native picker/camera.
    window.setTimeout(() => inputRef?.current?.click(), 150);
  };

  const handleVideoChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    if (selectedFiles.length === 0) return;

    const oversized = selectedFiles.filter(
      (file) => file.size > 50 * 1024 * 1024,
    );
    const validFiles = selectedFiles.filter(
      (file) => file.size <= 50 * 1024 * 1024,
    );

    if (oversized.length > 0) {
      setToast({
        message: `${oversized.length} video(s) exceed 50MB and were skipped.`,
        type: "error",
      });
    }

    setVideos((current) => {
      const remaining = 5 - current.length;
      if (remaining <= 0) {
        setToast({
          message: "You already have 5 videos. Remove some to add more.",
          type: "error",
        });
        return current;
      }
      const toAdd = validFiles.slice(0, remaining);
      if (toAdd.length < validFiles.length) {
        setToast({
          message: `Only ${toAdd.length} video(s) added. Max limit is 5.`,
          type: "error",
        });
      }
      return [...current, ...toAdd];
    });
  };

  const removeImage = (index) => {
    setImages((current) =>
      current.filter((_, imageIndex) => imageIndex !== index),
    );
  };

  const removeVideo = (index) => {
    setVideos((current) =>
      current.filter((_, videoIndex) => videoIndex !== index),
    );
  };

  const openPreview = (items, index, type) => {
    setPreviewMedia({ items, index });
    setPreviewType(type);
    setPreviewKey((k) => k + 1);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setToast({
        message: "Geolocation is not supported by your browser.",
        type: "error",
      });
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (location) => {
        const latitude = location.coords.latitude;
        const longitude = location.coords.longitude;

        setMapPosition([latitude, longitude]);
        setFormData((current) => ({
          ...current,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }));
        clearFieldError("latitude");
        clearFieldError("longitude");
        setLocationLoading(false);
      },
      (locationError) => {
        console.error("Location Error:", locationError);

        let message = "Unable to get your current location.";
        if (locationError.code === 1) {
          message =
            "Location permission was denied. Please allow location access in your browser.";
        }
        if (locationError.code === 2) {
          message = "Your current location could not be determined.";
        }
        if (locationError.code === 3) {
          message = "Location request timed out. Please try again.";
        }

        setToast({ message, type: "error" });
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const validate = () => {
    const errors = {};

    // Survey Number is OPTIONAL
    if (!formData.area.trim()) errors.area = true;
    if (!formData.village.trim()) errors.village = true;
    if (!formData.district.trim()) errors.district = true;
    if (!formData.state.trim()) errors.state = true;
    if (!formData.price || Number(formData.price) <= 0) errors.price = true;

    if (!formData.latitude || !formData.longitude) {
      errors.latitude = true;
      errors.longitude = true;
    }

    if (
      isRentListing &&
      formData.securityDeposit &&
      Number(formData.securityDeposit) < 0
    ) {
      errors.securityDeposit = true;
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validate();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setToast({
        message: "Please fill all required fields marked in red.",
        type: "error",
      });
      const firstKey = Object.keys(errors)[0];
      const el = document.querySelector(`[name="${firstKey}"]`);
      if (el && el.scrollIntoView) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setFieldErrors({});
    setToast(null);

    try {
      setLoading(true);

      const data = new FormData();

      if (formData.surveyNumber.trim()) {
        data.append("surveyNumber", formData.surveyNumber.trim());
      }
      data.append("area", String(Number(formData.area)));
      data.append("areaUnit", formData.areaUnit);
      data.append("village", formData.village.trim());
      data.append("district", formData.district.trim());
      data.append("state", formData.state.trim());
      data.append("landType", formData.landType);
      data.append("listingType", formData.listingType);
      data.append("price", String(Number(formData.price)));
      data.append("description", formData.description.trim());

      if (isRentListing) {
        if (formData.rentPeriod) {
          data.append("rentPeriod", formData.rentPeriod);
        }
        if (formData.minimumRentDuration.trim()) {
          data.append(
            "minimumRentDuration",
            formData.minimumRentDuration.trim(),
          );
        }
        if (
          formData.securityDeposit !== "" &&
          formData.securityDeposit !== null
        ) {
          data.append(
            "securityDeposit",
            String(Number(formData.securityDeposit)),
          );
        }
        data.append("isNegotiable", String(formData.isNegotiable));
      }

      data.append(
        "location",
        JSON.stringify({
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
        }),
      );

      images.forEach((image) => data.append("image", image));
      videos.forEach((video) => data.append("video", video));

      for (const [key, value] of data.entries()) {
        console.log(
          key,
          value instanceof File ? value.name : value
        );
      }
      const response = await api.post("/lands", data);
      console.log("Create Land response:", response.data);

      setToast({
        message: "Land property added successfully.",
        type: "success",
      });

      setTimeout(() => {
        navigate("/my-lands");
      }, 900);
    } catch (err) {
      console.error("Add Land Error:", err);

      const serverData = err.response?.data;

      // Log exact backend response for debugging
      console.log("Backend Error Message:", serverData);
      console.log("Backend Status:", err.response?.status);

      let message = "Failed to add the land. Please try again.";

      if (typeof serverData === "string") {
        message = serverData;
      } else if (serverData?.message) {
        message = serverData.message;
      } else if (serverData?.error) {
        message = serverData.error;
      } else if (serverData?.errors) {
        const firstKey = Object.keys(serverData.errors)[0];
        const firstError = serverData.errors[firstKey];

        message =
          typeof firstError === "string"
            ? firstError
            : firstError?.message || message;
      } else if (err.message) {
        message = err.message;
      }

      setToast({
        message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (name) => {
    const hasError = fieldErrors[name];
    return `h-12 w-full rounded-2xl border px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-4 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-900 ${hasError
      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100 dark:border-red-800 dark:bg-red-900/30 dark:focus:ring-red-900/40"
      : "border-gray-200 bg-gray-50 focus:border-green-500 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-green-900/40"
      }`;
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50 dark:bg-gray-950">
      {/* Separate hidden inputs allow camera capture and gallery selection. */}
      <input
        ref={cameraImageInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageChange}
        className="hidden"
        aria-label="Take property photo"
      />
      <input
        ref={galleryImageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageChange}
        className="hidden"
        aria-label="Choose property images from gallery"
      />
      <input
        ref={cameraVideoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        onChange={handleVideoChange}
        className="hidden"
        aria-label="Record property video"
      />
      <input
        ref={galleryVideoInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleVideoChange}
        className="hidden"
        aria-label="Choose property videos from gallery"
      />

      <Sidebar />

      <div className="w-full lg:pl-64">
        <header className="sticky top-0 z-30 mt-16 border-b border-gray-200 bg-white lg:mt-0 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:h-20 lg:px-8">
            <button
              type="button"
              onClick={() => navigate("/my-lands")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <FiArrowLeft size={19} />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                Add Land
              </h1>

              <p className="mt-1 hidden text-sm text-gray-500 sm:block dark:text-gray-400">
                Add a new property to your land portfolio
              </p>
            </div>
          </div>
        </header>

        {/* 🔥 ADDED pb-32 HERE */}
        <main className="w-full px-4 py-6 pb-32 sm:px-6 lg:px-8 lg:py-8">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="mx-auto w-full max-w-4xl"
          >
            {/* Property Information */}
            <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-100 px-5 py-5 sm:px-7 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Property Information
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enter the basic details of your land.
                </p>
              </div>

              <div className="space-y-6 p-5 sm:p-7">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Survey Number
                      <span className="ml-1 text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="surveyNumber"
                      value={formData.surveyNumber}
                      onChange={handleChange}
                      placeholder="Enter survey number"
                      className={inputClass("surveyNumber")}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Area
                      <span className="ml-1 text-green-600">*</span>
                    </label>
                    <div className="flex items-stretch gap-2">
                      <input
                        type="text"
                        name="area"
                        value={formData.area}
                        onChange={handleChange}
                        placeholder="e.g. 1200"
                        inputMode="decimal"
                        className={`${inputClass("area")} min-w-0 flex-1`}
                      />
                      <div className="w-32 shrink-0 sm:w-36">
                        <IOSSelect
                          label=""
                          name="areaUnit"
                          value={formData.areaUnit}
                          onChange={handleChange}
                          options={AREA_UNITS}
                        />
                      </div>
                    </div>
                    {fieldErrors.area && (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                        Area is required.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Village
                      <span className="ml-1 text-green-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="village"
                      value={formData.village}
                      onChange={handleChange}
                      placeholder="Enter village"
                      className={inputClass("village")}
                    />
                    {fieldErrors.village && (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                        Village is required.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      District
                      <span className="ml-1 text-green-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      placeholder="Enter district"
                      className={inputClass("district")}
                    />
                    {fieldErrors.district && (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                        District is required.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      State <span className="ml-1 text-green-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Enter state"
                      className={inputClass("state")}
                    />
                    {fieldErrors.state && (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                        State is required.
                      </p>
                    )}
                  </div>

                  {/* 🔥 UPDATED DROPDOWN */}
                  <IOSSelect
                    label="Land Type"
                    name="landType"
                    value={formData.landType}
                    onChange={handleChange}
                    options={LAND_TYPES}
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <IOSSelect
                    label="Listing Type"
                    name="listingType"
                    value={formData.listingType}
                    onChange={handleChange}
                    options={[
                      { value: "For Sale", label: "For Sale" },
                      { value: "For Rent", label: "For Rent" },
                    ]}
                  />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Price
                      <span className="ml-1 text-green-600">*</span>
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                        ₹
                      </span>
                      <input
                        type="text"
                        name="price"
                        value={formatPrice(formData.price)}
                        onChange={handleChange}
                        placeholder={
                          isRentListing
                            ? "Enter rent price"
                            : "Enter property price"
                        }
                        inputMode="numeric"
                        className={`${inputClass("price")} pl-8`}
                      />
                    </div>

                    {fieldErrors.price && (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                        Price is required.
                      </p>
                    )}

                    {formData.price && !fieldErrors.price && (
                      <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                        {Number(formData.price).toLocaleString("en-IN")} INR
                        {isRentListing && formData.rentPeriod
                          ? ` ${formData.rentPeriod.toLowerCase()}`
                          : ""}
                      </p>
                    )}
                  </div>
                </div>

                {isRentListing && (
                  <div className="space-y-6 rounded-2xl border border-green-100 bg-green-50/40 p-4 sm:p-5 dark:border-green-800 dark:bg-green-900/20">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
                        <span className="text-xs font-bold">₹</span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Rental details (optional)
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <IOSSelect
                        label="Rent Period"
                        name="rentPeriod"
                        value={formData.rentPeriod}
                        onChange={handleChange}
                        options={RENT_PERIODS}
                      />

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Minimum Rent Duration
                        </label>
                        <input
                          type="text"
                          name="minimumRentDuration"
                          value={formData.minimumRentDuration}
                          onChange={handleChange}
                          placeholder="e.g. 6 months"
                          className={inputClass("minimumRentDuration")}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Security Deposit
                        </label>

                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                            ₹
                          </span>
                          <input
                            type="text"
                            name="securityDeposit"
                            value={formatPrice(formData.securityDeposit)}
                            onChange={handleChange}
                            placeholder="Enter deposit amount"
                            inputMode="numeric"
                            className={`${inputClass("securityDeposit")} pl-8`}
                          />
                        </div>

                        {fieldErrors.securityDeposit && (
                          <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                            Deposit must be a valid non-negative number.
                          </p>
                        )}

                        {formData.securityDeposit &&
                          !fieldErrors.securityDeposit && (
                            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                              {Number(formData.securityDeposit).toLocaleString(
                                "en-IN",
                              )}{" "}
                              INR (refundable)
                            </p>
                          )}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Negotiable
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            handleChange({
                              target: {
                                name: "isNegotiable",
                                value: !formData.isNegotiable,
                              },
                            })
                          }
                          className={`flex h-12 w-full items-center justify-between gap-2 rounded-2xl border px-4 text-sm font-medium transition ${formData.isNegotiable
                            ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            }`}
                        >
                          <span>
                            {formData.isNegotiable
                              ? "Price is negotiable"
                              : "Price is fixed"}
                          </span>
                          <span
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${formData.isNegotiable
                              ? "bg-green-600"
                              : "bg-gray-300 dark:bg-gray-600"
                              }`}
                          >
                            <span
                              className={`absolute h-4 w-4 transform rounded-full bg-white shadow transition ${formData.isNegotiable
                                ? "translate-x-6"
                                : "translate-x-1"
                                }`}
                            />
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Describe your land property..."
                    className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-900 dark:focus:ring-green-900/40"
                  />
                </div>
              </div>
            </section>

            {/* Location */}
            <section className="mt-5 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-100 px-5 py-5 sm:px-7 dark:border-gray-800">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                      <FiMapPin size={19} />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Property Location
                        <span className="ml-1 text-green-600">*</span>
                      </h2>

                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Click on the map or search to select the land location.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locationLoading}
                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-green-50 px-4 text-sm font-semibold text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                  >
                    {locationLoading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                        Locating...
                      </>
                    ) : (
                      <>
                        <FiNavigation size={16} />
                        Use Current Location
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div
                  className={`relative overflow-hidden rounded-2xl border ${fieldErrors.latitude
                    ? "border-red-300 dark:border-red-800"
                    : "border-gray-200 dark:border-gray-700"
                    }`}
                >
                  {/* 🔥 FIXED: Added isolate z-0 and touch-action to prevent overlap */}
                  <div className="isolate z-0" style={{ touchAction: "pan-y" }}>
                    <MapContainer
                      center={mapPosition}
                      zoom={7}
                      scrollWheelZoom={true}
                      zoomControl={false}
                      className="h-[320px] w-full sm:h-[420px]"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      <ZoomControl position="topright" />

                      <LocationMarker
                        position={mapPosition}
                        setPosition={setMapPosition}
                        setFormData={setFormData}
                      />

                      <MapController position={mapPosition} />

                      <MapSearch onSearch={handleLocationSearch} />
                    </MapContainer>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CoordinateBox
                    label="Latitude"
                    value={formData.latitude}
                    error={fieldErrors.latitude}
                  />

                  <CoordinateBox
                    label="Longitude"
                    value={formData.longitude}
                    error={fieldErrors.longitude}
                  />
                </div>

                {fieldErrors.latitude && (
                  <p className="mt-2 text-xs text-red-500 dark:text-red-400">
                    Please select a location on the map.
                  </p>
                )}

                <div className="mt-4 flex items-start gap-3 rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800">
                  <FiMapPin
                    size={17}
                    className="mt-0.5 shrink-0 text-green-600 dark:text-green-400"
                  />

                  <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Click anywhere on the map to place the land marker. You can
                    drag and zoom the map to find the exact location. Use the
                    search bar to find a location directly.
                  </p>
                </div>
              </div>
            </section>

            {/* Media */}
            <section className="mt-5 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-100 px-5 py-5 sm:px-7 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Property Media
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Add photos and videos of your property.
                </p>
              </div>

              <div className="space-y-6 p-5 sm:p-7">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Property Images
                    </label>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {images.length}/10 images • Max 10MB each
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openMediaSource("image")}
                    disabled={images.length >= 10}
                    className={`flex min-h-36 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-6 text-center transition disabled:cursor-not-allowed disabled:opacity-60 ${images.length >= 10
                      ? "border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
                      : "border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50/40 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-700 dark:hover:bg-green-900/20"
                      }`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-green-600 shadow-sm dark:bg-gray-900 dark:text-green-400">
                      <FiImage size={22} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {images.length >= 10 ? "Maximum 10 images reached" : "Add property images"}
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      Choose camera or device gallery
                    </p>
                  </button>

                  {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {images.map((image, index) => (
                        <div
                          key={`${image.name}-${index}-${image.lastModified}`}
                          className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
                        >
                          <button
                            type="button"
                            onClick={() => openPreview(images, index, "image")}
                            className="block h-28 w-full"
                          >
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Property ${index + 1}`}
                              className="h-28 w-full object-cover transition group-hover:scale-105"
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-red-500"
                          >
                            <FiX size={14} />
                          </button>

                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                            <p className="truncate text-[10px] text-white">
                              {(image.size / (1024 * 1024)).toFixed(1)} MB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Property Videos
                    </label>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {videos.length}/5 videos • Max 50MB each
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openMediaSource("video")}
                    disabled={videos.length >= 5}
                    className={`flex min-h-32 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-6 text-center transition disabled:cursor-not-allowed disabled:opacity-60 ${videos.length >= 5
                      ? "border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
                      : "border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50/40 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-700 dark:hover:bg-green-900/20"
                      }`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-green-600 shadow-sm dark:bg-gray-900 dark:text-green-400">
                      <FiVideo size={22} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {videos.length >= 5 ? "Maximum 5 videos reached" : "Add property videos"}
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      Record a video or choose from device
                    </p>
                  </button>

                  {videos.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {videos.map((video, index) => (
                        <div
                          key={`${video.name}-${index}-${video.lastModified}`}
                          className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
                        >
                          <button
                            type="button"
                            onClick={() => openPreview(videos, index, "video")}
                            className="block h-32 w-full"
                          >
                            <div className="flex h-32 w-full items-center justify-center bg-gray-900">
                              <FiVideo size={32} className="text-white/70" />
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => removeVideo(index)}
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-red-500"
                          >
                            <FiX size={14} />
                          </button>

                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                            <p className="truncate text-[10px] text-white">
                              {video.name.length > 20
                                ? `${video.name.slice(0, 20)}...`
                                : video.name}
                            </p>
                            <p className="text-[10px] text-white/70">
                              {(video.size / (1024 * 1024)).toFixed(1)} MB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/my-lands")}
                className="h-12 rounded-2xl border border-gray-200 bg-white px-6 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-green-600 px-7 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Adding Land...
                  </>
                ) : (
                  <>
                    <FiUploadCloud size={17} />
                    Add Land
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>

      {mediaSourceModal && (
        <div
          className="fixed inset-0 z-[9998] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMediaSourceModal(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="media-source-title"
            className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="media-source-title" className="text-lg font-bold text-gray-900 dark:text-white">
                  {mediaSourceModal === "image" ? "Add property images" : "Add property videos"}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose how you want to add your {mediaSourceModal === "image" ? "photos" : "videos"}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMediaSourceModal(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Close media source picker"
              >
                <FiX size={19} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => openMediaPicker(mediaSourceModal === "image" ? "cameraImage" : "cameraVideo")}
                className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-5 text-center transition hover:border-green-400 hover:bg-green-100 dark:border-green-900 dark:bg-green-900/20 dark:hover:bg-green-900/40"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 text-white">
                  <FiCamera size={21} />
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {mediaSourceModal === "image" ? "Open Camera" : "Record Video"}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Use your device camera
                </span>
              </button>

              <button
                type="button"
                onClick={() => openMediaPicker(mediaSourceModal === "image" ? "galleryImage" : "galleryVideo")}
                className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-5 text-center transition hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-green-600 shadow-sm dark:bg-gray-900 dark:text-green-400">
                  <FiFolder size={21} />
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Device Gallery
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Choose existing {mediaSourceModal === "image" ? "photos" : "videos"}
                </span>
              </button>
            </div>
            <p className="mt-4 text-xs leading-5 text-gray-400 dark:text-gray-500">
              If prompted, allow camera or media access in your device settings. Camera availability depends on your browser or installed app.
            </p>
          </div>
        </div>
      )}

      {previewMedia && (
        <MediaPreviewModal
          key={previewKey}
          media={previewMedia}
          type={previewType}
          onClose={() => setPreviewMedia(null)}
        />
      )}

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

const CoordinateBox = ({ label, value, error }) => {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${error
        ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/30"
        : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
        }`}
    >
      <p
        className={`text-xs font-medium ${error
          ? "text-red-500 dark:text-red-400"
          : "text-gray-400 dark:text-gray-500"
          }`}
      >
        {label}
      </p>

      <p
        className={`mt-1 font-mono text-sm font-semibold ${error
          ? "text-red-600 dark:text-red-300"
          : "text-gray-800 dark:text-gray-100"
          }`}
      >
        {value || "Not selected"}
      </p>
    </div>
  );
};

export default AddLand;