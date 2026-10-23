import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiMap,
  FiSearch,
  FiUsers,
  FiMessageSquare,
  FiUser,
  FiHelpCircle,
  FiLogOut,
  FiX,
  FiAlertCircle,
  FiMoreHorizontal,
} from "react-icons/fi";
import { useEffect, useRef, useState, useLayoutEffect } from "react";

import { useAuth } from "../context/useAuth";
import api from "../services/api";
import logo from "../assets/logo.png";

/* -------------------------------------------------- */
/* Logout Confirmation                                */
/* -------------------------------------------------- */

const LogoutConfirmDialog = ({
  open,
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-gray-800/95"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 pt-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-900/40 dark:text-red-400">
            <FiLogOut size={24} />
          </div>

          <h3
            id="logout-title"
            className="mt-4 text-lg font-semibold text-gray-900 dark:text-white"
          >
            Log out?
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
            You&apos;ll need to sign in again to access your account.
          </p>
        </div>

        <div className="mt-6 flex gap-2 border-t border-gray-100 p-3 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-11 flex-1 rounded-2xl bg-gray-100 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
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
              <FiAlertCircle size={15} />
            )}
            Yes, Log out
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------- */
/* Navigation Items                                   */
/* -------------------------------------------------- */

// Main tabs shown in the bottom bar
const primaryItems = [
  { label: "Home", path: "/", icon: FiHome },
  { label: "My Lands", path: "/my-lands", icon: FiMap },
  { label: "Explore", path: "/lands", icon: FiSearch },
  { label: "Contacts", path: "/contacts", icon: FiUsers },
];

// Extra items accessible from the "More" tab
const moreItems = [
  { label: "Profile", path: "/profile", icon: FiUser },
  { label: "Messages", path: "/messages", icon: FiMessageSquare },
  { label: "Help & Support", path: "/help-support", icon: FiHelpCircle },
];

