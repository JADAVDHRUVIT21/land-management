import express from "express";
import { createDocument, getAllDocuments, getDocumentById, getDocumentsByLand, updateDocument, deleteDocument, approveDocument, rejectDocument } from "../controllers/DocumentController.js";

import {
    verifyToken,
    isAdmin,
    isAdminOrUser,
} from "../middlewares/authMiddleware.js";

import upload from "../middlewares/CloudinaryUpload.js";

const router = express.Router();

// CREATE DOCUMENT
router.post(
    "/",
    verifyToken,
    upload.single("file"),
    createDocument
);

// GET ALL DOCUMENTS
router.get(
    "/",
    verifyToken,
    isAdmin,
    getAllDocuments
);

// GET DOCUMENTS BY LAND
router.get(
    "/land/:landId",
    verifyToken,
    getDocumentsByLand
);

// GET SINGLE DOCUMENT
router.get(
    "/:id",
    verifyToken,
    getDocumentById
);

// UPDATE DOCUMENT
router.put(
    "/:id",
    verifyToken,
    isAdmin,
    updateDocument
);

// DELETE DOCUMENT
router.delete(
    "/:id",
    verifyToken,
    isAdmin,
    deleteDocument
);

// APPROVE DOCUMENT
router.put(
    "/:id/approve",
    verifyToken,
    isAdmin,
    approveDocument
);

// REJECT DOCUMENT
router.put(
    "/:id/reject",
    verifyToken,
    isAdmin,
    rejectDocument
);

export default router;