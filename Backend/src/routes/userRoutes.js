import express from "express";

import { register, login, getProfile, getAllUsers, deleteUser} from "../controllers/UserController.js";
import {verifyToken, isAdmin,} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
    "/register",
    register
);

router.post(
    "/login",
    login
);

router.get(
    "/profile",
    verifyToken,
    getProfile
);

router.get(
    "/",
    verifyToken,
    isAdmin,
    getAllUsers
);

router.delete(
    "/:id",
    verifyToken,
    isAdmin,
    deleteUser
);

export default router;