import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  FiHome,
  FiFileText,
  FiMapPin,
  FiPlus,
  FiSearch,
  FiUsers,
  FiActivity,
  FiArrowRight,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/useAuth";
import api from "../services/api";

const Home = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalLands: 0,
    listedLands: 0,
    ownedLands: 0,
  });

  const [loadingStats, setLoadingStats] = useState(true);

  const firstName = user?.fullName?.split(" ")[0] || "User";

  const getInitials = (name = "") => {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "U";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoadingStats(true);

        const landsResponse = await api.get("/lands/my");

        const lands = landsResponse.data?.lands || [];

        const listedLands = lands.filter(
          (land) => land.isForSale === true,
        ).length;

        setStats({
          totalLands: lands.length,
          listedLands,
          ownedLands: lands.length,
        });
      } catch (error) {
        console.error("Dashboard Stats Error:", error);
        setStats({
          totalLands: 0,
          listedLands: 0,
          ownedLands: 0,
        });
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar />

      <div className="w-full lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 mt-16 border-b border-gray-200 bg-white lg:mt-0 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex min-h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                Dashboard
              </h1>

              <p className="mt-1 hidden text-sm text-gray-500 sm:block dark:text-gray-400">
                Overview of your land management activities
              </p>
            </div>

            {/* User chip — now a clickable Link to /profile */}
            <Link
              to="/profile"
              className="flex shrink-0 items-center gap-2 rounded-xl px-1 py-1 transition hover:bg-gray-100 sm:gap-3 sm:px-2 dark:hover:bg-gray-800"
              aria-label="Open profile"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.fullName || "User"}
                  className="h-9 w-9 shrink-0 rounded-full object-cover shadow-sm sm:h-10 sm:w-10"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700 sm:h-10 sm:w-10 sm:text-sm dark:bg-green-900/40 dark:text-green-400">
                  {getInitials(user?.fullName || "")}
                </div>
              )}

              <div className="hidden min-w-0 sm:block">
                <p className="max-w-32 truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.fullName || "User"}
                </p>

                <p className="max-w-40 truncate text-xs text-gray-500 dark:text-gray-400">
                  {user?.email || "User account"}
                </p>
              </div>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full p-4 sm:p-6 lg:p-8">
          {/* Welcome */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-white">
              Welcome back, {firstName}
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Here's an overview of your land portfolio.
            </p>
          </div>

          {/* Statistics */}
          <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Total Lands"
              value={loadingStats ? "..." : stats.totalLands}
              description="All your land records"
              icon={<FiHome size={21} />}
              iconClass="bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400"
            />

            <StatCard
              title="Listed Lands"
              value={loadingStats ? "..." : stats.listedLands}
              description="Currently available"
              icon={<FiFileText size={21} />}
              iconClass="bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
            />

            <StatCard
              title="Owned Lands"
              value={loadingStats ? "..." : stats.ownedLands}
              description="Properties you own"
              icon={<FiMapPin size={21} />}
              iconClass="bg-purple-50 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
            />
          </div>

          {/* Quick Actions */}
          <section className="mt-6 w-full sm:mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Actions
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Frequently used actions
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
              <ActionCard
                to="/lands/create"
                title="Add New Land"
                description="Register a land property"
                icon={<FiPlus size={21} />}
                iconClass="bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                hoverClass="hover:border-green-200 dark:hover:border-green-700"
              />

              <ActionCard
                to="/lands"
                title="Browse Lands"
                description="Find available properties"
                icon={<FiSearch size={21} />}
                iconClass="bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                hoverClass="hover:border-blue-200 dark:hover:border-blue-700"
              />

              <ActionCard
                to="/contacts"
                title="Contacts"
                description="Invite Members"
                icon={<FiUsers size={21} />}
                iconClass="bg-purple-50 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
                hoverClass="hover:border-purple-200 dark:hover:border-purple-700"
              />
            </div>
          </section>

          {/* Recent Activity */}
          <section className="mt-6 w-full sm:mt-8">
            <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              {/* Section Header */}
              <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6 sm:py-5 dark:border-gray-800">
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Recent Activity
                  </h2>

                  <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                    Latest updates from your account
                  </p>
                </div>

                <Link
                  to="/activity"
                  className="shrink-0 text-sm font-medium text-green-600 transition hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                >
                  View All
                </Link>
              </div>

              {/* Empty Activity State */}
              <div className="px-5 py-12 text-center sm:px-6 sm:py-16">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  <FiActivity size={24} />
                </div>

                <h3 className="mt-4 font-medium text-gray-900 dark:text-white">
                  No recent activity
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Your land activities will appear here.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, description, icon, iconClass }) => {
  return (
    <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <h3 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </h3>

          <p className="mt-2 truncate text-xs text-gray-400 dark:text-gray-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

const ActionCard = ({
  to,
  title,
  description,
  icon,
  iconClass,
  hoverClass,
}) => {
  return (
    <Link
      to={to}
      className={`group min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:shadow-lg ${hoverClass}`}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>

          <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>

        <FiArrowRight
          size={18}
          className="shrink-0 text-gray-400 transition group-hover:translate-x-1 dark:text-gray-500"
        />
      </div>
    </Link>
  );
};

export default Home;
