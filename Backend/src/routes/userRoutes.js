import express from "express";

import {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    getAllUsers,
    deleteUser,
    matchContacts,
    requestPasswordReset,
    resetPassword,
} from "../controllers/userController.js";

import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/cloudinaryUpload.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

/*
| Password reset (OTP-based, no auth required)
| Body: { phone }
*/
router.post("/request-password-reset", requestPasswordReset);

/*
| Reset password with OTP
| Body: { phone, otp, newPassword }
*/
router.post("/reset-password", resetPassword);

router.get("/profile", verifyToken, getProfile);

router.put(
    "/profile",
    verifyToken,
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "cover", maxCount: 1 },
    ]),
    updateProfile
);

/*
| Change the logged-in user's password
| Body: { currentPassword, newPassword }
*/
router.put("/change-password", verifyToken, changePassword);

/*
| Match device contacts against registered users
*/
router.post("/match-contacts", verifyToken, matchContacts);

router.get("/", verifyToken, isAdmin, getAllUsers);

router.delete("/:id", verifyToken, isAdmin, deleteUser);

export default router;