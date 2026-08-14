import express from "express";

import {
    createTransferRequest,
    getAllTransferRequests,
    getTransferById,
    approveTransfer,
    rejectTransfer,
} from "../controllers/ownershipController.js";

import {
    verifyToken,
    isAdmin,
    isUser,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// CREATE OWNERSHIP TRANSFER REQUEST

router.post(
    "/",
    verifyToken,
    isUser,
    createTransferRequest
);

// GET ALL OWNERSHIP TRANSFER REQUESTS

router.get(
    "/",
    verifyToken,
    isAdmin,
    getAllTransferRequests
);

// GET OWNERSHIP TRANSFER BY ID

router.get(
    "/:id",
    verifyToken,
    getTransferById
);

// APPROVE OWNERSHIP TRANSFER
router.put(
    "/:id/approve",
    verifyToken,
    isAdmin,
    approveTransfer
);

// REJECT OWNERSHIP TRANSFER

router.put(
    "/:id/reject",
    verifyToken,
    isAdmin,
    rejectTransfer
);

export default router;