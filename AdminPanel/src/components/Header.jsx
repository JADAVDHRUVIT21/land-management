import { FiBell, FiMenu, FiSearch } from "react-icons/fi";

function Header({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-4 border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="rounded-xl border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50 lg:hidden"
        >
          <FiMenu size={21} />
        </button>

        <div className="hidden min-w-0 sm:block">
          <h2 className="text-base font-semibold text-gray-900">
            Administration
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Manage your land management platform
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative hidden md:block">
          <FiSearch
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="search"
            placeholder="Search..."
            aria-label="Search admin panel"
            className="h-10 w-48 rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-50 lg:w-64"
          />
        </div>

        <button
          type="button"
          aria-label="Notifications"
          onClick={() => window.alert("Notifications will be added later.")}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
        >
          <FiBell size={19} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-green-500 ring-2 ring-white" />
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700 ring-1 ring-green-200">
          AD
        </div>
      </div>
    </header>
  );
}

export default Header;
