import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiSearch,
  FiMail,
  FiMessageCircle,
  FiPhone,
  FiX,
  FiAlertCircle,
  FiLoader,
  FiSend,
  FiChevronDown,
  FiDownloadCloud,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import api from "../services/api";

/* ---------------- Countries ---------------- */
const COUNTRIES = [
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾" },
  { code: "NZ", name: "New Zealand", dial: "+64", flag: "🇳🇿" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "QA", name: "Qatar", dial: "+974", flag: "🇶🇦" },
  { code: "KW", name: "Kuwait", dial: "+965", flag: "🇰🇼" },
  { code: "OM", name: "Oman", dial: "+968", flag: "🇴🇲" },
  { code: "BH", name: "Bahrain", dial: "+973", flag: "🇧🇭" },
  { code: "NP", name: "Nepal", dial: "+977", flag: "🇳🇵" },
  { code: "BD", name: "Bangladesh", dial: "+880", flag: "🇧🇩" },
  { code: "LK", name: "Sri Lanka", dial: "+94", flag: "🇱🇰" },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰" },
  { code: "CN", name: "China", dial: "+86", flag: "🇨🇳" },
  { code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", dial: "+82", flag: "🇰🇷" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "IT", name: "Italy", dial: "+39", flag: "🇮🇹" },
  { code: "ES", name: "Spain", dial: "+34", flag: "🇪🇸" },
  { code: "NL", name: "Netherlands", dial: "+31", flag: "🇳🇱" },
  { code: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", dial: "+52", flag: "🇲🇽" },
  { code: "RU", name: "Russia", dial: "+7", flag: "🇷🇺" },
];

const normalizePhone = (raw, dialCode = "+91") => {
  if (!raw) return "";
  let digits = String(raw).replace(/\D/g, "");
  const dialDigits = String(dialCode).replace(/\D/g, "");
  if (digits.startsWith(dialDigits) && digits.length > dialDigits.length + 4) {
    digits = digits.slice(dialDigits.length);
  }
  if (dialCode === "+91") {
    return digits.length > 10 ? digits.slice(-10) : digits;
  }
  return digits;
};

const isValidPhone = (raw, dialCode = "+91") => {
  const digits = normalizePhone(raw, dialCode);
  if (dialCode === "+91") return digits.length === 10;
  return digits.length >= 6 && digits.length <= 15;
};

const toE164 = (raw, dialCode = "+91") => {
  const digits = normalizePhone(raw, dialCode);
  return `${dialCode}${digits}`;
};

const getInitials = (name = "") => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "U";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

/* Try to detect a dial code from an E.164-like string, defaulting to +91 */
const guessDialFromE164 = (raw) => {
  if (!raw) return "+91";
  const s = String(raw);
  if (!s.startsWith("+")) return "+91";
  // Prefer longest matching dial code from our list
  let best = "+91";
  let bestLen = 0;
  for (const c of COUNTRIES) {
    if (s.startsWith(c.dial) && c.dial.length > bestLen) {
      best = c.dial;
      bestLen = c.dial.length;
    }
  }
  return best;
};

/* ---------------- Country dropdown ---------------- */
function CountryDropdown({ selected, onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex h-full items-center gap-1.5 rounded-l-2xl border-r border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-lg leading-none">{selected.flag}</span>
        <span className="text-sm">{selected.dial}</span>
        <FiChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""} dark:text-gray-500`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-100 p-2 dark:border-gray-800">
            <div className="relative">
              <FiSearch
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country or code..."
                className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-3 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-900 dark:focus:ring-green-900/40"
              />
            </div>
          </div>

          <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-gray-400 dark:text-gray-500">
                No countries found.
              </li>
            ) : (
              filtered.map((c) => {
                const isActive = c.code === selected.code;
                return (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(c);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${
                        isActive
                          ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                      }`}
                      role="option"
                      aria-selected={isActive}
                    >
                      <span className="text-lg leading-none">{c.flag}</span>
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {c.dial}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------- Contact Picker API helpers ---------------- */
const isContactPickerSupported = () => {
  return (
    typeof navigator !== "undefined" &&
    "contacts" in navigator &&
    typeof navigator.contacts?.select === "function"
  );
};

function Contacts() {
  const navigate = useNavigate();

  const [picked, setPicked] = useState([]);
  const [matchedUsers, setMatchedUsers] = useState({});

  const [matching, setMatching] = useState(false);
  const [error, setError] = useState("");

  const [country, setCountry] = useState(
    COUNTRIES.find((c) => c.code === "IN") || COUNTRIES[0],
  );

  const [sendingInvite, setSendingInvite] = useState(null);
  const [toast, setToast] = useState(null);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [importing, setImporting] = useState(false);

  // Directly check support on initial render, no useEffect needed
  const [pickerSupported] = useState(isContactPickerSupported());

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => setToast(null), 3500);
  };

  const allNumbers = useMemo(() => {
    const set = new Set();
    picked.forEach((c) =>
      (c.phones || []).forEach((p) => {
        if (p?.e164) set.add(p.e164);
      }),
    );
    return Array.from(set);
  }, [picked]);

  const phoneEntryFor = (e164) => {
    for (const c of picked) {
      for (const p of c.phones || []) {
        if (p.e164 === e164) return p;
      }
    }
    return null;
  };

  const nameForNumber = (e164) => {
    if (matchedUsers[e164]?.fullName) return matchedUsers[e164].fullName;
    for (const c of picked) {
      const has = (c.phones || []).some((p) => p.e164 === e164);
      if (has && c.name) return c.name;
    }
    return null;
  };

  const runMatchFor = async (numbers) => {
    const deduped = Array.from(new Set(numbers.filter(Boolean)));
    if (deduped.length === 0) return;

    try {
      setMatching(true);

      const response = await api.post("/users/match-contacts", {
        phones: deduped,
      });

      const data = response.data || {};
      const matchedArray = Array.isArray(data.matched) ? data.matched : [];

      setMatchedUsers((current) => {
        const next = { ...current };

        matchedArray.forEach((m) => {
          const userPhone = m.user?.phone || m.phone || "";
          const digits = String(userPhone).replace(/\D/g, "");
          const local = digits.length > 10 ? digits.slice(-10) : digits;

          const keysToStore = new Set([
            String(m.phone || ""),
            String(userPhone),
            digits,
            local,
            `+91${local}`,
            `91${local}`,
          ]);

          keysToStore.forEach((k) => {
            if (k) next[k] = m.user;
          });
        });

        return next;
      });
    } catch (err) {
      console.error("MATCH CONTACTS ERROR:", err);
      setError(
        err.response?.data?.message ||
          "Failed to match contacts. Please try again.",
      );
    } finally {
      setMatching(false);
    }
  };

  const submitSearch = async () => {
    const q = search.trim();

    if (!q) {
      setAppliedSearch("");
      return;
    }

    const digitsOnly = q.replace(/\D/g, "");
    if (digitsOnly.length >= 6 && isValidPhone(digitsOnly, country.dial)) {
      const local = normalizePhone(digitsOnly, country.dial);
      const e164 = toE164(digitsOnly, country.dial);

      const exists = picked.some((c) =>
        (c.phones || []).some((p) => p.e164 === e164),
      );

      if (!exists) {
        const entry = {
          e164,
          dial: country.dial,
          local,
          country: country.code,
          flag: country.flag,
        };
        setPicked((current) => [...current, { name: "", phones: [entry] }]);
        await runMatchFor([e164]);
      }
    }

    setAppliedSearch(q);
  };

  const clearSearch = () => {
    setSearch("");
    setAppliedSearch("");
  };

  /* ---------------- Import contacts from the device ---------------- */
  const importContacts = async () => {
    if (!isContactPickerSupported()) {
      showToast(
        "Contact import isn't supported on this browser. Try Chrome on Android.",
        "error",
      );
      return;
    }

    try {
      setImporting(true);
      setError("");

      // This triggers the browser permission prompt automatically.
      const rawContacts = await navigator.contacts.select(["name", "tel"], {
        multiple: true,
      });

      if (!Array.isArray(rawContacts) || rawContacts.length === 0) {
        showToast("No contacts selected.", "success");
        return;
      }

      // Build new entries, dedupe against existing numbers
      const existingNumbers = new Set(
        picked.flatMap((c) =>
          (c.phones || []).map((p) => p.e164).filter(Boolean),
        ),
      );

      const newEntries = [];
      const numbersToMatch = [];

      rawContacts.forEach((rc) => {
        const name = Array.isArray(rc.name) ? rc.name[0] || "" : rc.name || "";
        const tels = Array.isArray(rc.tel) ? rc.tel : [];

        const phoneEntries = [];
        tels.forEach((tel) => {
          const raw = String(tel || "").trim();
          if (!raw) return;

          const dial = guessDialFromE164(raw);
          const digits = raw.replace(/\D/g, "");
          if (digits.length < 6) return;

          const e164 = raw.startsWith("+")
            ? `+${digits}`
            : toE164(digits, dial);

          if (existingNumbers.has(e164)) return;
          existingNumbers.add(e164);

          const countryMeta =
            COUNTRIES.find((c) => c.dial === dial) ||
            COUNTRIES.find((c) => c.code === "IN") ||
            COUNTRIES[0];

          phoneEntries.push({
            e164,
            dial,
            local: normalizePhone(digits, dial),
            country: countryMeta.code,
            flag: countryMeta.flag,
          });
          numbersToMatch.push(e164);
        });

        if (phoneEntries.length > 0) {
          newEntries.push({ name, phones: phoneEntries });
        }
      });

      if (newEntries.length === 0) {
        showToast("Those contacts are already in your list.", "success");
        return;
      }

      setPicked((current) => [...current, ...newEntries]);
      showToast(
        `Imported ${newEntries.length} contact${newEntries.length > 1 ? "s" : ""}.`,
        "success",
      );

      // Match all newly imported numbers in one request
      await runMatchFor(numbersToMatch);
    } catch (err) {
      // The Contact Picker API throws "AbortError" if the user cancels.
      if (err?.name === "AbortError" || /abort/i.test(err?.message || "")) {
        return;
      }
      console.error("IMPORT CONTACTS ERROR:", err);
      setError(
        err?.message ||
          "Failed to import contacts. Please try again or grant contact permission.",
      );
    } finally {
      setImporting(false);
    }
  };

  const filteredNumbers = useMemo(() => {
    const q = appliedSearch.toLowerCase();
    const qDigits = appliedSearch.replace(/\D/g, "");

    let list = allNumbers;

    if (q) {
      list = list.filter((e164) => {
        const matchedUser = matchedUsers[e164];
        const displayName = (
          matchedUser?.fullName ||
          nameForNumber(e164) ||
          ""
        ).toLowerCase();

        return (
          displayName.includes(q) ||
          (qDigits.length > 0 && e164.replace(/\D/g, "").includes(qDigits))
        );
      });
    }

    // Alphabetical sort by display name (fallback to number)
    return [...list].sort((a, b) => {
      const nameA = (
        matchedUsers[a]?.fullName ||
        nameForNumber(a) ||
        a
      ).toLowerCase();
      const nameB = (
        matchedUsers[b]?.fullName ||
        nameForNumber(b) ||
        b
      ).toLowerCase();
      return nameA.localeCompare(nameB);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allNumbers, appliedSearch, matchedUsers, picked]);

  const startChat = (user) => {
    if (!user?._id) return;
    navigate("/messages", { state: { contactUser: user } });
  };

  const inviteViaSMS = async (e164) => {
    if (!e164) {
      setError("Invalid phone number for SMS invite.");
      return;
    }

    try {
      setSendingInvite(e164);

      const res = await api.post("/invite/sms", { phone: e164 });

      if (res.data?.success) {
        showToast(`SMS invite sent to ${e164}`, "success");
      } else {
        showToast(res.data?.message || "Failed to send SMS invite.", "error");
      }
    } catch (err) {
      console.error("SMS INVITE ERROR:", err);
      showToast(
        err.response?.data?.message || "Failed to send SMS invite.",
        "error",
      );
    } finally {
      setSendingInvite(null);
    }
  };

  const clearAll = () => {
    setPicked([]);
    setMatchedUsers({});
    setError("");
    setSearch("");
    setAppliedSearch("");
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar />

      {toast && (
        <div
          className={`fixed right-5 top-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg transition-all ${
            toast.type === "error" ? "bg-red-600" : "bg-green-600"
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.type === "error" ? (
            <FiAlertCircle size={16} />
          ) : (
            <FiSend size={16} />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 rounded-full p-0.5 hover:bg-white/20"
            aria-label="Dismiss notification"
          >
            <FiX size={14} />
          </button>
        </div>
      )}

      <div className="w-full lg:pl-64">
        {/* Header — Matched perfectly with Home.jsx */}
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex min-h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8 mt-16 lg:mt-0">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                Contacts
              </h1>
              <p className="mt-1 hidden text-sm text-gray-500 sm:block dark:text-gray-400">
                Find friends on LandManage or invite them to join.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={importContacts}
                disabled={importing || matching}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-green-600 px-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:px-4"
                title={
                  pickerSupported
                    ? "Import contacts from your phone"
                    : "Contact import is not supported on this browser"
                }
              >
                {importing ? (
                  <FiLoader size={16} className="animate-spin" />
                ) : (
                  <FiDownloadCloud size={16} />
                )}
                <span className="hidden sm:inline">
                  {importing ? "Importing..." : "Import Contacts"}
                </span>
              </button>

              {allNumbers.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:h-10 sm:px-4 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <FiX size={16} />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mt-16 w-full p-4 sm:p-6 lg:mt-0 lg:p-8 pb-32">
          <div className="mx-auto max-w-3xl space-y-5">
            {error && (
              <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                <div className="flex items-start gap-2">
                  <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="shrink-0"
                >
                  <FiX size={16} />
                </button>
              </div>
            )}

            <div className="flex items-stretch gap-2">
              <div className="relative flex-1">
                <div className="flex h-12 w-full items-stretch overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm transition focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-100 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:ring-green-900/40">
                  <CountryDropdown
                    selected={country}
                    onSelect={setCountry}
                    disabled={matching}
                  />

                  <div className="relative flex-1">
                    <FiSearch
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          submitSearch();
                        }
                      }}
                      placeholder="Search by name or phone number"
                      className="h-full w-full rounded-r-2xl bg-transparent pl-11 pr-12 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
                    />

                    {search.length > 0 && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                        aria-label="Clear search"
                      >
                        <FiX size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={submitSearch}
                disabled={matching}
                className="flex h-12 w-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-green-600 text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60 sm:w-auto sm:px-5"
                aria-label="Search"
              >
                {matching ? (
                  <FiLoader size={18} className="animate-spin" />
                ) : (
                  <FiSearch size={18} />
                )}
                <span className="ml-2 hidden text-sm font-semibold sm:inline">
                  {matching ? "Searching..." : "Search"}
                </span>
              </button>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500">
              Tap <span className="font-semibold">Import Contacts</span> to load
              saved phone contacts, or search a name or phone number — if it's
              not on LandManage yet, you'll get an Invite button.
            </p>

            {allNumbers.length > 0 && (
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredNumbers.length === 0 ? (
                    <li className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      {appliedSearch
                        ? `No contacts match "${appliedSearch}".`
                        : "No contacts found."}
                    </li>
                  ) : (
                    filteredNumbers.map((e164) => {
                      const user = matchedUsers[e164];
                      const entry = phoneEntryFor(e164);
                      const displayName =
                        user?.fullName || nameForNumber(e164) || null;
                      const isMatched = Boolean(user?._id);
                      const isSending = sendingInvite === e164;

                      return (
                        <li key={e164} className="flex items-center gap-3 p-4">
                          {isMatched && user?.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.fullName}
                              className="h-11 w-11 shrink-0 rounded-full object-cover"
                            />
                          ) : isMatched ? (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                              {getInitials(user.fullName)}
                            </div>
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                              {displayName ? (
                                <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                  {getInitials(displayName)}
                                </span>
                              ) : (
                                <FiPhone size={18} />
                              )}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {displayName || e164}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500 dark:text-gray-400">
                              {entry?.flag && (
                                <span className="text-sm leading-none">
                                  {entry.flag}
                                </span>
                              )}
                              <FiPhone size={11} />
                              {e164}
                            </p>
                            {!isMatched && (
                              <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                                Not on LandManage yet
                              </p>
                            )}
                          </div>

                          {isMatched ? (
                            <button
                              type="button"
                              onClick={() => startChat(user)}
                              className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-green-600 px-4 text-xs font-semibold text-white transition hover:bg-green-700"
                            >
                              <FiMessageCircle size={14} />
                              Message
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => inviteViaSMS(e164)}
                              disabled={isSending}
                              className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                              {isSending ? (
                                <>
                                  <FiLoader
                                    size={14}
                                    className="animate-spin"
                                  />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <FiMail size={14} />
                                  Invite
                                </>
                              )}
                            </button>
                          )}
                        </li>
                      );
                    })
                  )}
                </ul>
              </section>
            )}

            {allNumbers.length === 0 && (
              <section className="overflow-hidden rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center shadow-sm sm:py-14 dark:border-gray-700 dark:bg-gray-900">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                  <FiUsers size={28} />
                </div>

                <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                  No contacts yet
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
                  Tap <span className="font-semibold">Import Contacts</span> to
                  load contacts saved on your phone, or search a name or phone
                  number above to find someone on LandManage.
                </p>

                {!pickerSupported && (
                  <p className="mx-auto mt-3 max-w-md text-xs text-amber-600 dark:text-amber-400">
                    Note: Bulk contact import is only supported in Chrome on
                    Android. You can still search numbers manually on this
                    browser.
                  </p>
                )}

                <button
                  type="button"
                  onClick={importContacts}
                  disabled={importing || matching}
                  className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {importing ? (
                    <FiLoader size={16} className="animate-spin" />
                  ) : (
                    <FiDownloadCloud size={16} />
                  )}
                  {importing ? "Importing..." : "Import Contacts"}
                </button>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Contacts;