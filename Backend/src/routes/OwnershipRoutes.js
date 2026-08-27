import express from "express";

import {
    createTransferRequest,
    getAllTransferRequests,
    getTransferById,
    approveTransfer,
    rejectTransfer,
} from "../controllers/OwnershipController.js";

import {
    isAdmin,
    isUser,
    verifyToken,
    // isAdminOrOfficer,
    
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// CREATE OWNERSHIP TRANSFER REQUEST


// CREATE TRANSFER REQUEST
router.post(
    "/",
    verifyToken,
    isUser,
    createTransferRequest
);

// GET ALL OWNERSHIP TRANSFER REQUESTS


// GET ALL TRANSFER REQUESTS - ADMIN ONLY
router.get(
    "/",
    verifyToken,
    isAdmin,
    getAllTransferRequests
);

// GET OWNERSHIP TRANSFER BY ID


// GET SINGLE TRANSFER REQUEST
router.get(
    "/:id",
    verifyToken,
    getTransferById
);

router.put(
    "/:id/approve",
    verifyToken,
    isAdmin,
    approveTransfer
);

// REJECT OWNERSHIP TRANSFER


// REJECT TRANSFER - ADMIN ONLY
router.put(
    "/:id/reject",
    verifyToken,
    isAdmin,
    rejectTransfer
);


export default router;