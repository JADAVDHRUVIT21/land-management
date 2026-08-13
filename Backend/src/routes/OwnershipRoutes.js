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
    isAdminOrOfficer,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
    "/",
    verifyToken,
    createTransferRequest
);

router.get(
    "/",
    verifyToken,
    isAdminOrOfficer,
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
    isAdminOrOfficer,
    approveTransfer
);

router.put(
    "/:id/reject",
    verifyToken,
    isAdminOrOfficer,
    rejectTransfer
);

export default router;