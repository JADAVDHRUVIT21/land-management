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

/* ------------------------------------------------------------------ */
/*  Startup sanity check — confirm Cloudinary env vars are loaded      */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  Body parsers                                                       */
/*  ⚠️ IMPORTANT: These run for every request, INCLUDING multipart.    */
/*  But since express.json() and express.urlencoded() both SKIP when   */
/*  Content-Type is multipart/form-data, multer still works.           */
/*  This is correct and safe.                                          */
/* ------------------------------------------------------------------ */
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
/*  Socket.io                                                          */
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
    const userId = socket.user?.id || socket.user?._id;
    const userRole = socket.user?.role;

    console.log(
        "Socket connected:",
        socket.id,
        "User:",
        userId,
        "Role:",
        userRole
    );

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

            if (!isAdmin && !isCurrentOwner && !isTransferParticipant) {
                socket.emit("chatError", {
                    message: "You are not authorized to join this chat",
                });
                return;
            }

            socket.join(`land_${landId}`);

            console.log(`User ${userId} joined land chat ${landId}`);

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

            const senderIsParticipant = !!senderTransfer;
            const receiverIsParticipant = !!receiverTransfer;

            const senderAuthorized =
                senderIsAdmin || senderIsCurrentOwner || senderIsParticipant;

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
                receiverIsParticipant;

            if (!receiverAuthorized) {
                socket.emit("chatError", {
                    message:
                        "Receiver is not authorized for this land chat",
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
            });

            const populatedMessage = await ChatMessage.findById(chatMessage._id)
                .populate("sender", "fullName email role")
                .populate("receiver", "fullName email role")
                .populate("land", "surveyNumber village district state");

            io.to(`land_${landId}`).emit("newMessage", populatedMessage);

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

    socket.on("disconnect", () => {
        console.log(
            "Socket disconnected:",
            socket.id,
            "User:",
            userId
        );
    });
});

/* ------------------------------------------------------------------ */
/*  GLOBAL ERROR HANDLER                                               */
/*  Must be the LAST app.use() — catches multer errors, JWT errors,    */
/*  and any unhandled errors from routes.                              */
/* ------------------------------------------------------------------ */
app.use((err, req, res, next) => {
    console.error("\n========== GLOBAL ERROR ==========");
    console.error("Name:", err.name);
    console.error("Message:", err.message);
    console.error("Code:", err.code);
    console.error("Stack:", err.stack);
    console.error("==================================\n");

    // Multer-specific errors
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                success: false,
                message:
                    "File too large. Maximum size is 100MB per file.",
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

    // Custom file-filter error from CloudinaryUpload.js
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