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
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { connectSocket, getSocket, disconnectSocket } from "../services/socket";

function Messages() {
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const selectedConversationRef = useRef(null);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const currentUserId =
    currentUser?._id || currentUser?.id || currentUser?.userId || null;

  const getId = (value) => {
    if (!value) return null;
    if (typeof value === "string") return value;
    return value._id || value.id || null;
  };

  const [initialSeed] = useState(() => {
    const stateLand = location.state?.land;
    const stateLandId = location.state?.landId;
    const stateOwner = location.state?.owner;

    if (!stateLandId || !stateLand || !stateOwner) return null;

    const ownerId = getId(stateOwner);
    if (!ownerId || ownerId === currentUserId) return null;

    return {
      id: `${stateLandId}-${ownerId}`,
      landId: stateLandId,
      land: stateLand,
      user: stateOwner,
      lastMessage: null,
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    };
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

  // Keep a ref of the selected conversation so socket handlers always
  // see the latest value without re-subscribing
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  const getOtherUser = (message) => {
    const senderId = getId(message?.sender);
    if (senderId === currentUserId) return message?.receiver;
    return message?.sender;
  };

  const buildConversations = (messageList) => {
    const grouped = new Map();

    messageList.forEach((message) => {
      const landId = getId(message?.land);
      const otherUser = getOtherUser(message);
      if (!landId || !otherUser) return;

      const otherUserId = getId(otherUser);
      if (!otherUserId) return;

      const key = `${landId}-${otherUserId}`;

      grouped.set(key, {
        id: key,
        landId,
        land: message.land,
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
    if (!conversation?.landId) return;

    try {
      setMessagesLoading(true);
      setError("");

      const response = await api.get(`/chat/${conversation.landId}`);
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

  /* ---- Initial mount ---- */
  useEffect(() => {
    const run = () => loadInbox();
    run();

    if (initialSeed) {
      const runSeed = () => loadChatHistory(initialSeed);
      runSeed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Socket subscription ---- */
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    const handleNewMessage = (msg) => {
      const msgId = msg?._id;
      if (!msgId) return;

      const current = selectedConversationRef.current;

      const isForCurrentConversation =
        current &&
        getId(msg.land) === getId(current.landId) &&
        (getId(msg.sender) === getId(current.user) ||
          getId(msg.receiver) === getId(current.user));

      // Append to open chat if it's the current conversation
      if (isForCurrentConversation) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msgId)) return prev;
          return [...prev, msg];
        });
      }

      // Update the sidebar list
      setConversations((prev) => {
        const landId = getId(msg.land);
        const otherUser =
          getId(msg.sender) === currentUserId ? msg.receiver : msg.sender;
        const otherUserId = getId(otherUser);
        const key = `${landId}-${otherUserId}`;

        const exists = prev.find((c) => c.id === key);
        const isCurrent = current?.id === key;
        const isFromMe = getId(msg.sender) === currentUserId;

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

        // Brand new conversation in the sidebar
        return [
          {
            id: key,
            landId,
            land: msg.land,
            user: otherUser,
            lastMessage: {
              _id: msgId,
              message: msg.message,
              createdAt: msg.createdAt,
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
    socket.on("onlineUsers", handleOnlineList);
    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("onlineUsers", handleOnlineList);
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Disconnect on unmount ---- */
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

    // Join the socket room for this land so we receive real-time updates
    const socket = getSocket();
    if (socket) {
      socket.emit("joinLandChat", { landId: conversation.landId });
    }

    await loadChatHistory(conversation);
  };

  const handleSendMessage = async () => {
    const text = messageText.trim();
    if (!text || !selectedConversation || sending) return;

    const receiverId = getId(selectedConversation.user);
    if (!receiverId) {
      setError("Receiver information is missing.");
      return;
    }

    try {
      setSending(true);
      setError("");

      const response = await api.post("/chat/send", {
        landId: selectedConversation.landId,
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
    } catch (err) {
      console.error("SEND MESSAGE ERROR:", err);
      setError(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    ? onlineUserIds.includes(String(getId(selectedUser)))
    : false;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className="ml-0 min-h-screen lg:ml-[230px]">
        <header className="border-b border-gray-200 bg-white px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <p className="mt-1 text-sm text-gray-500">
                Chat with land owners and interested buyers
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
            >
              <FiRefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </header>

        <div className="p-5 sm:p-7">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid min-h-[650px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:grid-cols-[320px_1fr]">
            <aside className="border-b border-gray-200 lg:border-b-0 lg:border-r">
              <div className="border-b border-gray-200 p-4">
                <div className="relative">
                  <FiSearch
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>

              <div className="max-h-[560px] overflow-y-auto">
                {loading ? (
                  <div className="flex min-h-[250px] items-center justify-center">
                    <FiLoader
                      className="animate-spin text-green-600"
                      size={24}
                    />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex min-h-[300px] items-center justify-center p-6">
                    <div className="text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
                        <FiMessageCircle size={25} />
                      </div>
                      <h2 className="mt-4 text-sm font-semibold text-gray-900">
                        No conversations yet
                      </h2>
                      <p className="mt-2 text-xs leading-5 text-gray-500">
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
                    const isOnline = onlineUserIds.includes(
                      String(getId(user)),
                    );

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => handleSelectConversation(conversation)}
                        className={`flex w-full gap-3 border-b border-gray-100 p-4 text-left transition ${
                          isSelected
                            ? "bg-green-50"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-700">
                            <FiUser size={20} />
                          </div>

                          {isOnline && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3
                              className={`truncate text-sm ${
                                hasUnread
                                  ? "font-bold text-gray-900"
                                  : "font-semibold text-gray-900"
                              }`}
                            >
                              {user?.fullName || "User"}
                            </h3>

                            {conversation.updatedAt && (
                              <span className="shrink-0 text-[10px] text-gray-400">
                                {new Date(
                                  conversation.updatedAt,
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          <p className="mt-1 flex items-center gap-1 truncate text-xs text-gray-500">
                            <FiPhone size={11} />
                            {user?.phone || "No phone"}
                          </p>

                          <p
                            className={`mt-1 truncate text-xs ${
                              hasUnread
                                ? "font-semibold text-gray-700"
                                : "text-gray-400"
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

            <section className="flex min-h-[650px] flex-col">
              {selectedConversation ? (
                <>
                  <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
                    <div className="relative shrink-0">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-700">
                        <FiUser size={20} />
                      </div>
                      {isSelectedUserOnline && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-bold text-gray-900">
                        {selectedUser?.fullName || "User"}
                      </h2>

                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FiPhone size={11} />
                          {selectedUser?.phone || "No phone"}
                        </span>

                        {isSelectedUserOnline && (
                          <span className="flex items-center gap-1 text-green-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            Online
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-5">
                    {messagesLoading ? (
                      <div className="flex h-full items-center justify-center">
                        <FiLoader
                          className="animate-spin text-green-600"
                          size={25}
                        />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="max-w-sm text-center">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
                            <FiMessageCircle size={28} />
                          </div>
                          <h2 className="mt-4 text-base font-semibold text-gray-900">
                            Start a conversation
                          </h2>
                          <p className="mt-2 text-sm leading-6 text-gray-500">
                            Send a message to{" "}
                            {selectedUser?.fullName || "this user"} about this
                            land.
                          </p>
                        </div>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const senderId = getId(message.sender);
                        const isMine = senderId === currentUserId;

                        return (
                          <div
                            key={message._id}
                            className={`flex ${
                              isMine ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                                isMine
                                  ? "rounded-br-md bg-green-600 text-white"
                                  : "rounded-bl-md border border-gray-200 bg-white text-gray-900"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                {message.message}
                              </p>
                              <div
                                className={`mt-1 text-[10px] ${
                                  isMine ? "text-green-100" : "text-gray-400"
                                }`}
                              >
                                {message.createdAt
                                  ? new Date(message.createdAt).toLocaleString()
                                  : ""}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  <div className="border-t border-gray-200 bg-white p-4">
                    <div className="flex items-end gap-3">
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        rows={1}
                        placeholder="Type a message..."
                        disabled={sending}
                        className="min-h-[48px] flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={sending || !messageText.trim()}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        {sending ? (
                          <FiLoader className="animate-spin" size={18} />
                        ) : (
                          <FiSend size={18} />
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] text-gray-400">
                      Press Enter to send · Shift + Enter for a new line
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-1 items-center justify-center p-6">
                    <div className="max-w-sm text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
                        <FiMessageCircle size={28} />
                      </div>
                      <h2 className="mt-4 text-lg font-semibold text-gray-900">
                        Your Messages
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        Select a conversation from the left to view messages and
                        start chatting.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <input
                        disabled
                        placeholder="Select a conversation first..."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-400 outline-none"
                      />
                      <button
                        disabled
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-gray-400"
                      >
                        <FiSend size={18} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Messages;
