import mongoose from "mongoose";
import SupportTicket from "../models/SupportTicketModel.js";

/* ------------------------------------------------------------------ */
/*  CREATE TICKET (user)                                               */
/* ------------------------------------------------------------------ */

const createTicket = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const { subject, category, message } = req.body || {};

        if (!subject?.trim() || !message?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Subject and message are required.",
            });
        }

        if (subject.trim().length > 200) {
            return res.status(400).json({
                success: false,
                message: "Subject must be under 200 characters.",
            });
        }

        if (message.trim().length > 5000) {
            return res.status(400).json({
                success: false,
                message: "Message must be under 5000 characters.",
            });
        }

        const allowedCategories = [
            "General",
            "Technical",
            "Billing",
            "Account",
            "Land Listing",
            "Chat / Messages",
            "Report a Bug",
            "Other",
        ];

        const finalCategory = allowedCategories.includes(category)
            ? category
            : "General";

        const ticket = await SupportTicket.create({
            user: userId,
            subject: subject.trim(),
            category: finalCategory,
            message: message.trim(),
        });

        return res.status(201).json({
            success: true,
            message: "Support ticket submitted. We'll get back to you soon.",
            ticket,
        });
    } catch (error) {
        console.error("CREATE TICKET ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to submit ticket.",
        });
    }
};

/* ------------------------------------------------------------------ */
/*  MY TICKETS (user)                                                  */
/* ------------------------------------------------------------------ */

const getMyTickets = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const tickets = await SupportTicket.find({ user: userId })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: tickets.length,
            tickets,
        });
    } catch (error) {
        console.error("GET MY TICKETS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch your tickets.",
        });
    }
};

/* ------------------------------------------------------------------ */
/*  SINGLE TICKET (user must own it)                                   */
/* ------------------------------------------------------------------ */

const getTicketById = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID.",
            });
        }

        const ticket = await SupportTicket.findById(id).lean();

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found.",
            });
        }

        if (
            String(ticket.user) !== String(userId) &&
            req.user?.role !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to view this ticket.",
            });
        }

        return res.status(200).json({
            success: true,
            ticket,
        });
    } catch (error) {
        console.error("GET TICKET ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch ticket.",
        });
    }
};

/* ------------------------------------------------------------------ */
/*  ADMIN: GET ALL TICKETS                                             */
/* ------------------------------------------------------------------ */

const getAllTickets = async (req, res) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required.",
            });
        }

        const { status } = req.query;

        const filter = {};
        if (status) filter.status = status;

        const tickets = await SupportTicket.find(filter)
            .populate("user", "fullName email phone role")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: tickets.length,
            tickets,
        });
    } catch (error) {
        console.error("GET ALL TICKETS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch tickets.",
        });
    }
};

/* ------------------------------------------------------------------ */
/*  ADMIN: UPDATE STATUS                                               */
/* ------------------------------------------------------------------ */

const updateTicketStatus = async (req, res) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required.",
            });
        }

        const { id } = req.params;
        const { status } = req.body || {};

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID.",
            });
        }

        const allowed = ["Open", "In Progress", "Resolved", "Closed"];

        if (!allowed.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${allowed.join(", ")}.`,
            });
        }

        const ticket = await SupportTicket.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Ticket status updated.",
            ticket,
        });
    } catch (error) {
        console.error("UPDATE TICKET STATUS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update ticket.",
        });
    }
};

/* ------------------------------------------------------------------ */
/*  ADMIN: REPLY TO TICKET                                             */
/* ------------------------------------------------------------------ */

const replyToTicket = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const isAdmin = req.user?.role === "admin";
        const { id } = req.params;
        const { message } = req.body || {};

        if (!message?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Reply message is required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID.",
            });
        }

        const ticket = await SupportTicket.findById(id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found.",
            });
        }

        if (
            String(ticket.user) !== String(userId) &&
            !isAdmin
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to reply to this ticket.",
            });
        }

        ticket.replies.push({
            from: isAdmin ? "Support" : "User",
            message: message.trim(),
        });

        if (isAdmin && ticket.status === "Open") {
            ticket.status = "In Progress";
        }

        await ticket.save();

        return res.status(200).json({
            success: true,
            message: "Reply added.",
            ticket,
        });
    } catch (error) {
        console.error("REPLY TO TICKET ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to add reply.",
        });
    }
};

export {
    createTicket,
    getMyTickets,
    getTicketById,
    getAllTickets,
    updateTicketStatus,
    replyToTicket,
};