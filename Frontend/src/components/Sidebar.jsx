import { NavLink, useNavigate } from "react-router-dom";

import {
  FiGrid,
  FiHome,
  FiSearch,
  FiUsers,
  FiMessageSquare,
  FiUser,
  FiHelpCircle,
  FiLogOut,
  FiMenu,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";

import { useEffect, useRef, useState } from "react";

import { useAuth } from "../context/useAuth";
import api from "../services/api";
import logo from "./../assets/logo.png";
/* ------------------------------------------------------------------ */
/*  iOS-style Logout Confirmation Dialog                               */
/* ------------------------------------------------------------------ */

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
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-gray-800/95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Body */}
        <div className="px-6 pt-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-900/40 dark:text-red-400">
            <FiLogOut size={24} />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            Log out?
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
            You'll need to sign in again to access your account.
          </p>
        </div>

        {/* Actions */}
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

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */

const Sidebar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  /* Logout confirmation */
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  /* ------------------------------------------------------------------ */
  /*  Unread badge state                                                 */
  /* ------------------------------------------------------------------ */

  const [totalUnread, setTotalUnread] = useState(0);
  const [showNumber, setShowNumber] = useState(false);

  const lastUnreadAtRef = useRef(0);
  const fadeTimerRef = useRef(null);

  const menuItems = [
    {
      label: "Dashboard",
      path: "/",
      icon: FiGrid,
    },
    {
      label: "My Lands",
      path: "/my-lands",
      icon: FiHome,
    },
    {
      label: "Browse Lands",
      path: "/lands",
      icon: FiSearch,
    },
    {
      label: "Contacts",
      path: "/contacts",
      icon: FiUsers,
    },
    {
      label: "Messages",
      path: "/messages",
      icon: FiMessageSquare,
    },
    {
      label: "Profile",
      path: "/profile",
      icon: FiUser,
    },
  ];

  /* ------------------------------------------------------------------ */
  /*  Poll unread every 15s                                              */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    const fetchUnread = async () => {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!token) return;

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
          lastUnreadAtRef.current = Date.now();
          setShowNumber(true);

          if (fadeTimerRef.current) {
            clearTimeout(fadeTimerRef.current);
          }

          fadeTimerRef.current = setTimeout(() => {
            setShowNumber(false);
          }, 5000);
        } else {
          setShowNumber(false);
          if (fadeTimerRef.current) {
            clearTimeout(fadeTimerRef.current);
            fadeTimerRef.current = null;
          }
        }
      } catch (err) {
        // Silent — sidebar shouldn't crash the app if the API hiccups
        // eslint-disable-next-line no-console
        console.warn("[sidebar] unread fetch failed:", err?.message);
      }
    };

    fetchUnread();

    const interval = setInterval(fetchUnread, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, []);

  /* Close dialog on Escape */
  useEffect(() => {
    if (!confirmLogoutOpen) return;

    const handleKey = (e) => {
      if (e.key === "Escape" && !loggingOut) {
        setConfirmLogoutOpen(false);
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [confirmLogoutOpen, loggingOut]);

  /* Open the confirmation dialog */
  const handleLogoutClick = () => {
    setConfirmLogoutOpen(true);
  };

  /* Confirm logout — actually do it */
  const handleConfirmLogout = () => {
    try {
      setLoggingOut(true);
      logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      setLoggingOut(false);
      setConfirmLogoutOpen(false);
    }
  };

  /* Cancel */
  const handleCancelLogout = () => {
    if (loggingOut) return;
    setConfirmLogoutOpen(false);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <img src={logo} className="h-10" alt="" />
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Land
            <span className="text-green-600 dark:text-green-500">Manage</span>
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
        >
          <FiMenu size={20} />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Desktop Sidebar / Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:translate-x-0 dark:border-gray-800 dark:bg-gray-900 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-gray-200 px-3 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <img src={logo} className="h-10" alt="" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Land
                <span className="text-green-600 dark:text-green-500">
                  Manage
                </span>
              </h1>

              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                Land Management System
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeMobileSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Main Menu
          </p>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isMessages = item.path === "/messages";

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                    }`
                  }
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

                      <span className="flex-1">{item.label}</span>

                      {/* Messages unread indicator */}
                      {isMessages && totalUnread > 0 && (
                        <>
                          {showNumber ? (
                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-green-600 px-1.5 text-[11px] font-bold text-white">
                              {totalUnread}
                            </span>
                          ) : (
                            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                          )}
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Support */}
          <div className="mt-8">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Support
            </p>

            <NavLink
              to="/help-support"
              onClick={closeMobileSidebar}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                }`
              }
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
                    <FiHelpCircle size={18} />
                  </span>
                  <span className="flex-1">Help & Support</span>
                </>
              )}
            </NavLink>
          </div>
        </div>

        {/* Logout */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <button
            type="button"
            onClick={handleLogoutClick}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/40">
              <FiLogOut size={18} />
            </span>
            Logout
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        open={confirmLogoutOpen}
        loading={loggingOut}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </>
  );
};

export default Sidebar;
