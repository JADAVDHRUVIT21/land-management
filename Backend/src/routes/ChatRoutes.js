import express from "express";

import {
    sendMessage,
    getChatHistory,
    getConversations,
} from "../controllers/ChatController.js";

import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/send", verifyToken, sendMessage);


router.get("/conversations", verifyToken, getConversations);

router.get("/:landId", verifyToken, getChatHistory);

export default router;