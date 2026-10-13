import { createContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY = "theme"; // "light" | "dark" | "system"

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const getSystemTheme = () => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const resolveTheme = (mode) => {
  if (mode === "system") return getSystemTheme();
  return mode; // "light" or "dark"
};

const applyThemeToDOM = (resolved) => {
  const root = document.documentElement;

  if (resolved === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }
};

const getInitialTheme = () => {
  if (typeof window === "undefined") return "system";
  return localStorage.getItem(STORAGE_KEY) || "system";
};

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export const ThemeProvider = ({ children }) => {
  /* "light" | "dark" | "system" — user's chosen mode */
  const [theme, setThemeState] = useState(getInitialTheme);

  /* Actual applied theme: "light" | "dark" — derived from theme + system */
  const resolvedTheme = resolveTheme(theme);

  /* ---- Apply on mount + whenever theme changes ---- */
  useEffect(() => {
    applyThemeToDOM(resolvedTheme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, resolvedTheme]);

  /* ---- Watch for system theme changes when in "system" mode ---- */
  useEffect(() => {
    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handler = (e) => {
      const next = e.matches ? "dark" : "light";
      applyThemeToDOM(next);
    };

    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }

    // Older Safari fallback
    media.addListener(handler);
    return () => media.removeListener(handler);
  }, [theme]);

  /* ---- Public API ---- */
  const setTheme = (next) => {
    if (!["light", "dark", "system"].includes(next)) return;
    setThemeState(next);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider
      value={{
        theme, // user's choice: "light" | "dark" | "system"
        resolvedTheme, // actual applied: "light" | "dark"
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

/* ------------------------------------------------------------------ */
/*  Export the context so the hook file can consume it                 */
/* ------------------------------------------------------------------ */

export default ThemeContext;
