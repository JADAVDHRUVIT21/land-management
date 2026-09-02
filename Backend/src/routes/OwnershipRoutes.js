import express from "express";

import {
    createTransferRequest,
    getAllTransferRequests,
    getMyTransferRequests,
    getTransferById,
    approveTransfer,
    rejectTransfer,
} from "../controllers/OwnershipController.js";

import {
    verifyToken,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
    "/",
    verifyToken,
    createTransferRequest
);

router.get(
    "/my",
    verifyToken,
    getMyTransferRequests
);

router.get(
    "/",
    verifyToken,
    getAllTransferRequests
);

router.get(
    "/:id",
    verifyToken,
    getTransferById
);

router.put(
    "/:id/approve",
    verifyToken,
    approveTransfer
);

router.put(
    "/:id/reject",
    verifyToken,
    rejectTransfer
);

export default router;