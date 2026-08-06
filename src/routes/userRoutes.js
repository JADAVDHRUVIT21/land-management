import express from "express";
import {
    register,
    login,
    getProfile,
    getAllUsers,
    deleteUser,
} from "../controllers/userController.js";

import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", getProfile);
router.get("/", getAllUsers);
router.delete("/:id", deleteUser);

export default router;