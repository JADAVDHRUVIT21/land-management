import express from "express";

import {
    sendMessage,
    getChatHistory,
    getConversations,
    deleteConversation,
    clearAllConversations,
} from "../controllers/ChatController.js";

import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();


router.post("/send", verifyToken, sendMessage);


router.get("/conversations", verifyToken, getConversations);


router.delete("/", verifyToken, clearAllConversations);


router.delete(
    "/:landId/:otherUserId",
    verifyToken,
    deleteConversation
);

router.get("/:landId", verifyToken, getChatHistory);

export default router;