import mongoose from "mongoose";

import ChatMessage from "../models/ChatMessageModel.js";
import Land from "../models/LandModel.js";
import User from "../models/UserModels.js";
import { redactMessage } from "../utils/chatRedaction.js";
import { checkProfanity } from "../utils/profanityService.js";

/* for emitting real-time events after HTTP requests */
import { io } from "../../server.js";

const isUserAuthorizedForLandChat = async ({ userId, user, land }) => {
    // 1. Admin
    if (user.role === "admin") return true;

    // 2. Current owner
    if (land.owner.toString() === userId.toString()) return true;

    // 3. Public listing — any authenticated user can initiate chat
    if (land.isForSale === true) return true;

    return false;
};

/* ------------------------------------------------------------------ */
/*  SEND MESSAGE                                                       */
/* ------------------------------------------------------------------ */
/*  Body: { landId, receiverId, message }                              */
/*                                                                     */
/*  `landId` may be:                                                   */
/*    - a real ObjectId string  → land-scoped chat                     */
/*    - the literal "direct"    → direct chat (no land)                */
/*    - missing/empty           → treated the same as "direct"         */
/* ------------------------------------------------------------------ */

const sendMessage = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { landId, receiverId, message } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (!receiverId || !message?.trim()) {
            return res.status(400).json({
                success: false,
                message: "receiverId and message are required",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid receiverId",
            });
        }

        /* ---- Determine whether this is a direct chat ---- */
        const isDirect =
            !landId ||
            String(landId).trim() === "" ||
            String(landId).trim() === "direct" ||
            !mongoose.Types.ObjectId.isValid(landId);

        /* ---- If it's a land chat, validate the land id ---- */
        let resolvedLandId = null;
        let land = null;

        if (!isDirect) {
            resolvedLandId = landId;
            land = await Land.findById(resolvedLandId);

            if (!land) {
                return res.status(404).json({
                    success: false,
                    message: "Land not found",
                });
            }
        }

        const cleanMessage = message.trim();

        // Profanity check
        const profanityResult = await checkProfanity(cleanMessage);

        if (profanityResult.error) {
            return res.status(503).json({
                success: false,
                message:
                    "Message moderation service is temporarily unavailable. Please try again.",
            });
        }

        if (profanityResult.isProfanity) {
            return res.status(400).json({
                success: false,
                message:
                    "Your message contains inappropriate language and cannot be sent.",
            });
        }

        const sender = await User.findById(userId);
        const receiver = await User.findById(receiverId);

        if (!sender || !receiver) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (userId.toString() === receiverId.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot send a message to yourself",
            });
        }

        /* ---- Land authorization only applies to land chats ---- */
        if (!isDirect && land) {
            const senderAuthorized = await isUserAuthorizedForLandChat({
                userId,
                user: sender,
                land,
            });

            if (!senderAuthorized) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not authorized to send messages for this land",
                });
            }

            const receiverAuthorized = await isUserAuthorizedForLandChat({
                userId: receiverId,
                user: receiver,
                land,
            });

            if (!receiverAuthorized) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Receiver is not authorized for this land chat",
                });
            }
        }

        const filtered = redactMessage(cleanMessage);

        const chatMessage = await ChatMessage.create({
            land: isDirect ? null : resolvedLandId,
            isDirect,
            sender: userId,
            receiver: receiverId,
            message: filtered.message,
            isRedacted: filtered.isRedacted,
            read: false,
            readAt: null,
            deletedBy: [],
        });

        const populatedMessage = await ChatMessage.findById(chatMessage._id)
            .populate("sender", "fullName email role phone avatar")
            .populate("receiver", "fullName email role phone avatar")
            .populate("land", "surveyNumber village district state");

        io.to(`user_${receiverId}`).emit("newMessage", populatedMessage);
        io.to(`user_${userId}`).emit("newMessage", populatedMessage);

        return res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: populatedMessage,
        });
    } catch (error) {
        console.error("SEND CHAT MESSAGE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to send message",
        });
    }
};

/* ------------------------------------------------------------------ */
/*  GET CHAT HISTORY                                                   */
/* ------------------------------------------------------------------ */
/*  Route params:                                                      */
/*    - GET /chat/direct/:otherUserId  → direct chat with that user    */
/*    - GET /chat/:landId              → land-scoped chat              */
/*                                                                     */
/*  We detect the "direct" case by checking whether `otherUserId` is   */
/*  present in req.params (that only happens on /chat/direct/...).     */
/* ------------------------------------------------------------------ */

