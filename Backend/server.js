import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import multer from "multer";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./src/config/db.js";
import userRoutes from "./src/routes/UserRoutes.js";
import landRoutes from "./src/routes/LandRoutes.js";
import ownershipRoutes from "./src/routes/OwnershipRoutes.js";
import documentRoutes from "./src/routes/DocumentRoutes.js";
import dashboardRoutes from "./src/routes/DashboardRoutes.js";
import chatRoutes from "./src/routes/ChatRoutes.js";
import brokerRoutes from "./src/routes/BrokerRoutes.js";
import ChatMessage from "./src/models/ChatMessageModel.js";
import Land from "./src/models/LandModel.js";
import User from "./src/models/UserModels.js";
import OwnershipTransfer from "./src/models/OwnershipTransfer.js";
import { redactMessage } from "./src/utils/chatRedaction.js";

dotenv.config();

console.log("===== ENV CHECK =====");
console.log(
    "CLOUDINARY_CLOUD_NAME:",
    process.env.CLOUDINARY_CLOUD_NAME ? "✓ present" : "✗ MISSING"
);
console.log(
    "CLOUDINARY_API_KEY:",
    process.env.CLOUDINARY_API_KEY ? "✓ present" : "✗ MISSING"
);
console.log(
    "CLOUDINARY_API_SECRET:",
    process.env.CLOUDINARY_API_SECRET ? "✓ present" : "✗ MISSING"
);
console.log("=====================\n");

connectDB();

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ------------------------------------------------------------------ */
/*  Routes                                                             */
/* ------------------------------------------------------------------ */
app.use("/api/users", userRoutes);
app.use("/api/lands", landRoutes);
app.use("/api/ownership-transfers", ownershipRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/brokers", brokerRoutes);

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Land Management API Running...",
    });
});

/* ------------------------------------------------------------------ */
/*  Online presence tracking                                           */
/* ------------------------------------------------------------------ */
/*  Map<userId, Set<socketId>> so multiple tabs are handled correctly. */
/* ------------------------------------------------------------------ */

export const onlineUsers = new Map();

const isUserOnline = (userId) => {
    const set = onlineUsers.get(String(userId));
    return !!set && set.size > 0;
};

/* ------------------------------------------------------------------ */
/*  Socket.io auth                                                     */
/* ------------------------------------------------------------------ */

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication token required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        socket.user = decoded;

        next();
    } catch (error) {
        console.error("SOCKET JWT ERROR:", error.message);
        next(new Error("Invalid or expired token"));
    }
});

