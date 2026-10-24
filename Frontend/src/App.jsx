import { useCallback, useState } from "react";
import { Routes, Route } from "react-router-dom";
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
/*  PIN Lock Screen Component                                         */
/* ================================================================== */
const LockScreen = ({ onUnlock }) => {
  const [enteredPin, setEnteredPin] = useState("");
  const [error, setError] = useState("");

  // ✅ FIX: Read directly from localStorage on initial render. No useEffect needed!
  const [savedPin] = useState(() => {
    return typeof window !== "undefined"
      ? localStorage.getItem("app_pin") || ""
      : "";
  });

  const handleKeyPress = (num) => {
    if (enteredPin.length < savedPin.length) {
      const newPin = enteredPin + num;
      setEnteredPin(newPin);
      setError("");

      // Auto-submit when length matches
      if (newPin.length === savedPin.length) {
        if (newPin === savedPin) {
          onUnlock(); // Unlock the app
        } else {
          setError("Incorrect PIN. Try again.");
          setTimeout(() => setEnteredPin(""), 500); // Clear after error
        }
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setError("");
  };

  // Generate dots for the PIN display
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
            onClick={() => handleKeyPress(num.toString())}
            className="flex h-16 items-center justify-center rounded-full text-2xl font-semibold text-gray-900 transition hover:bg-gray-100 active:bg-gray-200 dark:text-white dark:hover:bg-gray-800 dark:active:bg-gray-700"
          >
            {num}
          </button>
        ))}
        <div /> {/* Empty space for bottom left */}
        <button
          onClick={() => handleKeyPress("0")}
          className="flex h-16 items-center justify-center rounded-full text-2xl font-semibold text-gray-900 transition hover:bg-gray-100 active:bg-gray-200 dark:text-white dark:hover:bg-gray-800 dark:active:bg-gray-700"
        >
          0
        </button>
        <button
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

    // Check if a PIN is set. If not, don't lock the app.
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
      {/* Show the App Routes ONLY if NOT locked */}
      {!isLocked && (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />
          <Route path="/my-lands" element={<MyLands />} />

          <Route path="/add-land" element={<AddLand />} />
          <Route path="/lands/create" element={<AddLand />} />
          <Route path="/lands" element={<BrowseLands />} />

          <Route path="/edit-land/:id" element={<EditLand />} />
          <Route path="/lands/:id" element={<LandDetail />} />

          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/help-support" element={<HelpSupport />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="*" element={<Home />} />
        </Routes>
      )}

      {/* Lock Screen overlay */}
      {isLocked && !showSplash && <LockScreen onUnlock={handleUnlock} />}

      {/* Splash Screen */}
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
