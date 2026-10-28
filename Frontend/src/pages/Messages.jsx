import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  FiMessageCircle,
  FiSearch,
  FiSend,
  FiUser,
  FiLoader,
  FiRefreshCw,
  FiPhone,
  FiCheck,
  FiArrowLeft,
  FiMoreVertical,
  FiTrash2,
  FiAlertCircle,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { connectSocket, getSocket, disconnectSocket } from "../services/socket";

/* ================================================================== */
/*  iOS-style Confirm Dialog                                          */
/* ================================================================== */

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-gray-800/95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-900/40 dark:text-red-400">
            <FiAlertCircle size={26} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
            {message}
          </p>
        </div>

        <div className="mt-6 flex gap-2 border-t border-gray-100 p-3 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-11 flex-1 rounded-2xl bg-gray-100 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <FiTrash2 size={15} />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  Avatar                                                            */
/* ================================================================== */

const Avatar = ({ user, size = "md" }) => {
  const sizeClasses =
    size === "sm"
      ? "h-11 w-11 text-base"
      : size === "lg"
        ? "h-14 w-14 text-lg"
        : "h-11 w-11 text-base";

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.fullName || "User"}
        className={`${sizeClasses} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClasses} shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400`}
    >
      <FiUser size={20} />
    </div>
  );
};

/* ================================================================== */
/*  Typing Indicator — WhatsApp style (3 bouncing dots)               */
/* ================================================================== */

const TypingDots = ({ className = "" }) => (
  <span
    className={`inline-flex items-center gap-1 ${className}`}
    aria-label="Typing"
  >
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-current"
      style={{ animationDelay: "0ms", animationDuration: "0.9s" }}
    />
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-current"
      style={{ animationDelay: "150ms", animationDuration: "0.9s" }}
    />
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-current"
      style={{ animationDelay: "300ms", animationDuration: "0.9s" }}
    />
  </span>
);

/* ================================================================== */
/*  Message Ticks — WhatsApp style (✓ sent, ✓✓ delivered, blue read)  */
/* ================================================================== */

const MessageTicks = ({ message }) => {
  const isRead = Boolean(message.read || message.readAt);

  if (isRead) {
    /* Blue double tick */
    return (
      <span className="relative ml-1 inline-flex h-3 w-4 shrink-0 align-middle">
        <FiCheck
          size={11}
          className="absolute left-0 top-0 text-sky-300"
          strokeWidth={3}
        />
        <FiCheck
          size={11}
          className="absolute left-[3px] top-0 text-sky-300"
          strokeWidth={3}
        />
      </span>
    );
  }

  /* Single tick (sent — not yet read) */
  return (
    <FiCheck
      size={11}
      className="ml-1 inline shrink-0 text-green-100 align-middle"
      strokeWidth={3}
    />
  );
};

/* ================================================================== */
/*  Main Component                                                    */
/* ================================================================== */

