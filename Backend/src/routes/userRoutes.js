import express from "express";

import {
    register,
    login,
    getProfile,
    getAllUsers,
    deleteUser,
} from "../controllers/UserController.js";

import {
    verifyToken,
    isAdmin,
} from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// Register User
router.post("/register", register);

// Login User
router.post("/login", login);

// Get Logged-in User Profile
router.get(
    "/profile",
    verifyToken,
    getProfile
);

// Get All Users - Admin Only
router.get(
    "/",
    verifyToken,
    isAdmin,
    getAllUsers
);

// Delete User - Admin Only
router.delete(
    "/:id",
    verifyToken,
    isAdmin,
    deleteUser
);

export default router;