/* -------------------------------------------------- */
/* Sidebar                                            */
/* -------------------------------------------------- */

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [totalUnread, setTotalUnread] = useState(0);
  const [showNumber, setShowNumber] = useState(false);

  // Liquid nav refs
  const navRef = useRef(null);
  const itemRefs = useRef([]);
  const indicatorRef = useRef(null);

  const fadeTimerRef = useRef(null);

  /* -------- Determine active tab -------- */

  // If the current path matches a "more" item, the active tab should be "More"
  const isMoreActive = moreItems.some((item) =>
    location.pathname.startsWith(item.path),
  );

  const activeIndex = (() => {
    if (isMoreActive) return primaryItems.length; // last index = More
    const idx = primaryItems.findIndex((item) =>
      item.path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.path),
    );
    return idx === -1 ? 0 : idx;
  })();

  /* -------- Move the liquid indicator -------- */
  /* Using offsetLeft/offsetWidth relative to the pill container — this is
     far more reliable than getBoundingClientRect when parents have transforms
     or filters applied. */

  const moveIndicator = () => {
    const indicator = indicatorRef.current;
    const activeEl = itemRefs.current[activeIndex];

    if (!indicator || !activeEl) return;

    // offsetLeft is relative to the nearest positioned ancestor (the pill
    // container has position: relative via the `relative` Tailwind class).
    const left = activeEl.offsetLeft;
    const width = activeEl.offsetWidth;

    indicator.style.transform = `translate3d(${left}px, 0, 0)`;
    indicator.style.width = `${width}px`;
  };

  // Run after every render where activeIndex or the More sheet changes
  useLayoutEffect(() => {
    moveIndicator();
    // Re-run once the browser has settled layout (fonts, scrollbar, etc.)
    const raf1 = requestAnimationFrame(moveIndicator);
    const raf2 = requestAnimationFrame(() =>
      requestAnimationFrame(moveIndicator),
    );
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [activeIndex, isMoreOpen, location.pathname]);

  /* -------- Recalculate on resize -------- */

  useEffect(() => {
    const handleResize = () => {
      const indicator = indicatorRef.current;
      if (!indicator) return;
      indicator.style.transition = "none";
      moveIndicator();
      requestAnimationFrame(() => {
        indicator.style.transition = "";
      });
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  /* -------- Fetch unread messages -------- */

  useEffect(() => {
    let cancelled = false;

    const fetchUnread = async () => {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!token) {
        setTotalUnread(0);
        return;
      }

      try {
        const response = await api.get("/chat/conversations");
        if (cancelled) return;

        const rows = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        const total = rows.reduce(
          (sum, row) => sum + (Number(row.unreadCount) || 0),
          0,
        );

        setTotalUnread(total);

        if (total > 0) {
          setShowNumber(true);
          if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
          fadeTimerRef.current = setTimeout(() => setShowNumber(false), 5000);
        } else {
          setShowNumber(false);
          if (fadeTimerRef.current) {
            clearTimeout(fadeTimerRef.current);
            fadeTimerRef.current = null;
          }
        }
      } catch (error) {
        console.warn("[sidebar] unread fetch failed:", error?.message);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  /* -------- Close modals with Escape -------- */

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key !== "Escape") return;
      if (confirmLogoutOpen && !loggingOut) setConfirmLogoutOpen(false);
      if (isMoreOpen) setIsMoreOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [confirmLogoutOpen, loggingOut, isMoreOpen]);

  /* -------- Lock body scroll when More sheet is open -------- */

  useEffect(() => {
    if (!isMoreOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMoreOpen]);

  const handleConfirmLogout = () => {
    try {
      setLoggingOut(true);
      logout();
      setConfirmLogoutOpen(false);
      setIsMoreOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  };

  const handleCancelLogout = () => {
    if (loggingOut) return;
    setConfirmLogoutOpen(false);
  };

  /* -------- Desktop link styling -------- */

  const getLinkClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
      isActive
        ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
    }`;

  // Build avatar URL (fallback to initials if no image)
  const avatarUrl =
    user?.avatar || user?.profileImage || user?.photoURL || user?.image || "";

  const userInitial = (user?.name || user?.fullName || user?.username || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <>
      {/* ------------------------------------------ */}
      {/* Mobile Header (logo left, avatar right)    */}
      {/* ------------------------------------------ */}

      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200/70 bg-white/90 px-4 backdrop-blur-xl lg:hidden dark:border-gray-800 dark:bg-gray-950/90">
        <NavLink
          to="/"
          className="flex items-center gap-2"
          aria-label="LandManage home"
        >
          <img
            src={logo}
            className="h-9 w-auto object-contain"
            alt="LandManage"
          />
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            Land
            <span className="text-green-600 dark:text-green-500">Manage</span>
          </h1>
        </NavLink>

        {/* Profile avatar on the right */}
        <NavLink
          to="/profile"
          aria-label="Open profile"
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-green-500/70 bg-gray-100 shadow-sm transition active:scale-95 dark:bg-gray-800"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user?.name || "Profile"}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-bold text-green-700 dark:text-green-300">
              {userInitial}
            </span>
          )}
        </NavLink>
      </header>

      {/* ------------------------------------------ */}
      {/* Desktop Sidebar                            */}
      {/* ------------------------------------------ */}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex dark:border-gray-800 dark:bg-gray-900">
        <div className="flex h-20 items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-800">
          <img
            src={logo}
            className="h-10 w-auto object-contain"
            alt="LandManage"
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Land
              <span className="text-green-600 dark:text-green-500">Manage</span>
            </h1>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              Land Management System
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Main Menu
          </p>

          <nav className="space-y-1">
            {[...primaryItems, ...moreItems].map(
              ({ label, path, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === "/"}
                  className={getLinkClass}
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                            : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:bg-gray-700"
                        }`}
                      >
                        <Icon size={18} />
                      </span>
                      <span className="flex-1">{label}</span>
                      {path === "/messages" && totalUnread > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1.5 text-[11px] font-bold text-white">
                          {totalUnread}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ),
            )}
          </nav>
        </div>

        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setConfirmLogoutOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/40">
              <FiLogOut size={18} />
            </span>
            Logout
          </button>
        </div>
      </aside>

      {/* ------------------------------------------ */}
      {/* Mobile Liquid Glass Bottom Navigation      */}
      {/* ------------------------------------------ */}

      <nav
        aria-label="Mobile navigation"
        className="mobile-liquid-nav fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 lg:hidden"
      >
        <div
          ref={navRef}
          className="mobile-liquid-pill relative mx-auto flex w-full max-w-lg items-stretch justify-around gap-1 rounded-[28px] p-2"
        >
          {/* Animated liquid highlight — always rendered, position handled by refs */}
          <span
            ref={indicatorRef}
            className="liquid-indicator"
            aria-hidden="true"
          />

          {/* Primary tabs */}
          {primaryItems.map(({ label, path, icon: Icon }, index) => {
            const isActive =
              path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(path);

            return (
              <NavLink
                key={path}
                to={path}
                end={path === "/"}
                aria-label={label}
                ref={(el) => {
                  if (el) itemRefs.current[index] = el;
                }}
                className={`mobile-liquid-item group relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[21px] px-1 py-2 transition-colors duration-300 ${
                  isActive
                    ? "text-green-700 dark:text-green-300"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                }`}
              >
                <span className="relative flex h-7 items-center justify-center">
                  <Icon
                    size={21}
                    strokeWidth={isActive ? 2.4 : 1.8}
                    className="transition-transform duration-300 group-active:scale-90"
                  />
                </span>
                <span
                  className={`max-w-full truncate text-[10px] leading-3 transition-all duration-300 ${
                    isActive
                      ? "font-bold opacity-100"
                      : "font-medium opacity-80"
                  }`}
                >
                  {label}
                </span>
              </NavLink>
            );
          })}

          {/* "More" tab */}
          <button
            type="button"
            aria-label="More"
            aria-expanded={isMoreOpen}
            ref={(el) => {
              if (el) itemRefs.current[primaryItems.length] = el;
            }}
            onClick={() => setIsMoreOpen((prev) => !prev)}
            className={`mobile-liquid-item group relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[21px] px-1 py-2 transition-colors duration-300 ${
              isMoreActive || isMoreOpen
                ? "text-green-700 dark:text-green-300"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            }`}
          >
            <span className="relative flex h-7 items-center justify-center">
              <FiMoreHorizontal
                size={21}
                strokeWidth={isMoreActive || isMoreOpen ? 2.4 : 1.8}
                className="transition-transform duration-300 group-active:scale-90"
              />
              {/* Unread dot on More if messages has unread */}
              {totalUnread > 0 && (
                <span className="absolute -right-2 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-white bg-green-600 px-1 text-[9px] font-bold leading-none text-white dark:border-gray-900">
                  {showNumber ? (totalUnread > 99 ? "99+" : totalUnread) : ""}
                </span>
              )}
            </span>
            <span
              className={`max-w-full truncate text-[10px] leading-3 transition-all duration-300 ${
                isMoreActive || isMoreOpen
                  ? "font-bold opacity-100"
                  : "font-medium opacity-80"
              }`}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {/* ------------------------------------------ */}
      {/* "More" Sheet (iOS-style action sheet)      */}
      {/* ------------------------------------------ */}

      {isMoreOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMoreOpen(false)}
        >
          <div
            className="more-sheet w-full max-w-md px-3 pb-[max(16px,env(safe-area-inset-bottom))]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Menu card */}
            <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-2xl backdrop-blur-2xl dark:border-gray-700/60 dark:bg-gray-900/90">
              {/* Header with close button */}
              <div className="flex items-center justify-between border-b border-gray-200/70 px-5 py-3 dark:border-gray-800/70">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  More
                </span>
                <button
                  type="button"
                  onClick={() => setIsMoreOpen(false)}
                  aria-label="Close more menu"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition active:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:active:bg-gray-700"
                >
                  <FiX size={16} />
                </button>
              </div>

              <div className="divide-y divide-gray-200/70 dark:divide-gray-800/70">
                {moreItems.map(({ label, path, icon: Icon }) => {
                  const isActive = location.pathname.startsWith(path);
                  return (
                    <NavLink
                      key={path}
                      to={path}
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-4 px-5 py-4 text-sm font-medium transition active:bg-gray-100 dark:active:bg-gray-800"
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        <Icon size={18} />
                      </span>

                      <span className="flex-1 text-gray-900 dark:text-white">
                        {label}
                      </span>

                      {path === "/messages" && totalUnread > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1.5 text-[11px] font-bold text-white">
                          {totalUnread > 99 ? "99+" : totalUnread}
                        </span>
                      )}
                    </NavLink>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    setConfirmLogoutOpen(true);
                  }}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left text-sm font-medium text-red-600 transition active:bg-red-50 dark:text-red-400 dark:active:bg-red-900/20"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-900/40 dark:text-red-400">
                    <FiLogOut size={18} />
                  </span>
                  <span className="flex-1">Logout</span>
                </button>
              </div>
            </div>

            {/* Cancel button (iOS style) */}
            <button
              type="button"
              onClick={() => setIsMoreOpen(false)}
              className="mt-2 w-full rounded-3xl border border-white/60 bg-white/90 py-4 text-sm font-semibold text-gray-900 shadow-xl backdrop-blur-2xl transition active:bg-gray-100 dark:border-gray-700/60 dark:bg-gray-900/90 dark:text-white dark:active:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Logout Dialog */}
      <LogoutConfirmDialog
        open={confirmLogoutOpen}
        loading={loggingOut}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />

      {/* Liquid Glass Styles */}
      <style>{`
        .mobile-liquid-nav {
          pointer-events: none;
        }

        .mobile-liquid-pill {
          pointer-events: auto;
          position: relative;
          isolation: isolate;
          border: 1px solid rgba(255, 255, 255, 0.65);
          background: rgba(255, 255, 255, 0.72);
          box-shadow:
            0 12px 40px rgba(15, 23, 42, 0.14),
            0 2px 8px rgba(15, 23, 42, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.85);
          -webkit-backdrop-filter: blur(28px) saturate(185%);
          backdrop-filter: blur(28px) saturate(185%);
        }

        .mobile-liquid-item {
          -webkit-tap-highlight-color: transparent;
        }

        .liquid-indicator {
          position: absolute;
          top: 8px;
          bottom: 8px;
          left: 0;
          border-radius: 21px;
          border: 1px solid rgba(22, 163, 74, 0.16);
          background: linear-gradient(
            145deg,
            rgba(220, 252, 231, 0.95),
            rgba(240, 253, 244, 0.64)
          );
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 0.95),
            0 3px 12px rgba(22, 163, 74, 0.09);
          transition:
            transform 400ms cubic-bezier(0.34, 1.3, 0.64, 1),
            width 400ms cubic-bezier(0.34, 1.3, 0.64, 1);
          will-change: transform, width;
          pointer-events: none;
          z-index: 0;
          opacity: 0;
          animation: liquidFadeIn 200ms ease-out 100ms forwards;
        }

        @keyframes liquidFadeIn {
          to {
            opacity: 1;
          }
        }

        .dark .mobile-liquid-pill {
          border-color: rgba(255, 255, 255, 0.12);
          background: rgba(17, 24, 39, 0.78);
          box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .dark .liquid-indicator {
          border-color: rgba(74, 222, 128, 0.2);
          background: linear-gradient(
            145deg,
            rgba(20, 83, 45, 0.88),
            rgba(22, 101, 52, 0.44)
          );
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
        }

        /* Sheet entrance animation */
        .more-sheet {
          animation: sheetUp 260ms cubic-bezier(0.34, 1.2, 0.64, 1);
        }

        @keyframes sheetUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .liquid-indicator,
          .mobile-liquid-item,
          .more-sheet {
            transition: none;
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;