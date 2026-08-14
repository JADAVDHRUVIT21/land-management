import express from "express";

import {
    getDashboardStats,
} from "../controllers/dashboardController.js";

import {
    verifyToken,
    isAdmin,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Admin Dashboard Statistics
router.get(
    "/stats",
    verifyToken,
    isAdmin,
    getDashboardStats
);

export default router;