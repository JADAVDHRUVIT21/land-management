import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";

const Navbar = () => {
  const navigate = useNavigate();

  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-bold text-green-700">
          Land Management
        </Link>

        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link
                to="/"
                className="text-sm font-medium text-gray-700 transition hover:text-green-600"
              >
                Home
              </Link>

              <span className="text-sm text-gray-600">
                {user?.fullName || user?.email}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              

              <Link
                to="/register"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