const getChatHistory = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { landId, otherUserId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        // Route /chat/direct/:otherUserId → otherUserId is set, landId undefined
        // Route /chat/:landId            → landId is set, otherUserId undefined
        const isDirect = Boolean(otherUserId);

        /* ---- Direct chat ---- */
        if (isDirect) {
            if (!otherUserId || !mongoose.Types.ObjectId.isValid(otherUserId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid otherUserId",
                });
            }

            const userObjectId = new mongoose.Types.ObjectId(userId);
            const otherObjectId = new mongoose.Types.ObjectId(otherUserId);

            const now = new Date();

            // Mark all incoming direct messages from this user as read
            const unreadResult = await ChatMessage.updateMany(
                {
                    isDirect: true,
                    receiver: userObjectId,
                    sender: otherObjectId,
                    read: false,
                    deletedBy: { $ne: userObjectId },
                },
                { $set: { read: true, readAt: now } }
            );

            if (unreadResult.modifiedCount > 0) {
                io.to(`user_${otherUserId}`).emit("messagesRead", {
                    landId: "direct",
                    readerId: String(userId),
                    readAt: now.toISOString(),
                });
            }

            const messages = await ChatMessage.find({
                isDirect: true,
                $or: [
                    { sender: userObjectId, receiver: otherObjectId },
                    { sender: otherObjectId, receiver: userObjectId },
                ],
                deletedBy: { $ne: userObjectId },
            })
                .sort({ createdAt: 1 })
                .populate("sender", "fullName email role phone avatar")
                .populate("receiver", "fullName email role phone avatar")
                .populate("land", "surveyNumber village district state");

            return res.status(200).json({
                success: true,
                count: messages.length,
                data: messages,
            });
        }

        /* ---- Land chat ---- */
        if (!mongoose.Types.ObjectId.isValid(landId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid landId",
            });
        }

        const land = await Land.findById(landId);
        if (!land) {
            return res.status(404).json({
                success: false,
                message: "Land not found",
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const authorized = await isUserAuthorizedForLandChat({
            userId,
            user,
            land,
        });

        if (!authorized) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this chat",
            });
        }

        const now = new Date();

        const unreadResult = await ChatMessage.updateMany(
            {
                land: landId,
                receiver: userId,
                read: false,
                deletedBy: { $ne: userId },
            },
            { $set: { read: true, readAt: now } }
        );

        if (unreadResult.modifiedCount > 0) {
            const otherUsers = await ChatMessage.distinct("sender", {
                land: landId,
                receiver: userId,
                read: true,
                readAt: now,
            });

            otherUsers.forEach((otherId) => {
                io.to(`user_${otherId}`).emit("messagesRead", {
                    landId: String(landId),
                    readerId: String(userId),
                    readAt: now.toISOString(),
                });
            });
        }

        const messages = await ChatMessage.find({
            land: landId,
            isDirect: false,
            $or: [{ sender: userId }, { receiver: userId }],
            deletedBy: { $ne: userId },
        })
            .sort({ createdAt: 1 })
            .populate("sender", "fullName email role phone avatar")
            .populate("receiver", "fullName email role phone avatar")
            .populate("land", "surveyNumber village district state");

        return res.status(200).json({
            success: true,
            count: messages.length,
            data: messages,
        });
    } catch (error) {
        console.error("GET CHAT HISTORY ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to get chat history",
        });
    }
};

/* ------------------------------------------------------------------ */
/*  GET MY CONVERSATIONS (inbox for Messages page)                     */
/* ------------------------------------------------------------------ */
/*  Groups land chats by (land, otherUser).                            */
/*  Groups direct chats by (isDirect=true, otherUser).                 */
/*  A direct chat is identified by landId: "direct" in the response.   */
/* ------------------------------------------------------------------ */

