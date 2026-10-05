import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import api from "../services/api";

function LandDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [land, setLand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

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
    if (!land?.image || !Array.isArray(land.image)) {
      return [];
    }

    return land.image
      .map((item) => {
        if (typeof item === "string") return item;
        return item?.url || null;
      })
      .filter(Boolean);
  };

  const getVideos = () => {
    if (!land?.video || !Array.isArray(land.video)) {
      return [];
    }

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
      state: {
        landId: land?._id,
        land: land,
        owner: land?.owner,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="ml-0 min-h-screen lg:ml-[230px]">
          <div className="flex min-h-screen items-center justify-center">
            <div className="flex items-center gap-3 text-gray-500">
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
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="ml-0 min-h-screen lg:ml-[230px]">
          <div className="flex min-h-screen items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
                <FiMapPin size={26} />
              </div>

              <h2 className="mt-5 text-lg font-semibold text-gray-900">
                Unable to load land
              </h2>

              <p className="mt-2 text-sm text-gray-500">
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
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className="ml-0 min-h-screen lg:ml-[230px]">
        <header className="border-b border-gray-200 bg-white px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-green-600"
              >
                <FiArrowLeft size={16} />
                Back
              </button>

              <h1 className="text-2xl font-bold text-gray-900">Land Details</h1>

              <p className="mt-1 text-sm text-gray-500">
                Survey No. {land.surveyNumber}
              </p>
            </div>

            <div>
              {isOwner ? (
                <Link
                  to={`/edit-land/${land._id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-600 bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 hover:shadow-md"
                >
                  <FiEdit3 size={17} />
                  Edit Land
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleMessageOwner}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-600 bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 hover:shadow-md"
                >
                  <FiMessageCircle size={17} />
                  Message Owner
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="p-5 sm:p-7">
          <div className="mx-auto max-w-7xl">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="relative h-[280px] bg-gray-100 sm:h-[380px] lg:h-[450px]">
                {images.length > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setPreview({
                        type: "image",
                        src: images[0],
                      })
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
                  <div className="flex h-full items-center justify-center bg-green-50 text-green-400">
                    <FiImage size={55} />
                  </div>
                )}

                <div className="absolute left-4 top-4">
                  <span className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                    For Sale
                  </span>
                </div>

                {images.length > 1 && (
                  <div className="absolute bottom-4 right-4 rounded-xl bg-white/95 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm">
                    {images.length} Images
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Property Information
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Basic information about this land
                      </p>
                    </div>
                    <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                      {land.landType}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs text-gray-400">Survey Number</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {land.surveyNumber}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs text-gray-400">Area</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {land.area} sqft
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs text-gray-400">Village</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {land.village}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs text-gray-400">District</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {land.district}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs text-gray-400">State</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {land.state}
                      </p>
                    </div>

                    <div className="rounded-xl bg-green-50 p-4">
                      <p className="text-xs text-green-600">Asking Price</p>
                      <p className="mt-1 text-lg font-bold text-green-700">
                        ₹{Number(land.price || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </section>

                {land.description && (
                  <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Description
                    </h2>
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-600">
                      {land.description}
                    </p>
                  </section>
                )}

                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                      <FiMapPin size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Location
                      </h2>
                      <p className="text-sm text-gray-500">
                        {land.village}, {land.district}, {land.state}
                      </p>
                    </div>
                  </div>

                  {land.location?.latitude && land.location?.longitude && (
                    <div className="mt-5 rounded-xl bg-gray-50 p-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-gray-400">Latitude</p>
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {land.location.latitude}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Longitude</p>
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {land.location.longitude}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {images.length > 0 && (
                  <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex items-center gap-3">
                      <FiImage size={20} className="text-green-600" />
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Property Images
                        </h2>
                        <p className="text-sm text-gray-500">
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
                            setPreview({
                              type: "image",
                              src: image,
                            })
                          }
                          className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100"
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
                  <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex items-center gap-3">
                      <FiVideo size={20} className="text-green-600" />
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Property Videos
                        </h2>
                        <p className="text-sm text-gray-500">
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
                            setPreview({
                              type: "video",
                              src: video,
                            })
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
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Land Owner
                  </h2>

                  <div className="mt-5 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
                      <FiUser size={25} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {getOwnerName()}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
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
                    <div className="mt-5 flex items-start gap-3 border-t border-gray-100 pt-5">
                      <FiMail
                        size={17}
                        className="mt-0.5 shrink-0 text-green-600"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="mt-1 break-all text-sm text-gray-700">
                          {getOwnerEmail()}
                        </p>
                      </div>
                    </div>
                  )}

                  {getOwnerPhone() && (
                    <div className="mt-4 flex items-start gap-3">
                      <FiPhone
                        size={17}
                        className="mt-0.5 shrink-0 text-green-600"
                      />
                      <div>
                        <p className="text-xs text-gray-400">Phone</p>
                        <p className="mt-1 text-sm text-gray-700">
                          {getOwnerPhone()}
                        </p>
                      </div>
                    </div>
                  )}
                </section>

                {isOwner && (
                  <section className="rounded-2xl border border-green-100 bg-green-50 p-5">
                    <p className="text-sm font-medium text-green-800">
                      This is your land.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-green-700">
                      You can update your property information, images, videos
                      and listing details.
                    </p>

                    <Link
                      to={`/edit-land/${land._id}`}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-green-600 bg-white px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                    >
                      <FiEdit3 size={17} />
                      Edit Land
                    </Link>
                  </section>
                )}

                {!isOwner && (
                  <section className="rounded-2xl border border-green-100 bg-green-50 p-5">
                    <h3 className="font-semibold text-green-900">
                      Interested in this land?
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-green-700">
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
