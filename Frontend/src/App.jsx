import { useCallback, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { FiLock, FiDelete } from "react-icons/fi";

import CurtainTransition from "./components/CurtainTransition";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import MyLands from "./pages/MyLands";
import AddLand from "./pages/AddLand";
import EditLand from "./pages/EditLand";
import LandDetail from "./pages/LandDetail";
import BrowseLands from "./pages/BrowseLands";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Contacts from "./pages/Contacts";
import HelpSupport from "./pages/HelpSupport";
import ForgotPassword from "./pages/ForgotPassword";

/* ================================================================== */
/*  Authentication Check                                              */
/* ================================================================== */

// Change "token" below if your login component uses another localStorage key.
const isAuthenticated = () => {
  return Boolean(localStorage.getItem("token"));
};

/* ================================================================== */
/*  Protected Route                                                   */
/* ================================================================== */

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/* ================================================================== */
/*  PIN Lock Screen Component                                         */
/* ================================================================== */

const LockScreen = ({ onUnlock }) => {
  const [enteredPin, setEnteredPin] = useState("");
  const [error, setError] = useState("");

  const [savedPin] = useState(() => {
    return typeof window !== "undefined"
      ? localStorage.getItem("app_pin") || ""
      : "";
  });

  const handleKeyPress = (num) => {
    if (enteredPin.length >= savedPin.length) return;

    const newPin = enteredPin + num;

    setEnteredPin(newPin);
    setError("");

    if (newPin.length === savedPin.length) {
      if (newPin === savedPin) {
        onUnlock();
      } else {
        setError("Incorrect PIN. Try again.");

        setTimeout(() => {
          setEnteredPin("");
        }, 500);
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const renderDots = () => {
    const length = savedPin.length || 4;

    return Array.from({ length }).map((_, i) => (
      <div
        key={i}
        className={`h-4 w-4 rounded-full border-2 transition-all ${
          i < enteredPin.length
            ? "border-green-600 bg-green-600 dark:border-green-500 dark:bg-green-500"
            : "border-gray-300 dark:border-gray-600"
        }`}
      />
    ));
  };

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-gray-950">
      <div className="mb-12 flex flex-col items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
          <FiLock size={32} />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
          Enter App PIN
        </h1>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Please enter your PIN to continue
        </p>
      </div>

      {/* PIN Dots */}
      <div className="mb-8 flex gap-4">{renderDots()}</div>

      {/* Error Message */}
      <div className="mb-8 h-6">
        {error && <p className="text-sm font-medium text-red-500">{error}</p>}
      </div>

      {/* Number Pad */}
      <div className="grid w-full max-w-xs grid-cols-3 gap-4 px-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleKeyPress(num.toString())}
            className="flex h-16 items-center justify-center rounded-full text-2xl font-semibold text-gray-900 transition hover:bg-gray-100 active:bg-gray-200 dark:text-white dark:hover:bg-gray-800 dark:active:bg-gray-700"
          >
            {num}
          </button>
        ))}

        <div />

        <button
          type="button"
          onClick={() => handleKeyPress("0")}
          className="flex h-16 items-center justify-center rounded-full text-2xl font-semibold text-gray-900 transition hover:bg-gray-100 active:bg-gray-200 dark:text-white dark:hover:bg-gray-800 dark:active:bg-gray-700"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleDelete}
          className="flex h-16 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 active:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800 dark:active:bg-gray-700"
        >
          <FiDelete size={24} />
        </button>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  Main App Component                                                */
/* ================================================================== */

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLocked, setIsLocked] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);

    const pin = localStorage.getItem("app_pin");

    if (!pin) {
      setIsLocked(false);
    }
  }, []);

  const handleUnlock = () => {
    setIsLocked(false);
  };

  return (
    <>
      {/* Application Routes */}
      {!isLocked && (
        <Routes>
          {/* ======================================================== */}
          {/* Public Routes - No Login Required                       */}
          {/* ======================================================== */}

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* ======================================================== */}
          {/* Protected Routes - Login Required                       */}
          {/* ======================================================== */}

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-lands"
            element={
              <ProtectedRoute>
                <MyLands />
              </ProtectedRoute>
            }
          />

          <Route
            path="/add-land"
            element={
              <ProtectedRoute>
                <AddLand />
              </ProtectedRoute>
            }
          />

          <Route
            path="/lands/create"
            element={
              <ProtectedRoute>
                <AddLand />
              </ProtectedRoute>
            }
          />

          <Route
            path="/lands"
            element={
              <ProtectedRoute>
                <BrowseLands />
              </ProtectedRoute>
            }
          />

          <Route
            path="/edit-land/:id"
            element={
              <ProtectedRoute>
                <EditLand />
              </ProtectedRoute>
            }
          />

          <Route
            path="/lands/:id"
            element={
              <ProtectedRoute>
                <LandDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contacts"
            element={
              <ProtectedRoute>
                <Contacts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/help-support"
            element={
              <ProtectedRoute>
                <HelpSupport />
              </ProtectedRoute>
            }
          />

          {/* ======================================================== */}
          {/* Unknown Routes                                           */}
          {/* ======================================================== */}

          <Route
            path="*"
            element={
              <Navigate to={isAuthenticated() ? "/" : "/login"} replace />
            }
          />
        </Routes>
      )}

      {/* PIN Lock Screen */}
      {isLocked && !showSplash && <LockScreen onUnlock={handleUnlock} />}

      Splash Screen
      <AnimatePresence>
        {showSplash && (
          <CurtainTransition
            key="splash-screen"
            onComplete={handleSplashComplete}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
