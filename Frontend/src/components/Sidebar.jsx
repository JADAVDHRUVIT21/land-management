import { NavLink, useNavigate } from "react-router-dom";

import {
  FiGrid,
  FiHome,
  FiSearch,
  FiRepeat,
  FiFileText,
  FiMessageSquare,
  FiUser,
  FiHelpCircle,
  FiLogOut,
  FiMenu,
  FiX,
} from "react-icons/fi";

import { useEffect, useRef, useState } from "react";

import { useAuth } from "../context/useAuth";
import api from "../services/api";

const Sidebar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
      label: "Transactions",
      path: "/transactions",
      icon: FiRepeat,
    },
    {
      label: "Documents",
      path: "/documents",
      icon: FiFileText,
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
          // New unread detected — show the number for 5 seconds
          lastUnreadAtRef.current = Date.now();
          setShowNumber(true);

          if (fadeTimerRef.current) {
            clearTimeout(fadeTimerRef.current);
          }

          fadeTimerRef.current = setTimeout(() => {
            setShowNumber(false);
          }, 5000);
        } else {
          // Nothing unread — hide everything
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

    // First fetch immediately
    fetchUnread();

    // Then every 15 seconds
    const interval = setInterval(fetchUnread, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
        <h1 className="text-lg font-bold text-gray-900">
          Land
          <span className="text-green-600">Manage</span>
        </h1>

        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600"
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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-gray-200 px-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Land
              <span className="text-green-600">Manage</span>
            </h1>

            <p className="mt-0.5 text-xs text-gray-400">
              Land Management System
            </p>
          </div>

          <button
            type="button"
            onClick={closeMobileSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
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
                        ? "bg-green-50 text-green-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
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
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Support
            </p>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                <FiHelpCircle size={18} />
              </span>
              Help & Support
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="border-t border-gray-200 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
              <FiLogOut size={18} />
            </span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
