import jwt from "jsonwebtoken";

// VERIFY JWT TOKEN
export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
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
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {
        console.error(
            "JWT Verification Error:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message: "Invalid or Expired Token.",
        });
    }
};

// ADMIN ONLY
export const isAdmin = (req, res, next) => {

    if (
        !req.user ||
        req.user.role !== "admin"
    ) {
        return res.status(403).json({
            success: false,
            message: "Access Denied. Admin Only.",
        });
    }

    next();
};

// USER ONLY
export const isUser = (req, res, next) => {

    if (
        !req.user ||
        req.user.role !== "user"
    ) {
        return res.status(403).json({
            success: false,
            message: "Access Denied. User Only.",
        });
    }

    next();
};

// ADMIN OR USER
export const isAdminOrUser = (req, res, next) => {

    if (
        !req.user ||
        (
            req.user.role !== "admin" &&
            req.user.role !== "user"
        )
    ) {
        return res.status(403).json({
            success: false,
            message: "Access Denied.",
        });
    }

    next();
};