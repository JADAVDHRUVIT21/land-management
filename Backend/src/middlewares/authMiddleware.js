import jwt, { decode } from "jsonwebtoken";

// Verify JWT Token
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

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or Expired Token.",
        });
    }
};

// Admin Only
export const isAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access Denied. Admin Only.",
        });
    }

    next();
};

// Officer Only
export const isOfficer = (req, res, next) => {
    if (req.user.role !== "officer") {
        return res.status(403).json({
            success: false,
            message: "Access Denied. Officer Only.",
        });
    }

    next();
};

// Citizen Only
export const isCitizen = (req, res, next) => {
    if (req.user.role !== "citizen") {
        return res.status(403).json({
            success: false,
            message: "Access Denied. Citizen Only.",
        });
    }

    next();
};

// Admin OR Officer
export const isAdminOrOfficer = (req, res, next) => {
    if (
        req.user.role !== "admin" &&
        req.user.role !== "officer"
    ) {
        return res.status(403).json({
            success: false,
            message: "Access Denied.",
        });
    }

    next();
};