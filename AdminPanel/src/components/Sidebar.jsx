import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiMap,
  FiRepeat,
  FiFileText,
  FiMessageSquare,
  FiSettings,
  FiLogOut,
  FiShield,
  FiX,
} from "react-icons/fi";

const menuItems = [
  { label: "Dashboard", path: "/", icon: FiGrid },
  { label: "Users", path: "/users", icon: FiUsers },
  { label: "Lands", path: "/lands", icon: FiMap },
  { label: "Transactions", path: "/transactions", icon: FiRepeat },
  { label: "Documents", path: "/documents", icon: FiFileText },
  { label: "Messages", path: "/messages", icon: FiMessageSquare },
  { label: "Settings", path: "/settings", icon: FiSettings },
];

function Sidebar({ open = false, onClose = () => {} }) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-gray-950/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-gray-100 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white">
              <FiShield size={22} />
            </div>

            <div>
              <h2 className="text-base font-bold text-gray-900">LandManage</h2>
              <p className="text-xs text-gray-500">Admin Console</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="px-5 pb-2 pt-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">
            Main Menu
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {menuItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-green-50 text-green-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-gray-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
              AD
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                Administrator
              </p>
              <p className="text-xs text-gray-500">Management Panel</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              window.alert("Admin logout will be connected in a later step.")
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <FiLogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
