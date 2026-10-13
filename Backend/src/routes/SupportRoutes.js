import express from "express";
import {
    createTicket,
    getMyTickets,
    getTicketById,
    getAllTickets,
    updateTicketStatus,
    replyToTicket,
} from "../controllers/SupportController.js";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* User routes */
router.post("/", verifyToken, createTicket);
router.get("/my", verifyToken, getMyTickets);
router.get("/:id", verifyToken, getTicketById);
router.post("/:id/reply", verifyToken, replyToTicket);

/* Admin routes */
router.get("/", verifyToken, isAdmin, getAllTickets);
router.put("/:id/status", verifyToken, isAdmin, updateTicketStatus);

export default router;