import jwt from "jsonwebtoken";
import User from "../models/UserModels.js"; // 🔥 Import User model

export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access Denied. No Token Provided.",
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access Denied. No Token Provided.",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ─── Normalize: ensure req.user.id always exists ───
        const normalizedId =
            decoded.id ||
            decoded._id ||
            decoded.userId ||
            decoded.user?._id ||
            null;

        if (!normalizedId) {
            return res.status(401).json({
                success: false,
                message: "Invalid token payload.",
            });
        }

        // 🔥 NEW: Check if user is blocked in the database
        const dbUser = await User.findById(normalizedId).select("isBlocked role");

        if (!dbUser) {
            return res.status(401).json({
                success: false,
                message: "User account no longer exists.",
            });
        }

        if (dbUser.isBlocked) {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked. Please contact support.",
            });
        }

        req.user = {
            ...decoded,
            id: normalizedId,
            _id: normalizedId,
            role: dbUser.role, // Ensure role is fresh from DB
        };

        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or Expired Token.",
        });
    }
};

export const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access Denied. Admin Only.",
        });
    }

    next();
};

export const isUser = (req, res, next) => {
    if (!req.user || req.user.role !== "user") {
        return res.status(403).json({
            success: false,
            message: "Access Denied. User Only.",
        });
    }

    next();
};

export const isAdminOrUser = (req, res, next) => {
    if (
        !req.user ||
        (req.user.role !== "admin" && req.user.role !== "user")
    ) {
        return res.status(403).json({
            success: false,
            message: "Access Denied.",
        });
    }

    next();
};