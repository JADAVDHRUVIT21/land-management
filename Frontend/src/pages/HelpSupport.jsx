import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiSearch,
  FiMail,
  FiPhone,
  FiMessageCircle,
  FiChevronDown,
  FiChevronUp,
  FiSend,
  FiLoader,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiClock,
  FiHelpCircle,
  FiRefreshCw,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import api from "../services/api";

/* ------------------------------------------------------------------ */
/*  Static FAQ content                                                 */
/* ------------------------------------------------------------------ */

const FAQ_CATEGORIES = [
  {
    category: "Getting Started",
    items: [
      {
        q: "How do I add my first land?",
        a: "Go to My Lands → click the 'Add Land' button in the top-right. Fill in the survey number, area, location, price, and add at least one image. Choose 'For Sale' or 'For Rent' as the listing type.",
      },
      {
        q: "What is the difference between 'For Sale' and 'For Rent'?",
        a: "For Sale listings are for buying and selling land permanently. For Rent listings are for temporary use — you set a rent period (monthly/yearly) and optionally a security deposit.",
      },
      {
        q: "How do I list my land publicly?",
        a: "After adding a land, go to My Lands and click 'List for Sale' (or 'List for Rent') on the card. It will then appear in the Browse Lands page for other users to see.",
      },
    ],
  },
  {
    category: "Chat & Messaging",
    items: [
      {
        q: "How do I message a land owner?",
        a: "Open any land's details page and click 'Message Owner'. This starts a direct chat. You can also find registered users via Contacts and start a chat from there.",
      },
      {
        q: "Why can't I message someone?",
        a: "You can only message users who are registered on LandManage. If you search a phone number in Contacts and see an 'Invite' button instead of 'Message', they haven't signed up yet.",
      },
    ],
  },
  {
    category: "Account & Profile",
    items: [
      {
        q: "How do I change my profile picture?",
        a: "Go to Profile → click 'Edit Profile' → upload a new avatar and save.",
      },
      {
        q: "How do I change my password?",
        a: "Go to Profile → click 'Edit Profile' → scroll to the Change Password section. Enter your current password, then the new one twice.",
      },
    ],
  },
  {
    category: "Contacts & Invites",
    items: [
      {
        q: "How does the Contacts invite work?",
        a: "Enter a phone number in Contacts and click Invite. We send an SMS via our system. If they later register on LandManage with that number, they'll appear as a matched user.",
      },
      {
        q: "Can I pick contacts from my phone?",
        a: "Yes, on supported browsers (Chrome on Android). Click 'Pick from device contacts' — you'll be asked for permission, then you can select multiple at once.",
      },
    ],
  },
  {
    category: "Troubleshooting",
    items: [
      {
        q: "My image upload failed. What should I do?",
        a: "Make sure your image is under 10MB and in a supported format (JPG, PNG, WEBP, GIF). If it still fails, try a different browser or check your internet connection.",
      },
      {
        q: "I'm not receiving chat messages in real time.",
        a: "Refresh the page. Real-time messaging uses WebSockets — if your network blocks them, you may need to refresh manually to see new messages.",
      },
    ],
  },
];

const CONTACT = {
  email: "support@landmanage.app",
  phone: "+91 9099787845",
  whatsapp: "919099787845",
};

const TICKET_CATEGORY_OPTIONS = [
  { value: "General", label: "General" },
  { value: "Technical", label: "Technical" },
  { value: "Billing", label: "Billing" },
  { value: "Account", label: "Account" },
  { value: "Land Listing", label: "Land Listing" },
  { value: "Chat / Messages", label: "Chat / Messages" },
  { value: "Report a Bug", label: "Report a Bug" },
  { value: "Other", label: "Other" },
];

/* ------------------------------------------------------------------ */
/*  Toast                                                              */
/* ------------------------------------------------------------------ */

const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
      : "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[10000] flex justify-center px-4">
      <div
        className={`pointer-events-auto flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg ${styles}`}
      >
        {type === "error" ? <FiAlertCircle size={16} /> : <FiCheck size={16} />}
        <span>{message}</span>
        <button type="button" onClick={onClose} className="ml-2 shrink-0">
          <FiX size={16} />
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  iOS-style Select Dropdown                                          */
/* ------------------------------------------------------------------ */

