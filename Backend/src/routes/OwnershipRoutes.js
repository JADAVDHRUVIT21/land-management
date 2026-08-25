import express from "express";

import {
    createTransferRequest,
    getAllTransferRequests,
    getTransferById,
    approveTransfer,
    rejectTransfer,
} from "../controllers/OwnershipController.js";

import {
    verifyToken,
    isAdmin,
} from "../middlewares/AuthMiddleware.js";

const router = express.Router();


// CREATE TRANSFER REQUEST
router.post(
    "/",
    verifyToken,
    createTransferRequest
);


// GET ALL TRANSFER REQUESTS - ADMIN ONLY
router.get(
    "/",
    verifyToken,
    isAdmin,
    getAllTransferRequests
);


// GET SINGLE TRANSFER REQUEST
router.get(
    "/:id",
    verifyToken,
    getTransferById
);


// APPROVE TRANSFER - ADMIN ONLY
router.put(
    "/:id/approve",
    verifyToken,
    isAdmin,
    approveTransfer
);


// REJECT TRANSFER - ADMIN ONLY
router.put(
    "/:id/reject",
    verifyToken,
    isAdmin,
    rejectTransfer
);


export default router;