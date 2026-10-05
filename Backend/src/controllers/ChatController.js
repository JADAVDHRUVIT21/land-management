import mongoose from "mongoose";

import ChatMessage from "../models/ChatMessageModel.js";
import Land from "../models/LandModel.js";
import User from "../models/UserModels.js";
import OwnershipTransfer from "../models/OwnershipTransfer.js";
import { redactMessage } from "../utils/chatRedaction.js";
import { checkProfanity } from "../utils/profanityService.js";

/* ------------------------------------------------------------------ */
/*  Helper: is this user allowed to chat about this land?              */
/* ------------------------------------------------------------------ */
/*  Allowed if ANY of the following is true:                           */
/*    1. User is an admin                                              */
/*    2. User is the current owner of the land                         */
/*    3. User is a participant in a Pending/Approved transfer          */
/*    4. The land is publicly listed for sale (any logged-in user)     */
/* ------------------------------------------------------------------ */

const isUserAuthorizedForLandChat = async ({ userId, user, land }) => {
    // 1. Admin
    if (user.role === "admin") return true;

    // 2. Current owner
    if (land.owner.toString() === userId.toString()) return true;

    // 3. Ownership transfer participant
    const transfer = await OwnershipTransfer.findOne({
        land: land._id,
        status: { $in: ["Pending", "Approved"] },
        $or: [{ currentOwner: userId }, { newOwner: userId }],
    });

    if (transfer) return true;

    // 4. Public listing — any authenticated user can initiate chat
    if (land.isForSale === true) return true;

    return false;
};

/* ------------------------------------------------------------------ */
/*  SEND MESSAGE                                                       */
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

        if (!landId || !receiverId || !message?.trim()) {
            return res.status(400).json({
                success: false,
                message: "landId, receiverId and message are required",
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(landId) ||
            !mongoose.Types.ObjectId.isValid(receiverId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid landId or receiverId",
            });
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

        // Load land, sender, receiver
        const land = await Land.findById(landId);

        if (!land) {
            return res.status(404).json({
                success: false,
                message: "Land not found",
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

        // Can't message yourself
        if (userId.toString() === receiverId.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot send a message to yourself",
            });
        }

        // Sender authorization
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

        // Receiver authorization
        const receiverAuthorized = await isUserAuthorizedForLandChat({
            userId: receiverId,
            user: receiver,
            land,
        });

        if (!receiverAuthorized) {
            return res.status(403).json({
                success: false,
                message: "Receiver is not authorized for this land chat",
            });
        }

        // Redact email / phone
        const filtered = redactMessage(cleanMessage);

        // Create
        const chatMessage = await ChatMessage.create({
            land: landId,
            sender: userId,
            receiver: receiverId,
            message: filtered.message,
            isRedacted: filtered.isRedacted,
        });

        const populatedMessage = await ChatMessage.findById(chatMessage._id)
            .populate("sender", "fullName email role")
            .populate("receiver", "fullName email role")
            .populate("land", "surveyNumber village district state");

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
/*  GET CHAT HISTORY (per land)                                        */
/* ------------------------------------------------------------------ */

const getChatHistory = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { landId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

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

        // Return only messages where the current user is sender or receiver
        const messages = await ChatMessage.find({
            land: landId,
            $or: [{ sender: userId }, { receiver: userId }],
        })
            .sort({ createdAt: 1 })
            .populate("sender", "fullName email role")
            .populate("receiver", "fullName email role")
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
/*  Returns one entry per (land, other-user) pair the current user     */
/*  has exchanged messages with.                                       */
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

        const conversations = await ChatMessage.aggregate([
            {
                $match: {
                    $or: [
                        { sender: userObjectId },
                        { receiver: userObjectId },
                    ],
                },
            },
            {
                $sort: { createdAt: -1 },
            },
            {
                $group: {
                    _id: {
                        land: "$land",
                        otherUser: {
                            $cond: [
                                { $eq: ["$sender", userObjectId] },
                                "$receiver",
                                "$sender",
                            ],
                        },
                    },
                    lastMessage: { $first: "$message" },
                    lastMessageAt: { $first: "$createdAt" },
                    lastMessageId: { $first: "$_id" },
                },
            },
            {
                $sort: { lastMessageAt: -1 },
            },
        ]);

        const hydrated = await Promise.all(
            conversations.map(async (item) => {
                const [land, otherUser] = await Promise.all([
                    Land.findById(item._id.land)
                        .select("surveyNumber village district state")
                        .lean(),
                    User.findById(item._id.otherUser)
                        .select("fullName email role")
                        .lean(),
                ]);

                return {
                    id: `${item._id.land}-${item._id.otherUser}`,
                    landId: String(item._id.land),
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
                        }
                        : null,
                    lastMessage: {
                        _id: String(item.lastMessageId),
                        message: item.lastMessage,
                        createdAt: item.lastMessageAt,
                    },
                    updatedAt: item.lastMessageAt,
                };
            }),
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

export { sendMessage, getChatHistory, getConversations };