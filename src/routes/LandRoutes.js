import express from "express";

import {
    createLand,
    getAllLands,
    getLandById,
    updateLand,
    deleteLand,
} from "../controllers/landController.js";

import {
    verifyToken,
    isAdmin,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create Land
router.post(
    "/",
    verifyToken,
    isAdmin,
    createLand
);

// Get All Lands
router.get(
    "/",
    verifyToken,
    isAdmin,
    getAllLands
);

// Get Single Land
router.get(
    "/:id",
    verifyToken,
    getLandById
);

// Update Land
router.put(
    "/:id",
    verifyToken,
    isAdmin,
    updateLand
);

// Delete Land
router.delete(
    "/:id",
    verifyToken,
    isAdmin,
    deleteLand
);

export default router;