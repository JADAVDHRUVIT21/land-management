import express from "express";

import {
    getDashboardStats,
    getAdminStats,
    getAdminRecentUsers,
    getAdminRecentLands,
    getAdminCharts,
    getAdminUsers,
    getAdminUserById,
    toggleUserBlock, // 🔥 Changed from toggleUserRole
} from "../controllers/dashboardController.js";

import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* ------------------------------------------------------------------ */
/*  Existing — user dashboard stats (admin-only in your current setup) */
/* ------------------------------------------------------------------ */

router.get("/stats", verifyToken, isAdmin, getDashboardStats);

/* ------------------------------------------------------------------ */
/*  Admin endpoints                                                    */
/* ------------------------------------------------------------------ */

/* Top-level admin stats — total users, lands by type, tickets, etc. */
router.get("/admin/stats", verifyToken, isAdmin, getAdminStats);

/* Latest signups */
router.get(
    "/admin/recent-users",
    verifyToken,
    isAdmin,
    getAdminRecentUsers
);

/* Latest property listings */
router.get(
    "/admin/recent-lands",
    verifyToken,
    isAdmin,
    getAdminRecentLands
);

/* Time-series data for dashboard charts */
router.get("/admin/charts", verifyToken, isAdmin, getAdminCharts);

/* Paginated + searchable user list */
router.get("/admin/users", verifyToken, isAdmin, getAdminUsers);

/* Single user detail */
router.get(
    "/admin/users/:id",
    verifyToken,
    isAdmin,
    getAdminUserById
);

/* Toggle a user's block status (Block/Unblock) */
router.put(
    "/admin/users/:id/block", // 🔥 Updated route
    verifyToken,
    isAdmin,
    toggleUserBlock // 🔥 Updated controller
);

export default router;