const IOSSelect = ({ label, value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex h-12 w-full items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-900 dark:focus:ring-green-900/40"
      >
        <span className="truncate text-left">
          {selectedOption?.label || placeholder || "Select..."}
        </span>
        <FiChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform dark:text-gray-500 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm transition ${
                option.value === value
                  ? "bg-green-50 font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && (
                <FiCheck
                  size={16}
                  className="shrink-0 text-green-600 dark:text-green-400"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  FAQ Item                                                           */
/* ------------------------------------------------------------------ */

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0 dark:border-gray-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 py-4 text-left transition hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {q}
        </span>
        {open ? (
          <FiChevronUp
            size={18}
            className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500"
          />
        ) : (
          <FiChevronDown
            size={18}
            className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500"
          />
        )}
      </button>
      {open && (
        <div className="pb-4 pr-8 text-sm leading-6 text-gray-600 dark:text-gray-400">
          {a}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */

const statusColor = (status) => {
  switch (status) {
    case "Open":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
    case "In Progress":
      return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
    case "Resolved":
      return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
    case "Closed":
      return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
  }
};

/* ------------------------------------------------------------------ */
/*  Ticket Detail Modal                                                */
/* ------------------------------------------------------------------ */

const TicketDetailModal = ({ ticket, onClose }) => {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!ticket) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 px-0 backdrop-blur-sm sm:items-center sm:px-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-7 sm:py-5 dark:border-gray-800">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusColor(ticket.status)}`}
              >
                {ticket.status}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {ticket.category}
              </span>
            </div>

            <h2 className="mt-3 text-base font-bold text-gray-900 sm:text-lg dark:text-white">
              {ticket.subject}
            </h2>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Ticket #{String(ticket._id).slice(-6).toUpperCase()} ·{" "}
              {new Date(ticket.createdAt).toLocaleString()}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Your Message
            </p>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800">
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-800 dark:text-gray-100">
                {ticket.message}
              </p>
            </div>
          </div>

          {ticket.replies?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Conversation ({ticket.replies.length})
              </p>
              <div className="space-y-3">
                {ticket.replies.map((reply, idx) => {
                  const isSupport = reply.from === "Support";
                  return (
                    <div
                      key={idx}
                      className={`flex ${isSupport ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          isSupport
                            ? "rounded-bl-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                            : "rounded-br-md bg-green-600 text-white"
                        }`}
                      >
                        <p
                          className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${
                            isSupport
                              ? "text-green-700 dark:text-green-400"
                              : "text-green-100"
                          }`}
                        >
                          {isSupport ? "Support Team" : "You"}
                        </p>
                        <p
                          className={`whitespace-pre-wrap break-words text-sm leading-6 ${
                            isSupport
                              ? "text-gray-800 dark:text-gray-100"
                              : "text-white"
                          }`}
                        >
                          {reply.message}
                        </p>
                        <p
                          className={`mt-1 text-[10px] ${
                            isSupport
                              ? "text-gray-400 dark:text-gray-500"
                              : "text-green-100"
                          }`}
                        >
                          {new Date(reply.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <p className="font-semibold">Need a faster response?</p>
            <p className="mt-1 leading-5">
              You can also reach us via email or WhatsApp — see the contact
              cards above.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-100 px-5 py-3 sm:px-7 sm:py-4 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-2xl bg-gray-100 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

const HelpSupport = () => {
  const [toast, setToast] = useState(null);

  const [faqSearch, setFaqSearch] = useState("");

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const [selectedTicket, setSelectedTicket] = useState(null);

  const showToast = useCallback(
    (message, type = "success") => setToast({ message, type }),
    [],
  );

  /* -------- Fetch tickets (used both for load + refresh) -------- */
  const fetchTickets = useCallback(async () => {
    try {
      setLoadingTickets(true);
      const response = await api.get("/support/my");
      setTickets(response.data?.tickets || []);
    } catch (err) {
      console.error("Load tickets error:", err);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  /* -------- Initial fetch on mount -------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoadingTickets(true);
        const response = await api.get("/support/my");
        if (cancelled) return;
        setTickets(response.data?.tickets || []);
      } catch (err) {
        if (cancelled) return;
        console.error("Load tickets error:", err);
      } finally {
        if (!cancelled) setLoadingTickets(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredFaqs = useMemo(() => {
    const q = faqSearch.trim().toLowerCase();
    if (!q) return FAQ_CATEGORIES;

    return FAQ_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q),
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [faqSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!subject.trim()) errors.subject = true;
    if (!message.trim()) errors.message = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast("Please fill all required fields.", "error");
      return;
    }

    setFieldErrors({});

    try {
      setSubmitting(true);
      const response = await api.post("/support", {
        subject: subject.trim(),
        category,
        message: message.trim(),
      });

      if (response.data?.success) {
        showToast("Ticket submitted. We'll get back to you soon.");
        setSubject("");
        setCategory("General");
        setMessage("");
        fetchTickets();
      } else {
        showToast(
          response.data?.message || "Failed to submit ticket.",
          "error",
        );
      }
    } catch (err) {
      console.error("Submit ticket error:", err);
      showToast(
        err.response?.data?.message || "Failed to submit ticket.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (hasError) =>
    `h-12 w-full rounded-2xl border px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-4 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-900 ${
      hasError
        ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100 dark:border-red-800 dark:bg-red-900/30 dark:focus:ring-red-900/40"
        : "border-gray-200 bg-gray-50 focus:border-green-500 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-green-900/40"
    }`;

  const handleEmailClick = () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = `mailto:${CONTACT.email}`;
    } else {
      window.open(
        `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
          CONTACT.email,
        )}&su=Support%20Request%20-%20LandManage`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar />

      <div className="w-full lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 mt-16 border-b border-gray-200 bg-white lg:mt-0 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:h-20 lg:px-8">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                Help & Support
              </h1>
              <p className="mt-1 hidden text-sm text-gray-500 sm:block dark:text-gray-400">
                Find answers, submit a ticket, or reach our team
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                fetchTickets();
                showToast("Refreshed");
              }}
              className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <FiRefreshCw size={15} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* 🔥 ADDED pb-32 HERE */}
        <main className="w-full p-4 pb-32 sm:p-6 sm:pb-32 lg:p-8 lg:pb-32">
          <div className="mx-auto w-full max-w-5xl space-y-6">
            {/* Hero / search */}
            <section className="overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-green-50 via-white to-blue-50 p-6 shadow-sm sm:p-8 dark:border-gray-800 dark:from-green-900/20 dark:via-gray-900 dark:to-blue-900/20">
              <div className="mx-auto max-w-2xl text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-green-600 shadow-sm dark:bg-gray-800 dark:text-green-400">
                  <FiHelpCircle size={26} />
                </div>

                <h2 className="mt-4 text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                  How can we help you?
                </h2>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Search our FAQs, submit a support ticket, or reach us
                  directly.
                </p>

                <div className="relative mx-auto mt-5 max-w-xl">
                  <FiSearch
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  />
                  <input
                    type="text"
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    placeholder="Search for help..."
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-900 dark:focus:ring-green-900/40"
                  />
                </div>
              </div>
            </section>

            {/* Quick contact cards */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <button
                type="button"
                onClick={handleEmailClick}
                className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-green-700"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                  <FiMail size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Email us
                  </p>
                  <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                    {CONTACT.email}
                  </p>
                </div>
              </button>

              <a
                href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
                className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                  <FiPhone size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Call us
                  </p>
                  <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                    {CONTACT.phone}
                  </p>
                </div>
              </a>

              <a
                href={`https://wa.me/${CONTACT.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-700"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                  <FiMessageCircle size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    WhatsApp
                  </p>
                  <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                    Chat with us
                  </p>
                </div>
              </a>
            </section>

            {/* FAQ */}
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
                  <FiHelpCircle size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900 sm:text-lg dark:text-white">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                    {faqSearch
                      ? `${filteredFaqs.reduce((sum, c) => sum + c.items.length, 0)} result(s) for "${faqSearch}"`
                      : "Browse answers by category"}
                  </p>
                </div>
              </div>

              {filteredFaqs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center dark:border-gray-700 dark:bg-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No FAQs match your search. Try a different keyword or submit
                    a ticket below.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredFaqs.map((cat) => (
                    <div key={cat.category}>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        {cat.category}
                      </h3>
                      <div className="rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
                        {cat.items.map((item, i) => (
                          <FaqItem key={i} q={item.q} a={item.a} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Contact form */}
            <section
              id="contact-form"
              className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                  <FiSend size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900 sm:text-lg dark:text-white">
                    Still need help? Submit a ticket
                  </h2>
                  <p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                    We typically reply within 24 hours
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Subject <span className="text-green-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => {
                        setSubject(e.target.value);
                        setFieldErrors((p) => ({ ...p, subject: false }));
                      }}
                      placeholder="Brief summary of the issue"
                      maxLength={200}
                      className={inputClass(fieldErrors.subject)}
                    />
                    {fieldErrors.subject && (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                        Subject is required.
                      </p>
                    )}
                  </div>

                  <IOSSelect
                    label="Category"
                    value={category}
                    onChange={setCategory}
                    options={TICKET_CATEGORY_OPTIONS}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Message <span className="text-green-600">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      setFieldErrors((p) => ({ ...p, message: false }));
                    }}
                    rows={6}
                    maxLength={5000}
                    placeholder="Describe your issue or question in detail..."
                    className={`w-full resize-none rounded-2xl border px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-4 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-900 ${
                      fieldErrors.message
                        ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100 dark:border-red-800 dark:bg-red-900/30 dark:focus:ring-red-900/40"
                        : "border-gray-200 bg-gray-50 focus:border-green-500 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-green-900/40"
                    }`}
                  />
                  {fieldErrors.message && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                      Message is required.
                    </p>
                  )}
                  <p className="mt-1 text-right text-xs text-gray-400 dark:text-gray-500">
                    {message.length}/5000
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {submitting ? (
                      <>
                        <FiLoader size={17} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FiSend size={17} />
                        Submit Ticket
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            {/* My tickets */}
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                  <FiClock size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900 sm:text-lg dark:text-white">
                    My Tickets
                  </h2>
                  <p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                    Your submitted support requests
                  </p>
                </div>
              </div>

              {loadingTickets ? (
                <div className="flex items-center justify-center py-10 text-gray-400 dark:text-gray-500">
                  <FiLoader className="animate-spin" size={20} />
                </div>
              ) : tickets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center dark:border-gray-700 dark:bg-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You haven't submitted any tickets yet.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {tickets.map((t) => (
                    <li key={t._id}>
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(t)}
                        className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-green-700"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {t.subject}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                              {t.category} ·{" "}
                              {new Date(t.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusColor(t.status)}`}
                          >
                            {t.status}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                          {t.message}
                        </p>
                        {t.replies?.length > 0 && (
                          <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                            💬 {t.replies.length} repl
                            {t.replies.length === 1 ? "y" : "ies"}
                          </p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* Ticket detail modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default HelpSupport;
