// src/components/ThemeToggle.jsx
import { FiSun, FiMoon, FiMonitor, FiChevronDown } from "react-icons/fi";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [
    { value: "light", label: "Light", icon: FiSun },
    { value: "dark", label: "Dark", icon: FiMoon },
    { value: "system", label: "System", icon: FiMonitor },
  ];

  const CurrentIcon =
    options.find((opt) => opt.value === theme)?.icon || FiMonitor;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        aria-label="Toggle theme"
      >
        <CurrentIcon size={18} />
        <span className="hidden sm:inline capitalize">{theme}</span>
        <FiChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 origin-top-right rounded-xl border border-gray-200 bg-white p-1 shadow-lg ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-800">
          {options.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.value;
            return (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <Icon size={16} />
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