const getConversations = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);

        /*
        |------------------------------------------------------------------
        | Step 1 — Fetch every visible message for this user.
        | Using .find() (not .aggregate) so Mongoose auto-casts the
        | `deletedBy: { $ne: userId }` comparison correctly.
        |------------------------------------------------------------------
        */
        const messages = await ChatMessage.find({
            $or: [{ sender: userObjectId }, { receiver: userObjectId }],
            deletedBy: { $ne: userObjectId },
        })
            .sort({ createdAt: -1 })
            .lean();

        /*
        |------------------------------------------------------------------
        | Step 2 — Group by (land, isDirect, otherUser) in JS.
        | The first message encountered per group is the newest
        | (because we sorted by createdAt desc).
        |------------------------------------------------------------------
        */
        const grouped = new Map();

        messages.forEach((m) => {
            const senderId = String(m.sender);
            const receiverId = String(m.receiver);

            const otherUser =
                senderId === String(userObjectId) ? receiverId : senderId;

            const landKey = m.isDirect || !m.land ? "direct" : String(m.land);

            const key = `${landKey}-${otherUser}`;

            if (!grouped.has(key)) {
                grouped.set(key, {
                    id: key,
                    landId: landKey,
                    isDirect: m.isDirect === true || !m.land,
                    land: m.land || null,
                    otherUserId: otherUser,
                    lastMessage: m.message,
                    lastMessageAt: m.createdAt,
                    lastMessageId: m._id,
                    lastMessageRead: m.read || false,
                    lastMessageReadAt: m.readAt || null,
                    unreadCount:
                        receiverId === String(userObjectId) && !m.read
                            ? 1
                            : 0,
                });
            } else {
                // Message is older; only bump the unread counter if it's
                // an unread incoming message
                const existing = grouped.get(key);
                if (receiverId === String(userObjectId) && !m.read) {
                    existing.unreadCount += 1;
                }
            }
        });

        /*
        |------------------------------------------------------------------
        | Step 3 — Sort by newest activity.
        |------------------------------------------------------------------
        */
        const ordered = Array.from(grouped.values()).sort(
            (a, b) =>
                new Date(b.lastMessageAt || 0) -
                new Date(a.lastMessageAt || 0),
        );

        /*
        |------------------------------------------------------------------
        | Step 4 — Hydrate land + other user for each group.
        |------------------------------------------------------------------
        */
        const hydrated = await Promise.all(
            ordered.map(async (item) => {
                const [land, otherUser] = await Promise.all([
                    !item.isDirect && item.land
                        ? Land.findById(item.land)
                            .select("surveyNumber village district state")
                            .lean()
                        : Promise.resolve(null),
                    User.findById(item.otherUserId)
                        .select("fullName email role phone avatar")
                        .lean(),
                ]);

                return {
                    id: item.id,
                    landId: item.landId,
                    isDirect: item.isDirect,
                    land: land
                        ? {
                            _id: String(land._id),
                            surveyNumber: land.surveyNumber,
                            village: land.village,
                            district: land.district,
                            state: land.state,
                        }
                        : null,
                    user: otherUser
                        ? {
                            _id: String(otherUser._id),
                            fullName: otherUser.fullName,
                            email: otherUser.email,
                            role: otherUser.role,
                            phone: otherUser.phone || null,
                            avatar: otherUser.avatar || null,
                        }
                        : null,
                    lastMessage: {
                        _id: String(item.lastMessageId),
                        message: item.lastMessage,
                        createdAt: item.lastMessageAt,
                        read: item.lastMessageRead,
                        readAt: item.lastMessageReadAt,
                    },
                    unreadCount: item.unreadCount || 0,
                    updatedAt: item.lastMessageAt,
                };
            })
        );

        return res.status(200).json({
            success: true,
            count: hydrated.length,
            data: hydrated,
        });
    } catch (error) {
        console.error("GET CONVERSATIONS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to load conversations",
        });
    }
};

const deleteConversation = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { landId, otherUserId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid otherUserId",
            });
        }

        // Route /chat/direct/:otherUserId → landId is undefined → direct
        // Route /chat/:landId/:otherUserId → landId is set → land chat
        const isDirect = !landId;

        if (!isDirect && !mongoose.Types.ObjectId.isValid(landId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid landId or otherUserId",
            });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);

        const matchQuery = {
            $or: [
                { sender: userObjectId, receiver: otherUserId },
                { sender: otherUserId, receiver: userObjectId },
            ],
            deletedBy: { $ne: userObjectId },
        };

        if (isDirect) {
            matchQuery.isDirect = true;
        } else {
            matchQuery.land = landId;
            matchQuery.isDirect = false;
        }

        const result = await ChatMessage.updateMany(matchQuery, {
            $addToSet: { deletedBy: userObjectId },
        });

        return res.status(200).json({
            success: true,
            message: "Conversation removed from your inbox",
            removedCount: result.modifiedCount || 0,
        });
    } catch (error) {
        console.error("DELETE CONVERSATION ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete the conversation",
        });
    }
};

/* ------------------------------------------------------------------ */
/*  CLEAR ALL CONVERSATIONS (soft — hides messages for me only)        */
/* ------------------------------------------------------------------ */

const clearAllConversations = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);

        const result = await ChatMessage.updateMany(
            {
                $or: [{ sender: userObjectId }, { receiver: userObjectId }],
                deletedBy: { $ne: userObjectId },
            },
            {
                $addToSet: { deletedBy: userObjectId },
            }
        );

        const otherUserIds = await ChatMessage.distinct("sender", {
            receiver: userObjectId,
        });
        const otherReceiverIds = await ChatMessage.distinct("receiver", {
            sender: userObjectId,
        });

        const notifyIds = new Set([
            ...otherUserIds.map(String),
            ...otherReceiverIds.map(String),
        ]);
        notifyIds.delete(String(userId));

        notifyIds.forEach((otherId) => {
            io.to(`user_${otherId}`).emit("conversationCleared", {
                byUserId: String(userId),
            });
        });

        return res.status(200).json({
            success: true,
            message: "All conversations cleared successfully",
            clearedCount: result.modifiedCount || 0,
        });
    } catch (error) {
        console.error("CLEAR ALL CONVERSATIONS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to clear conversations",
        });
    }
};

export {
    sendMessage,
    getChatHistory,
    getConversations,
    deleteConversation,
    clearAllConversations,
};