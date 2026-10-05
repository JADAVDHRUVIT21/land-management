import { useCallback, useEffect, useState } from "react";
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

function BrowseLands() {
  const [lands, setLands] = useState([]);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLands = useCallback(async () => {
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
        err?.response?.data?.message ||
          "Unable to load available lands.",
      );

      setLands([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLands();
  }, [fetchLands]);

  const handleFind = () => {
    setSearchQuery(search.trim());
  };

  const handleClearSearch = () => {
    setSearch("");
    setSearchQuery("");
  };

  const filteredLands = lands.filter((land) => {
    if (!searchQuery) {
      return true;
    }

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
      .some((value) =>
        String(value).toLowerCase().includes(query),
      );
  });

  const getImage = (land) => {
    if (!land?.image || !Array.isArray(land.image)) {
      return null;
    }

    if (land.image.length === 0) {
      return null;
    }

    const firstImage = land.image[0];

    if (typeof firstImage === "string") {
      return firstImage;
    }

    return firstImage?.url || null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className="ml-0 min-h-screen lg:ml-[230px]">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Browse Lands
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Find lands currently available for sale
              </p>
            </div>

            <button
              type="button"
              onClick={fetchLands}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiRefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </header>

        <div className="p-5 sm:p-7">
          {/* Search Box */}
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <FiSearch
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleFind();
                    }
                  }}
                  placeholder="Search survey number, village, district..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <FiX size={16} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
              <div className="flex items-center gap-3 text-gray-500">
                <FiRefreshCw
                  size={20}
                  className="animate-spin"
                />

                <span className="text-sm">
                  Loading available lands...
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm font-medium text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchLands}
                className="mt-4 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Try Again
              </button>
            </div>
          )}

          {/* No Results */}
          {!loading &&
            !error &&
            filteredLands.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                  <FiMapPin
                    size={30}
                    className="text-green-500"
                  />
                </div>

                <h2 className="mt-5 text-lg font-semibold text-gray-900">
                  {searchQuery
                    ? "No matching lands found"
                    : "No lands available"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery
                    ? `No available land matches "${searchQuery}".`
                    : "There are currently no lands available for sale."}
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
          {!loading &&
            !error &&
            filteredLands.length > 0 && (
              <>
                {/* Result Count */}
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">
                      {filteredLands.length}
                    </span>{" "}
                    land
                    {filteredLands.length !== 1
                      ? "s"
                      : ""}{" "}
                    available
                  </p>

                  {searchQuery && (
                    <p className="text-sm text-gray-500">
                      Search:{" "}
                      <span className="font-semibold text-gray-900">
                        {searchQuery}
                      </span>
                    </p>
                  )}
                </div>

                {/* Land Cards */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredLands.map((land) => {
                    const image = getImage(land);

                    return (
                      <div
                        key={land._id}
                        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-green-200 hover:shadow-lg"
                      >
                        {/* Image */}
                        <div className="relative h-52 bg-gray-100">
                          {image ? (
                            <img
                              src={image}
                              alt={`Land ${land.surveyNumber}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-green-50 text-green-400">
                              <FiMapPin size={38} />
                            </div>
                          )}

                          {/* For Sale Badge */}
                          <span className="absolute left-3 top-3 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                            For Sale
                          </span>

                          {/* Image Count */}
                          {Array.isArray(land.image) &&
                            land.image.length > 0 && (
                              <span className="absolute bottom-3 right-3 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                                {land.image.length}{" "}
                                image
                                {land.image.length !==
                                1
                                  ? "s"
                                  : ""}
                              </span>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          {/* Title and Type */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h2 className="truncate text-base font-semibold text-gray-900">
                                Survey No.{" "}
                                {land.surveyNumber}
                              </h2>

                              <div className="mt-2 flex items-start gap-1.5 text-sm text-gray-500">
                                <FiMapPin
                                  size={14}
                                  className="mt-0.5 shrink-0 text-green-600"
                                />

                                <span className="line-clamp-2">
                                  {land.village},{" "}
                                  {land.district},{" "}
                                  {land.state}
                                </span>
                              </div>
                            </div>

                            <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                              {land.landType}
                            </span>
                          </div>

                          {/* Area and Price */}
                          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3">
                            <div>
                              <p className="text-xs text-gray-400">
                                Area
                              </p>

                              <p className="mt-1 text-sm font-semibold text-gray-900">
                                {land.area} sqft
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-400">
                                Price
                              </p>

                              <p className="mt-1 text-sm font-semibold text-green-700">
                                ₹
                                {Number(
                                  land.price || 0,
                                ).toLocaleString(
                                  "en-IN",
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Professional View Button */}
                          <Link
                            to={`/lands/${land._id}`}
                            className="group mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-green-600 bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-green-700 hover:shadow-md active:scale-[0.98]"
                          >
                            <FiEye
                              size={17}
                              className="shrink-0"
                            />

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