function Messages() {
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const selectedConversationRef = useRef(null);
  const menuRef = useRef(null);
  const textareaRef = useRef(null);

  /* Typing indicator — from the other user */
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  /* Our own typing state — to avoid re-firing events */
  const typingSentRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const currentUserId = String(
    currentUser?._id || currentUser?.id || currentUser?.userId || "",
  );

  const getId = (value) => {
    if (!value) return null;
    if (typeof value === "string") return value;
    return value._id || value.id || null;
  };

  const idStr = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      const inner = value._id || value.id;
      return inner ? String(inner) : "";
    }
    return String(value);
  };

  const [initialSeed] = useState(() => {
    const stateLand = location.state?.land;
    const stateLandId = location.state?.landId;
    const stateOwner = location.state?.owner;

    if (stateLandId && stateLand && stateOwner) {
      const ownerId = getId(stateOwner);
      if (ownerId && String(ownerId) !== currentUserId) {
        return {
          id: `${stateLandId}-${ownerId}`,
          landId: stateLandId,
          isDirect: false,
          land: stateLand,
          user: stateOwner,
          lastMessage: null,
          unreadCount: 0,
          updatedAt: new Date().toISOString(),
        };
      }
    }

    const stateContactUser = location.state?.contactUser;
    const stateContactUserId = location.state?.contactUserId;

    if (stateContactUser || stateContactUserId) {
      const contact = stateContactUser || { _id: stateContactUserId };
      const contactId = getId(contact);

      if (contactId && String(contactId) !== currentUserId) {
        return {
          id: `direct-${contactId}`,
          landId: "direct",
          isDirect: true,
          land: null,
          user: contact,
          lastMessage: null,
          unreadCount: 0,
          updatedAt: new Date().toISOString(),
        };
      }
    }

    return null;
  });

  const [conversations, setConversations] = useState(() =>
    initialSeed ? [initialSeed] : [],
  );
  const [selectedConversation, setSelectedConversation] = useState(
    () => initialSeed || null,
  );
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [onlineUserIds, setOnlineUserIds] = useState([]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  /* ================================================================
   *  Reset typing state when switching conversations.
   * ================================================================ */
  const prevConversationIdRef = useRef(null);

  useEffect(() => {
    const currentId = selectedConversation?.id ?? null;

    if (prevConversationIdRef.current === currentId) return;
    prevConversationIdRef.current = currentId;

    const reset = () => {
      setOtherUserTyping(false);
      typingSentRef.current = false;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };

    reset();
  }, [selectedConversation?.id]);

  const getOtherUser = (message) => {
    const senderId = idStr(message?.sender);
    if (senderId === currentUserId) return message?.receiver;
    return message?.sender;
  };

  const buildConversations = (messageList) => {
    const grouped = new Map();

    messageList.forEach((message) => {
      const landId = idStr(message?.land);
      const otherUser = getOtherUser(message);
      if (!otherUser) return;

      const otherUserId = idStr(otherUser);
      if (!otherUserId) return;

      const isDirect = !landId || message?.isDirect === true;
      const conversationKey = isDirect ? "direct" : landId;

      const key = `${conversationKey}-${otherUserId}`;

      grouped.set(key, {
        id: key,
        landId: conversationKey,
        isDirect,
        land: isDirect ? null : message.land,
        user: otherUser,
        lastMessage: message,
        unreadCount: 0,
        updatedAt: message.createdAt,
      });
    });

    return Array.from(grouped.values()).sort(
      (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
    );
  };

  const loadInbox = async () => {
    try {
      const response = await api.get("/chat/conversations");
      const rows = Array.isArray(response.data?.data) ? response.data.data : [];

      const inbox = rows.map((row) => ({
        id: row.id,
        landId: row.landId,
        isDirect: row.isDirect === true || row.landId === "direct",
        land: row.land,
        user: row.user,
        lastMessage: row.lastMessage,
        unreadCount: row.unreadCount || 0,
        updatedAt: row.updatedAt,
      }));

      setConversations((current) => {
        const seedOnly = current.filter(
          (c) => c.lastMessage === null && !inbox.some((r) => r.id === c.id),
        );
        const merged = [...seedOnly, ...inbox];
        return merged.sort(
          (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
        );
      });

      setError("");
    } catch (err) {
      console.error("LOAD INBOX ERROR:", err);
      setError(
        err.response?.data?.message || "Failed to load your conversations.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadChatHistory = async (conversation) => {
    if (!conversation) return;

    try {
      setMessagesLoading(true);
      setError("");

      const isDirect =
        conversation.isDirect === true || conversation.landId === "direct";

      let url = "";

      if (isDirect) {
        const otherUserId = idStr(conversation.user);
        if (!otherUserId) {
          setMessages([]);
          setMessagesLoading(false);
          return;
        }
        url = `/chat/direct/${otherUserId}`;
      } else {
        if (!conversation.landId) {
          setMessagesLoading(false);
          return;
        }
        url = `/chat/${conversation.landId}`;
      }

      const response = await api.get(url);
      const history = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setMessages(history);

      setConversations((current) =>
        current.map((c) =>
          c.id === conversation.id ? { ...c, unreadCount: 0 } : c,
        ),
      );

      const generatedConversations = buildConversations(history);
      setConversations((current) => {
        const merged = [...current];

        generatedConversations.forEach((item) => {
          const idx = merged.findIndex((c) => c.id === item.id);
          if (idx >= 0) {
            merged[idx] = {
              ...merged[idx],
              ...item,
              unreadCount: merged[idx].unreadCount || 0,
            };
          } else {
            merged.push(item);
          }
        });

        return merged.sort(
          (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
        );
      });
    } catch (err) {
      console.error("LOAD CHAT HISTORY ERROR:", err);
      setMessages([]);
      setError(err.response?.data?.message || "Failed to load chat history.");
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    const run = () => loadInbox();
    run();

    if (initialSeed) {
      const runSeed = () => loadChatHistory(initialSeed);
      runSeed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    const handleNewMessage = (msg) => {
      const msgId = msg?._id;
      if (!msgId) return;

      const current = selectedConversationRef.current;
      const msgLandId = idStr(msg.land);
      const currentLandId = current?.isDirect
        ? "direct"
        : idStr(current?.landId);
      const effectiveMsgLandId = msgLandId || "direct";

      const otherUserId = idStr(current?.user);

      const isForCurrentConversation =
        current &&
        currentLandId === effectiveMsgLandId &&
        (idStr(msg.sender) === otherUserId ||
          idStr(msg.receiver) === otherUserId);

      if (isForCurrentConversation) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msgId)) return prev;
          return [...prev, msg];
        });

        /* If a message arrives, clear typing indicator */
        setOtherUserTyping(false);
      }

      setConversations((prev) => {
        const landId = effectiveMsgLandId;
        const senderIdStr = idStr(msg.sender);
        const otherUser =
          senderIdStr === currentUserId ? msg.receiver : msg.sender;
        const otherIdStr = idStr(otherUser);
        const key = `${landId}-${otherIdStr}`;

        const exists = prev.find((c) => c.id === key);
        const isCurrent = current?.id === key;
        const isFromMe = senderIdStr === currentUserId;

        if (exists) {
          return prev
            .map((c) =>
              c.id === key
                ? {
                    ...c,
                    lastMessage: {
                      _id: msgId,
                      message: msg.message,
                      createdAt: msg.createdAt,
                      sender: msg.sender,
                      receiver: msg.receiver,
                      read: msg.read || false,
                      readAt: msg.readAt || null,
                    },
                    updatedAt: msg.createdAt,
                    unreadCount:
                      isCurrent || isFromMe ? 0 : (c.unreadCount || 0) + 1,
                  }
                : c,
            )
            .sort(
              (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
            );
        }

        return [
          {
            id: key,
            landId,
            isDirect: landId === "direct",
            land: msg.land || null,
            user: otherUser,
            lastMessage: {
              _id: msgId,
              message: msg.message,
              createdAt: msg.createdAt,
              sender: msg.sender,
              receiver: msg.receiver,
              read: msg.read || false,
              readAt: msg.readAt || null,
            },
            unreadCount: isCurrent || isFromMe ? 0 : 1,
            updatedAt: msg.createdAt,
          },
          ...prev,
        ].sort(
          (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
        );
      });
    };

    /* ============================ */
    /*  TYPING INDICATOR HANDLERS  */
    /* ============================ */

    const handleTyping = (payload) => {
      /* payload: { landId, fromUserId } */
      const current = selectedConversationRef.current;
      if (!current) return;

      const fromId = idStr(payload?.fromUserId);
      const otherId = idStr(current.user);

      if (!fromId || fromId !== otherId) return;

      /* Verify the same land scope */
      const payloadLand = payload?.landId || "direct";
      const currentLand = current.isDirect ? "direct" : idStr(current.landId);

      if (payloadLand !== currentLand) return;

      setOtherUserTyping(true);
    };

    const handleStopTyping = (payload) => {
      const current = selectedConversationRef.current;
      if (!current) return;

      const fromId = idStr(payload?.fromUserId);
      const otherId = idStr(current.user);

      if (!fromId || fromId !== otherId) return;

      setOtherUserTyping(false);
    };

    /* ============================ */
    /*  READ RECEIPTS               */
    /* ============================ */

    const handleMessagesRead = (payload) => {
      const landId = idStr(payload?.landId);
      const readerId = idStr(payload?.readerId);
      const readAt = payload?.readAt || new Date().toISOString();

      if (!landId || !readerId) return;

      const current = selectedConversationRef.current;
      if (!current) return;

      const currentLandId = current.isDirect ? "direct" : idStr(current.landId);
      if (currentLandId !== landId) return;

      setMessages((prev) =>
        prev.map((m) => {
          const senderIdStr = idStr(m.sender);
          const receiverIdStr = idStr(m.receiver);

          const isFromMe = senderIdStr === currentUserId;
          const toReader = receiverIdStr === readerId;

          if (isFromMe && toReader && !m.read) {
            return { ...m, read: true, readAt };
          }
          return m;
        }),
      );

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== current.id) return c;
          const lm = c.lastMessage;
          if (!lm) return c;

          const lmSenderIdStr = idStr(lm.sender);
          const isFromMe = lmSenderIdStr === currentUserId;
          if (!isFromMe) return c;

          return {
            ...c,
            lastMessage: {
              ...lm,
              read: true,
              readAt,
            },
          };
        }),
      );
    };

    const handleConversationDeleted = () => {};
    const handleConversationCleared = () => {};

    const handleOnlineList = (payload) => {
      setOnlineUserIds(payload?.userIds || []);
    };

    const handleUserOnline = (payload) => {
      setOnlineUserIds((prev) =>
        prev.includes(payload.userId) ? prev : [...prev, payload.userId],
      );
    };

    const handleUserOffline = (payload) => {
      setOnlineUserIds((prev) => prev.filter((id) => id !== payload.userId));
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("conversationDeleted", handleConversationDeleted);
    socket.on("conversationCleared", handleConversationCleared);
    socket.on("onlineUsers", handleOnlineList);
    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("conversationDeleted", handleConversationDeleted);
      socket.off("conversationCleared", handleConversationCleared);
      socket.off("onlineUsers", handleOnlineList);
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadInbox();
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setConversations((current) =>
      current.map((c) =>
        c.id === conversation.id ? { ...c, unreadCount: 0 } : c,
      ),
    );

    const socket = getSocket();
    const isDirect =
      conversation.isDirect === true || conversation.landId === "direct";

    if (socket && !isDirect && conversation.landId) {
      socket.emit("joinLandChat", { landId: conversation.landId });
    }

    await loadChatHistory(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setMessages([]);
    setOtherUserTyping(false);
  };

  /* ============================ */
  /*  TYPING EMIT HELPERS        */
  /* ============================ */

  const emitStopTyping = () => {
    if (!typingSentRef.current) return;
    const socket = getSocket();
    const conversation = selectedConversationRef.current;
    if (!socket || !conversation) return;

    const receiverId = getId(conversation.user);
    if (!receiverId) return;

    const landId = conversation.isDirect ? "direct" : conversation.landId;

    socket.emit("stopTyping", { landId, receiverId });
    typingSentRef.current = false;
  };

  const handleMessageInput = (e) => {
    setMessageText(e.target.value);

    const socket = getSocket();
    const conversation = selectedConversationRef.current;
    if (!socket || !conversation) return;

    const receiverId = getId(conversation.user);
    if (!receiverId) return;

    const landId = conversation.isDirect ? "direct" : conversation.landId;

    /* Emit typing once when user starts typing */
    if (!typingSentRef.current) {
      socket.emit("typing", { landId, receiverId });
      typingSentRef.current = true;
    }

    /* Reset the stop-typing timer on every keystroke */
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping();
    }, 1500);
  };

  const performDeleteChat = async () => {
    if (!selectedConversation) return;
    try {
      setConfirm((prev) => ({ ...prev, loading: true }));

      const otherUserId = idStr(selectedConversation.user);
      const isDirect =
        selectedConversation.isDirect === true ||
        selectedConversation.landId === "direct";

      if (isDirect) {
        await api.delete(`/chat/direct/${otherUserId}`);
      } else {
        await api.delete(`/chat/${selectedConversation.landId}/${otherUserId}`);
      }

      setConversations((current) =>
        current.filter((c) => c.id !== selectedConversation.id),
      );
      setSelectedConversation(null);
      setMessages([]);
      setConfirm(null);
      setError("");
    } catch (err) {
      console.error("DELETE CHAT ERROR:", err);
      setError(
        err.response?.data?.message || "Failed to delete the conversation.",
      );
      setConfirm((prev) => ({ ...prev, loading: false }));
    }
  };

  const performClearAll = async () => {
    try {
      setConfirm((prev) => ({ ...prev, loading: true }));

      await api.delete("/chat");

      setConversations((current) =>
        current.map((c) => ({
          ...c,
          lastMessage: null,
          unreadCount: 0,
        })),
      );

      setMessages([]);

      setConfirm(null);
      setError("");
    } catch (err) {
      console.error("CLEAR ALL ERROR:", err);
      setError(
        err.response?.data?.message || "Failed to clear all conversations.",
      );
      setConfirm((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleSendMessage = async () => {
    const text = messageText.trim();
    if (!text || !selectedConversation || sending) return;

    const receiverId = getId(selectedConversation.user);
    if (!receiverId) {
      setError("Receiver information is missing.");
      return;
    }

    const isDirect =
      selectedConversation.isDirect === true ||
      selectedConversation.landId === "direct";

    /* Stop typing immediately when sending */
    emitStopTyping();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    try {
      setSending(true);
      setError("");

      const response = await api.post("/chat/send", {
        landId: isDirect ? "direct" : selectedConversation.landId,
        receiverId,
        message: text,
      });

      const newMessage = response.data?.data;

      if (newMessage) {
        setMessages((current) => {
          if (current.some((m) => m._id === newMessage._id)) return current;
          return [...current, newMessage];
        });

        setConversations((current) => {
          const exists = current.some((c) => c.id === selectedConversation.id);

          if (!exists) {
            return [
              {
                ...selectedConversation,
                lastMessage: newMessage,
                unreadCount: 0,
                updatedAt: newMessage.createdAt || new Date().toISOString(),
              },
              ...current,
            ].sort(
              (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
            );
          }

          return current
            .map((c) =>
              c.id === selectedConversation.id
                ? {
                    ...c,
                    lastMessage: newMessage,
                    updatedAt: newMessage.createdAt || new Date().toISOString(),
                  }
                : c,
            )
            .sort(
              (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
            );
        });
      }

      setMessageText("");
      textareaRef.current?.focus();
    } catch (err) {
      console.error("SEND MESSAGE ERROR:", err);
      setError(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherUserTyping]);

  const filteredConversations = conversations.filter((conversation) => {
    const userName = conversation.user?.fullName || "";
    const phone = conversation.user?.phone || "";
    const surveyNumber = conversation.land?.surveyNumber || "";
    const village = conversation.land?.village || "";
    const searchText =
      `${userName} ${phone} ${surveyNumber} ${village}`.toLowerCase();
    return searchText.includes(search.toLowerCase());
  });

  const selectedUser = selectedConversation?.user;
  const isSelectedUserOnline = selectedUser
    ? onlineUserIds.includes(idStr(selectedUser))
    : false;

  return (
    // Fixed positioning to lock the screen and prevent double scrolling on mobile
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* 
        Sidebar receives a dynamic class to hide the bottom nav on mobile 
        when a chat is selected.
      */}
      <div
        className={`shrink-0 ${selectedConversation ? "hidden lg:block" : "block"}`}
      >
        <Sidebar />
      </div>

      {/* Main Container */}
      <main className="flex flex-1 flex-col min-h-0 lg:ml-[230px]">
        {/* Header — Matched perfectly with Home.jsx layout */}
        <header
          className={`shrink-0 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${
            selectedConversation ? "hidden lg:block" : "block"
          }`}
        >
          <div className="flex min-h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8 mt-16 lg:mt-0">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                Messages
              </h1>
              <p className="mt-1 hidden text-sm text-gray-500 sm:block dark:text-gray-400">
                Chat with land owners and interested buyers
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 sm:h-10 sm:px-4 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <FiRefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>
          </div>
        </header>

        {/* Chat Container Layout */}
        <div className="flex-1 min-h-0 flex flex-col p-0 sm:p-4 lg:p-8 pt-1 lg:pt-8">
          {error && (
            <div className="mx-2 mb-2 sm:mb-4 shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Main Chat Box */}
          <div className="flex-1 min-h-0 overflow-hidden bg-white shadow-sm sm:rounded-2xl border-t sm:border border-gray-200 dark:border-gray-800 dark:bg-gray-900 flex flex-col lg:grid lg:grid-cols-[320px_1fr]">
            {/* Sidebar List */}
            <aside
              className={`min-h-0 border-gray-200 lg:border-r dark:border-gray-800 flex flex-col ${
                selectedConversation ? "hidden lg:flex" : "flex"
              }`}
            >
              <div className="border-b border-gray-200 p-2 sm:p-4 dark:border-gray-800 shrink-0">
                <div className="relative">
                  <FiSearch
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    size={18}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-xs sm:py-3 sm:pl-10 sm:pr-4 sm:text-sm outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-900 dark:focus:ring-green-900/40"
                  />
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                {loading ? (
                  <div className="flex min-h-[250px] items-center justify-center">
                    <FiLoader
                      className="animate-spin text-green-600 dark:text-green-400"
                      size={24}
                    />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex min-h-[240px] items-center justify-center p-3 sm:min-h-[300px] sm:p-6">
                    <div className="text-center">
                      <div className="mx-auto flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                        <FiMessageCircle size={25} />
                      </div>
                      <h2 className="mt-2 sm:mt-4 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                        No conversations yet
                      </h2>
                      <p className="mt-1 sm:mt-1 sm:mt-2 text-[10px] sm:text-[11px] sm:text-xs leading-4 sm:leading-5 text-gray-500 dark:text-gray-400">
                        Your conversations with land owners will appear here.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => {
                    const user = conversation.user;
                    const isSelected =
                      selectedConversation?.id === conversation.id;
                    const hasUnread = (conversation.unreadCount || 0) > 0;
                    const isOnline = onlineUserIds.includes(idStr(user));

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => handleSelectConversation(conversation)}
                        className={`flex w-full gap-2 sm:gap-3 border-b border-gray-100 p-2.5 sm:p-4 text-left transition dark:border-gray-800 ${
                          isSelected
                            ? "bg-green-50 dark:bg-green-900/30"
                            : "bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
                        }`}
                      >
                        <div className="relative shrink-0">
                          <Avatar user={user} size="sm" />

                          {isOnline && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-gray-900" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3
                              className={`truncate text-xs sm:text-sm ${
                                hasUnread
                                  ? "font-bold text-gray-900 dark:text-white"
                                  : "font-semibold text-gray-900 dark:text-white"
                              }`}
                            >
                              {user?.fullName || "User"}
                            </h3>

                            {conversation.updatedAt && (
                              <span className="shrink-0 text-[10px] text-gray-400 dark:text-gray-500">
                                {new Date(
                                  conversation.updatedAt,
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          <p className="mt-0.5 sm:mt-1 flex items-center gap-1 truncate text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                            <FiPhone size={11} />
                            {user?.phone || "No phone"}
                          </p>

                          <p
                            className={`mt-0.5 sm:mt-1 truncate text-[11px] sm:text-xs ${
                              hasUnread
                                ? "font-semibold text-gray-700 dark:text-gray-200"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {conversation.lastMessage?.message ||
                              "Start conversation"}
                          </p>
                        </div>

                        {hasUnread && (
                          <span className="ml-1 flex h-5 min-w-[20px] shrink-0 items-center justify-center self-center rounded-full bg-green-600 px-1.5 text-[11px] font-bold text-white">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Main Chat Area */}
            <section
              className={`min-h-0 h-full flex-col ${
                selectedConversation ? "flex" : "hidden lg:flex"
              }`}
            >
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 px-2 py-2.5 sm:px-5 sm:py-4 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={handleBackToList}
                      className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 lg:hidden dark:text-gray-300 dark:hover:bg-gray-800"
                      aria-label="Back to conversations"
                    >
                      <FiArrowLeft size={20} />
                    </button>

                    <div className="relative shrink-0">
                      <Avatar user={selectedUser} size="sm" />
                      {isSelectedUserOnline && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-gray-900" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-bold text-gray-900 dark:text-white">
                        {selectedUser?.fullName || "User"}
                      </h2>

                      <div className="mt-1 flex items-center gap-2 text-xs">
                        {otherUserTyping ? (
                          <span className="flex items-center gap-1.5 font-medium text-green-600 dark:text-green-400">
                            <TypingDots className="text-green-600 dark:text-green-400" />
                            <span>typing...</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <FiPhone size={11} />
                              {selectedUser?.phone || "No phone"}
                            </span>

                            {isSelectedUserOnline && (
                              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                Online
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="relative shrink-0" ref={menuRef}>
                      <button
                        type="button"
                        onClick={() => setMenuOpen((prev) => !prev)}
                        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        aria-label="More options"
                      >
                        <FiMoreVertical size={20} />
                      </button>

                      {menuOpen && (
                        <div className="absolute right-0 top-full z-50 mt-1.5 sm:mt-2 w-52 sm:w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              setConfirm({ type: "chat", loading: false });
                            }}
                            className="flex w-full items-center gap-2 border-b border-gray-100 px-3 py-2.5 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-gray-700 dark:text-red-400 dark:hover:bg-red-900/30"
                          >
                            <FiTrash2 size={16} />
                            Delete this chat
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              setConfirm({ type: "all", loading: false });
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                          >
                            <FiAlertCircle size={16} />
                            Clear all conversations
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 p-2.5 sm:p-5 dark:bg-gray-950">
                    <div className="space-y-3 sm:space-y-4">
                      {messagesLoading ? (
                        <div className="flex h-full items-center justify-center min-h-[200px]">
                          <FiLoader
                            className="animate-spin text-green-600 dark:text-green-400"
                            size={25}
                          />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex h-full items-center justify-center min-h-[200px]">
                          <div className="max-w-sm text-center">
                            <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                              <FiMessageCircle size={28} />
                            </div>
                            <h2 className="mt-2 sm:mt-4 text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                              Start a conversation
                            </h2>
                            <p className="mt-1 sm:mt-2 text-xs sm:text-sm leading-5 sm:leading-6 text-gray-500 dark:text-gray-400">
                              Send your first message to{" "}
                              {selectedUser?.fullName || "this user"}.
                            </p>
                          </div>
                        </div>
                      ) : (
                        messages.map((message) => {
                          const senderId = idStr(message.sender);
                          const isMine = senderId === currentUserId;

                          return (
                            <div
                              key={message._id}
                              className={`flex ${
                                isMine ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[88%] sm:max-w-[80%] rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm ${
                                  isMine
                                    ? "rounded-br-md bg-green-600 text-white"
                                    : "rounded-bl-md border border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-5 sm:leading-6">
                                  {message.message}
                                </p>
                                <div
                                  className={`mt-1 flex items-center gap-1 text-[9px] sm:text-[10px] ${
                                    isMine
                                      ? "text-green-100"
                                      : "text-gray-400 dark:text-gray-500"
                                  } ${isMine ? "justify-end" : ""}`}
                                >
                                  <span>
                                    {message.createdAt
                                      ? new Date(
                                          message.createdAt,
                                        ).toLocaleString()
                                      : ""}
                                  </span>
                                  {isMine && <MessageTicks message={message} />}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {otherUserTyping && (
                        <div className="flex justify-start">
                          <div className="max-w-[88%] sm:max-w-[80%] rounded-xl sm:rounded-2xl rounded-bl-md border border-gray-200 bg-white px-3 py-2 sm:px-4 sm:py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <TypingDots className="text-gray-400 dark:text-gray-500" />
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="shrink-0 border-t border-gray-200 bg-white p-2 sm:p-4 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-end gap-2 sm:gap-3">
                      <textarea
                        ref={textareaRef}
                        value={messageText}
                        onChange={handleMessageInput}
                        onBlur={emitStopTyping}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        rows={1}
                        placeholder="Type a message..."
                        disabled={sending}
                        className="min-h-[48px] flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-900 dark:focus:ring-green-900/40"
                      />
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={sending || !messageText.trim()}
                        className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
                      >
                        {sending ? (
                          <FiLoader className="animate-spin" size={18} />
                        ) : (
                          <FiSend size={18} />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 sm:mt-2 text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500">
                      Press Enter to send · Shift + Enter for a new line
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-1 items-center justify-center p-3 sm:p-6 h-full">
                    <div className="max-w-sm text-center">
                      <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                        <FiMessageCircle size={28} />
                      </div>
                      <h2 className="mt-2 sm:mt-4 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        Your Messages
                      </h2>
                      <p className="mt-1 sm:mt-2 text-xs sm:text-sm leading-5 sm:leading-6 text-gray-500 dark:text-gray-400">
                        Select a conversation from the left to view messages and
                        start chatting.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={!!confirm}
        title={
          confirm?.type === "all"
            ? "Clear all conversations?"
            : "Delete this chat?"
        }
        message={
          confirm?.type === "all"
            ? "All messages will be cleared from your view. The conversations stay in your list. Other users keep their copy."
            : "This chat will be removed from your inbox only. The other user keeps their copy."
        }
        confirmLabel={
          confirm?.type === "all" ? "Yes, Clear All" : "Yes, Delete"
        }
        loading={confirm?.loading}
        onConfirm={
          confirm?.type === "all" ? performClearAll : performDeleteChat
        }
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

export default Messages;
