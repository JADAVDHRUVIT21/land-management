import express from "express";

import {
    createDocument,
    getAllDocuments,
    getMyDocuments,
    getDocumentById,
    getDocumentsByLand,
    updateDocument,
    deleteDocument,
    approveDocument,
    rejectDocument,
} from "../controllers/DocumentController.js";

import {
    verifyToken,
} from "../middlewares/authMiddleware.js";

import upload from "../middlewares/CloudinaryUpload.js";

const router = express.Router();

// Upload document
router.post(
    "/",
    verifyToken,
    upload.single("document"),
    createDocument
);

// Get all documents
router.get(
    "/",
    verifyToken,
    getAllDocuments
);

// Get my documents
router.get(
    "/my",
    verifyToken,
    getMyDocuments
);

// Get documents by land
router.get(
    "/land/:landId",
    verifyToken,
    getDocumentsByLand
);

// Get document by ID
router.get(
    "/:id",
    verifyToken,
    getDocumentById
);

// Update document
router.put(
    "/:id",
    verifyToken,
    updateDocument
);

// Delete document
router.delete(
    "/:id",
    verifyToken,
    deleteDocument
);

// Approve document
router.put(
    "/:id/approve",
    verifyToken,
    approveDocument
);

// Reject document
router.put(
    "/:id/reject",
    verifyToken,
    rejectDocument
);

export default router;