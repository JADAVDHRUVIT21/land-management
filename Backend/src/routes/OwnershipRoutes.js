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
    isAdminOrOfficer,
} from "../middlewares/authMiddleware.js";

const router = express.Router();


// Create transfer request
router.post(
    "/",
    verifyToken,
    createTransferRequest
);


// Get all transfer requests
// Admin / Officer
router.get(
    "/",
    verifyToken,
    isAdminOrOfficer,
    getAllTransferRequests
);


// Get single transfer request
router.get(
    "/:id",
    verifyToken,
    getTransferById
);


// Approve transfer
// Admin / Officer
router.put(
    "/:id/approve",
    verifyToken,
    isAdminOrOfficer,
    approveTransfer
);


// Reject transfer
// Admin / Officer
router.put(
    "/:id/reject",
    verifyToken,
    isAdminOrOfficer,
    rejectTransfer
);


export default router;