import express from "express";

import {sendMessage, getChatHistory,} from "../controllers/ChatController.js";

import {verifyToken,} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
    "/send",
    verifyToken,
    sendMessage
);

router.get(
    "/:landId",
    verifyToken,
    getChatHistory
);

export default router;