io.on("connection", (socket) => {
    const userId = String(socket.user?.id || socket.user?._id);
    const userRole = socket.user?.role;

    console.log(
        "Socket connected:",
        socket.id,
        "User:",
        userId,
        "Role:",
        userRole
    );

    /* ---- Presence: register this socket ---- */

    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
    }

    const userSockets = onlineUsers.get(userId);
    const wasOffline = userSockets.size === 0;
    userSockets.add(socket.id);

    // Every user automatically joins their personal room
    socket.join(`user_${userId}`);

    // If this is the first socket for this user, broadcast "online"
    if (wasOffline) {
        io.emit("userOnline", { userId });
    }

    // Tell the newly connected socket who is currently online
    socket.emit("onlineUsers", {
        userIds: Array.from(onlineUsers.keys()),
    });

    /* ---- Optional: existing joinLandChat still works ---- */

    socket.on("joinLandChat", async (data) => {
        try {
            const { landId } = data;

            if (!landId) {
                socket.emit("chatError", { message: "landId is required" });
                return;
            }

            const land = await Land.findById(landId);

            if (!land) {
                socket.emit("chatError", { message: "Land not found" });
                return;
            }

            const user = await User.findById(userId);

            if (!user) {
                socket.emit("chatError", { message: "User not found" });
                return;
            }

            const isAdmin = user.role === "admin";
            const isCurrentOwner =
                land.owner.toString() === userId.toString();

            const isTransferParticipant = await OwnershipTransfer.exists({
                land: landId,
                status: { $in: ["Pending", "Approved"] },
                $or: [
                    { currentOwner: userId },
                    { newOwner: userId },
                ],
            });

            const isPublicListing = land.isForSale === true;

            if (
                !isAdmin &&
                !isCurrentOwner &&
                !isTransferParticipant &&
                !isPublicListing
            ) {
                socket.emit("chatError", {
                    message: "You are not authorized to join this chat",
                });
                return;
            }

            socket.join(`land_${landId}`);

            socket.emit("chatJoined", {
                success: true,
                landId,
                message: "Joined land chat successfully",
            });
        } catch (error) {
            console.error("JOIN CHAT ERROR:", error);
            socket.emit("chatError", { message: "Failed to join chat" });
        }
    });

    /* ---- Typing indicators ---- */

    socket.on("typing", (data) => {
        const { landId, receiverId } = data || {};
        if (!landId || !receiverId) return;

        io.to(`user_${receiverId}`).emit("typing", {
            landId,
            fromUserId: userId,
        });
    });

    socket.on("stopTyping", (data) => {
        const { landId, receiverId } = data || {};
        if (!landId || !receiverId) return;

        io.to(`user_${receiverId}`).emit("stopTyping", {
            landId,
            fromUserId: userId,
        });
    });

    /* ---- Socket-based sendMessage (legacy) ---- */

    socket.on("sendMessage", async (data) => {
        try {
            const { landId, receiverId, message } = data;

            if (!landId || !receiverId || !message?.trim()) {
                socket.emit("chatError", {
                    message: "landId, receiverId and message are required",
                });
                return;
            }

            const land = await Land.findById(landId);
            if (!land) {
                socket.emit("chatError", { message: "Land not found" });
                return;
            }

            const sender = await User.findById(userId);
            const receiver = await User.findById(receiverId);

            if (!sender || !receiver) {
                socket.emit("chatError", {
                    message: "Sender or receiver not found",
                });
                return;
            }

            const senderIsAdmin = sender.role === "admin";
            const receiverIsAdmin = receiver.role === "admin";

            const senderIsCurrentOwner =
                land.owner.toString() === userId.toString();
            const receiverIsCurrentOwner =
                land.owner.toString() === receiverId.toString();

            const senderTransfer = await OwnershipTransfer.findOne({
                land: landId,
                status: { $in: ["Pending", "Approved"] },
                $or: [
                    { currentOwner: userId },
                    { newOwner: userId },
                ],
            });

            const receiverTransfer = await OwnershipTransfer.findOne({
                land: landId,
                status: { $in: ["Pending", "Approved"] },
                $or: [
                    { currentOwner: receiverId },
                    { newOwner: receiverId },
                ],
            });

            const isPublicListing = land.isForSale === true;

            const senderAuthorized =
                senderIsAdmin ||
                senderIsCurrentOwner ||
                !!senderTransfer ||
                isPublicListing;

            if (!senderAuthorized) {
                socket.emit("chatError", {
                    message:
                        "You are not authorized to send messages for this land",
                });
                return;
            }

            const receiverAuthorized =
                receiverIsAdmin ||
                receiverIsCurrentOwner ||
                !!receiverTransfer ||
                isPublicListing;

            if (!receiverAuthorized) {
                socket.emit("chatError", {
                    message: "Receiver is not authorized for this land chat",
                });
                return;
            }

            const filtered = redactMessage(message.trim());

            const chatMessage = await ChatMessage.create({
                land: landId,
                sender: userId,
                receiver: receiverId,
                message: filtered.message,
                isRedacted: filtered.isRedacted,
                read: false,
            });

            const populatedMessage = await ChatMessage.findById(chatMessage._id)
                .populate("sender", "fullName email role phone")
                .populate("receiver", "fullName email role phone")
                .populate("land", "surveyNumber village district state");

            io.to(`user_${receiverId}`).emit("newMessage", populatedMessage);
            io.to(`user_${userId}`).emit("newMessage", populatedMessage);

            socket.emit("messageSent", {
                success: true,
                message: populatedMessage,
            });
        } catch (error) {
            console.error("SEND SOCKET MESSAGE ERROR:", error);
            socket.emit("chatError", {
                message: error.message || "Failed to send message",
            });
        }
    });

    /* ---- Disconnect & presence cleanup ---- */

    socket.on("disconnect", () => {
        const set = onlineUsers.get(userId);

        if (set) {
            set.delete(socket.id);

            if (set.size === 0) {
                onlineUsers.delete(userId);
                io.emit("userOffline", { userId });
            }
        }

        console.log("Socket disconnected:", socket.id, "User:", userId);
    });
});

/* ------------------------------------------------------------------ */
/*  Global error handler                                               */
/* ------------------------------------------------------------------ */
app.use((err, req, res, next) => {
    console.error("\n========== GLOBAL ERROR ==========");
    console.error("Name:", err.name);
    console.error("Message:", err.message);
    console.error("Code:", err.code);
    console.error("==================================\n");

    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                success: false,
                message: "File too large. Maximum size is 100MB per file.",
            });
        }
        if (err.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({
                success: false,
                message: "Too many files uploaded.",
            });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({
                success: false,
                message:
                    "Unexpected file field. Use 'image' or 'video' field names.",
            });
        }
        return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`,
        });
    }

    if (err.message?.startsWith("Unsupported file format")) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
});

/* Export io so controllers can emit events after HTTP requests */
export { io };