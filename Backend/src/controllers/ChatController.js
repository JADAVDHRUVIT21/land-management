import mongoose from "mongoose";

import ChatMessage from "../models/ChatMessageModel.js";
import Land from "../models/LandModel.js";
import User from "../models/UserModels.js";
import OwnershipTransfer from "../models/OwnershipTransfer.js";

import { redactMessage } from "../utils/chatRedaction.js";
import { checkProfanity } from "../utils/profanityService.js";

// SEND MESSAGE

const sendMessage = async (req, res) => {
    try {

        // Get logged-in user

        const userId =
            req.user?.id ||
            req.user?._id;

        // Get request body

        const {
            landId,
            receiverId,
            message,
        } = req.body;

        // Authentication check

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required",
            });
        }

        // Required fields

        if (
            !landId ||
            !receiverId ||
            !message?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "landId, receiverId and message are required",
            });
        }

        // Validate ObjectIds

        if (
            !mongoose.Types.ObjectId.isValid(
                landId
            ) ||
            !mongoose.Types.ObjectId.isValid(
                receiverId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid landId or receiverId",
            });
        }

        // CLEAN MESSAGE

        const cleanMessage =
            message.trim();

        // PROFANITY CHECK

        const profanityResult =
            await checkProfanity(
                cleanMessage
            );

        // PROFANITY API ERROR

        if (profanityResult.error) {
            return res.status(503).json({
                success: false,
                message:
                    "Message moderation service is temporarily unavailable. Please try again.",
            });
        }

        // ABUSIVE MESSAGE DETECTED

        if (profanityResult.isProfanity) {
            return res.status(400).json({
                success: false,
                message:
                    "Your message contains inappropriate language and cannot be sent.",
            });
        }

        // FIND LAND

        const land =
            await Land.findById(
                landId
            );

        if (!land) {
            return res.status(404).json({
                success: false,
                message:
                    "Land not found",
            });
        }

        // FIND SENDER

        const sender =
            await User.findById(
                userId
            );

        // FIND RECEIVER

        const receiver =
            await User.findById(
                receiverId
            );

        if (
            !sender ||
            !receiver
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "User not found",
            });
        }

        // CHECK ADMIN

        const senderIsAdmin =
            sender.role === "admin";

        const receiverIsAdmin =
            receiver.role === "admin";

        // CHECK CURRENT OWNER

        const senderIsCurrentOwner =
            land.owner.toString() ===
            userId.toString();

        const receiverIsCurrentOwner =
            land.owner.toString() ===
            receiverId.toString();

        // CHECK SENDER OWNERSHIP TRANSFER

        const senderTransfer =
            await OwnershipTransfer.findOne(
                {
                    land: landId,

                    status: {
                        $in: [
                            "Pending",
                            "Approved",
                        ],
                    },

                    $or: [
                        {
                            currentOwner:
                                userId,
                        },
                        {
                            newOwner:
                                userId,
                        },
                    ],
                }
            );

        // CHECK RECEIVER OWNERSHIP TRANSFER

        const receiverTransfer =
            await OwnershipTransfer.findOne(
                {
                    land: landId,

                    status: {
                        $in: [
                            "Pending",
                            "Approved",
                        ],
                    },

                    $or: [
                        {
                            currentOwner:
                                receiverId,
                        },
                        {
                            newOwner:
                                receiverId,
                        },
                    ],
                }
            );

        // SENDER AUTHORIZATION

        const senderAuthorized =
            senderIsAdmin ||
            senderIsCurrentOwner ||
            !!senderTransfer;

        if (!senderAuthorized) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to send messages for this land",
            });
        }

        // RECEIVER AUTHORIZATION

        const receiverAuthorized =
            receiverIsAdmin ||
            receiverIsCurrentOwner ||
            !!receiverTransfer;

        if (!receiverAuthorized) {
            return res.status(403).json({
                success: false,
                message:
                    "Receiver is not authorized for this land chat",
            });
        }

        // EMAIL + PHONE REDACTION

        const filtered =
            redactMessage(
                cleanMessage
            );

        // CREATE CHAT MESSAGE

        const chatMessage =
            await ChatMessage.create(
                {
                    land: landId,

                    sender: userId,

                    receiver:
                        receiverId,

                    message:
                        filtered.message,

                    isRedacted:
                        filtered.isRedacted,
                }
            );

        // POPULATE MESSAGE

        const populatedMessage =
            await ChatMessage.findById(
                chatMessage._id
            )
                .populate(
                    "sender",
                    "fullName email role"
                )
                .populate(
                    "receiver",
                    "fullName email role"
                )
                .populate(
                    "land",
                    "surveyNumber village district state"
                );

        // SUCCESS RESPONSE

        return res.status(201).json({
            success: true,

            message:
                "Message sent successfully",

            data:
                populatedMessage,
        });

    } catch (error) {

        console.error(
            "SEND CHAT MESSAGE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                error.message ||
                "Failed to send message",
        });
    }
};

// GET CHAT HISTORY

const getChatHistory = async (
    req,
    res
) => {
    try {

        // Get logged-in user

        const userId =
            req.user?.id ||
            req.user?._id;

        // Get land ID

        const {
            landId,
        } = req.params;

        // Authentication check

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required",
            });
        }

        // Validate land ID

        if (
            !mongoose.Types.ObjectId.isValid(
                landId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid landId",
            });
        }

        // FIND LAND

        const land =
            await Land.findById(
                landId
            );

        if (!land) {
            return res.status(404).json({
                success: false,
                message:
                    "Land not found",
            });
        }

        // FIND USER

        const user =
            await User.findById(
                userId
            );

        if (!user) {
            return res.status(404).json({
                success: false,
                message:
                    "User not found",
            });
        }

        // CHECK ADMIN

        const isAdmin =
            user.role === "admin";

        // CHECK CURRENT OWNER

        const isCurrentOwner =
            land.owner.toString() ===
            userId.toString();

        // CHECK OWNERSHIP TRANSFER

        const transfer =
            await OwnershipTransfer.findOne(
                {
                    land: landId,

                    status: {
                        $in: [
                            "Pending",
                            "Approved",
                        ],
                    },

                    $or: [
                        {
                            currentOwner:
                                userId,
                        },
                        {
                            newOwner:
                                userId,
                        },
                    ],
                }
            );

        const isTransferParticipant =
            !!transfer;

        // CHAT AUTHORIZATION

        if (
            !isAdmin &&
            !isCurrentOwner &&
            !isTransferParticipant
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to view this chat",
            });
        }

        // GET CHAT HISTORY

        const messages =
            await ChatMessage.find(
                {
                    land: landId,

                    $or: [
                        {
                            sender:
                                userId,
                        },
                        {
                            receiver:
                                userId,
                        },
                    ],
                }
            )
                .sort({
                    createdAt: 1,
                })
                .populate(
                    "sender",
                    "fullName email role"
                )
                .populate(
                    "receiver",
                    "fullName email role"
                )
                .populate(
                    "land",
                    "surveyNumber village district state"
                );

        // SUCCESS RESPONSE

        return res.status(200).json({
            success: true,

            count:
                messages.length,

            data:
                messages,
        });

    } catch (error) {

        console.error(
            "GET CHAT HISTORY ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                error.message ||
                "Failed to get chat history",
        });
    }
};

export { sendMessage, getChatHistory, };