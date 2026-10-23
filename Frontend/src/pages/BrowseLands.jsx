import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiEye,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import api from "../services/api";

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

function BrowseLands() {
  const [lands, setLands] = useState([]);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Property Type Filter
  const [typeFilter, setTypeFilter] = useState("All");

  // Listing Filter
  const [listingFilter, setListingFilter] = useState("all");

  /* Fetch lands */
  useEffect(() => {
    let cancelled = false;

    const loadLands = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/lands");
        if (cancelled) return;

        const data = response.data;

        if (Array.isArray(data)) {
          setLands(data);
        } else if (Array.isArray(data?.lands)) {
          setLands(data.lands);
        } else if (Array.isArray(data?.data)) {
          setLands(data.data);
        } else {
          setLands([]);
        }
      } catch (err) {
        if (cancelled) return;

        console.error("Browse lands error:", err);
        setError(
          err?.response?.data?.message || "Unable to load available lands.",
        );
        setLands([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadLands();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/lands");
      const data = response.data;

      if (Array.isArray(data)) {
        setLands(data);
      } else if (Array.isArray(data?.lands)) {
        setLands(data.lands);
      } else if (Array.isArray(data?.data)) {
        setLands(data.data);
      } else {
        setLands([]);
      }
    } catch (err) {
      console.error("Browse lands error:", err);
      setError(
        err?.response?.data?.message || "Unable to load available lands.",
      );
      setLands([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFind = () => {
    setSearchQuery(search.trim());
  };

  const handleClearSearch = () => {
    setSearch("");
    setSearchQuery("");
  };

  /* Filter Logic */
  const filteredLands = lands.filter((land) => {
    if (typeFilter !== "All") {
      if (land.landType?.toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }
    }

    if (listingFilter === "For Sale" && isRentListing(land)) return false;
    if (listingFilter === "For Rent" && !isRentListing(land)) return false;

    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();

    const searchableValues = [
      land.surveyNumber,
      land.village,
      land.district,
      land.state,
      land.landType,
      land.description,
    ];

    return searchableValues
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const getImage = (land) => {
    if (!land?.image || !Array.isArray(land.image)) return null;
    if (land.image.length === 0) return null;

    const firstImage = land.image[0];
    if (typeof firstImage === "string") return firstImage;
    return firstImage?.url || null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />

      <main className="ml-0 min-h-screen lg:ml-[230px] ">
        {/* 🔥 FIXED HEADER: Removed sticky, added flex-row for mobile */}
        <header className="mt-16  border-gray-200 bg-white  py-4 sm:px-7 lg:mt-0 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center justify-between gap-4 px-0 sm:px-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                Browse Lands
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Find lands available for sale or rent
              </p>
            </div>

            {/* Refresh Button aligned to the right */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <FiRefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </header>

        {/* Main Content Wrapper with bottom padding */}
        <div className="p-5 pb-32 sm:p-12">
          {/* SEARCH BOX */}
          <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <FiSearch
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleFind();
                  }}
                  placeholder="Search survey number, village, district..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-900 dark:focus:ring-green-900/40"
                />
              </div>

              <button
                type="button"
                onClick={handleFind}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 hover:shadow-md active:scale-[0.98]"
              >
                <FiSearch size={17} />
                Find
              </button>

              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-red-800 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                >
                  <FiX size={16} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* PROPERTY TYPE FILTER TABS */}
          <div className="mb-3 flex flex-wrap gap-2">
            {["All", "House", "Flat", "Hostel", "Land"].map((type) => {
              const active = typeFilter === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTypeFilter(type)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-green-600 text-white shadow-sm"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>

          {/* LISTING TYPE FILTER TABS */}
          <div className="mb-6 flex flex-wrap gap-2">
            {[
              { value: "all", label: "All" },
              { value: "For Sale", label: "For Sale" },
              { value: "For Rent", label: "For Rent" },
            ].map((tab) => {
              const active = listingFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setListingFilter(tab.value)}
                  className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-green-600 text-white shadow-sm"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                <FiRefreshCw size={20} className="animate-spin" />
                <span className="text-sm">Loading available lands...</span>
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/30">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {error}
              </p>
              <button
                type="button"
                onClick={handleRefresh}
                className="mt-4 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Try Again
              </button>
            </div>
          )}

          {/* No Results */}
          {!loading && !error && filteredLands.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/30">
                <FiMapPin
                  size={30}
                  className="text-green-500 dark:text-green-400"
                />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
                {searchQuery
                  ? "No matching lands found"
                  : typeFilter !== "All"
                    ? `No ${typeFilter.toLowerCase()}s available`
                    : listingFilter === "For Rent"
                      ? "No lands available for rent"
                      : listingFilter === "For Sale"
                        ? "No lands available for sale"
                        : "No lands available"}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? `No available land matches "${searchQuery}".`
                  : "Try a different filter or check back later."}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="mt-5 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  Show All Lands
                </button>
              )}
            </div>
          )}

          {/* Results */}
          {!loading && !error && filteredLands.length > 0 && (
            <>
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {filteredLands.length}
                  </span>{" "}
                  land
                  {filteredLands.length !== 1 ? "s" : ""} available
                </p>

                {searchQuery && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Search:{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {searchQuery}
                    </span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredLands.map((land) => {
                  const image = getImage(land);
                  const rentMode = isRentListing(land);

                  return (
                    <div
                      key={land._id}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-green-200 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-green-700 dark:hover:shadow-lg"
                    >
                      <div className="relative h-52 bg-gray-100 dark:bg-gray-800">
                        {image ? (
                          <img
                            src={image}
                            alt={`Land ${land.surveyNumber}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-green-50 text-green-400 dark:bg-green-900/20 dark:text-green-500">
                            <FiMapPin size={38} />
                          </div>
                        )}
                        <span
                          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${
                            rentMode ? "bg-blue-600" : "bg-green-600"
                          }`}
                        >
                          {rentMode ? "For Rent" : "For Sale"}
                        </span>
                        {Array.isArray(land.image) && land.image.length > 0 && (
                          <span className="absolute bottom-3 right-3 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm dark:bg-gray-900/90 dark:text-gray-200">
                            {land.image.length} image
                            {land.image.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="truncate text-base font-semibold text-gray-900 dark:text-white">
                              Survey No. {land.surveyNumber}
                            </h2>
                            <div className="mt-2 flex items-start gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                              <FiMapPin
                                size={14}
                                className="mt-0.5 shrink-0 text-green-600 dark:text-green-400"
                              />
                              <span className="line-clamp-2">
                                {land.village}, {land.district}, {land.state}
                              </span>
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">
                            {land.landType}
                          </span>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                          <div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              Area
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {land.area} {land.areaUnit || "sqft"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {rentMode ? "Rent" : "Price"}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-green-700 dark:text-green-400">
                              ₹{Number(land.price || 0).toLocaleString("en-IN")}
                              {rentMode && rentPeriodSuffix(land.rentPeriod)}
                            </p>
                          </div>
                        </div>

                        <Link
                          to={`/lands/${land._id}`}
                          className="group mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-green-600 bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-green-700 hover:shadow-md active:scale-[0.98]"
                        >
                          <FiEye size={17} className="shrink-0" />
                          <span>View Details</span>
                          <FiArrowRight
                            size={16}
                            className="shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                          />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default BrowseLands;