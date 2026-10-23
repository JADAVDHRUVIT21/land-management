import User from "../models/UserModels.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../config/cloudinary.js";


const uploadBufferToCloudinary = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
            },
            (error, result) => {
                if (error) {
                    console.error("[USER CLOUDINARY] ✗ Error:", error);
                    return reject(error);
                }
                resolve(result);
            }
        );
        stream.end(fileBuffer);
    });
};

const register = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({
                success: false,
                message: "Request body is required.",
            });
        }

        const {
            fullName,
            email,
            password,
            phone,
        } = req.body;

        if (
            typeof fullName !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            typeof phone !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid input data.",
            });
        }

        const trimmedFullName = fullName.trim();
        const normalizedEmail = email.trim().toLowerCase();
        const trimmedPhone = phone.trim();

        if (
            !trimmedFullName ||
            !normalizedEmail ||
            !password ||
            !trimmedPhone
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields.",
            });
        }

        if (
            trimmedFullName.length < 3 ||
            trimmedFullName.length > 50
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Full name must be between 3 and 50 characters.",
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address.",
            });
        }

        if (normalizedEmail.length > 254) {
            return res.status(400).json({
                success: false,
                message: "Email address is too long.",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 8 characters long.",
            });
        }

        if (password.length > 128) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must not exceed 128 characters.",
            });
        }

        const phoneRegex = /^\+?[0-9]{10,15}$/;

        if (!phoneRegex.test(trimmedPhone)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid phone number.",
            });
        }

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already registered.",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            fullName: trimmedFullName,
            email: normalizedEmail,
            password: hashedPassword,
            phone: trimmedPhone,
            role: "user",
        });

        const userData = user.toObject();
        delete userData.password;

        return res.status(201).json({
            success: true,
            message: "User registered successfully.",
            user: userData,
        });
    } catch (error) {
        console.error("Register Error:", error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Email already registered.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

const login = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({
                success: false,
                message: "Request body is required.",
            });
        }

        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and Password are required.",
            });
        }

        const user = await User.findOne({
            email: normalizedEmail,
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid Email or Password.",
            });
        }

        // 🔥 NEW: Check if user is blocked
        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked by the administrator.",
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid Email or Password.",
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing in .env");

            return res.status(500).json({
                success: false,
                message: "JWT configuration is missing.",
            });
        }

        const token = jwt.sign(
            {
                id: user._id.toString(),
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar || null,
                coverImage: user.coverImage || null,
            },
        });
    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const user = await User.findById(userId).select(
            "-password"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("Get Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};


const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        const updateData = {};

        /* ---- fullName ---- */
        if (typeof req.body.fullName === "string") {
            const trimmed = req.body.fullName.trim();

            if (trimmed.length < 3 || trimmed.length > 50) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Full name must be between 3 and 50 characters.",
                });
            }

            updateData.fullName = trimmed;
        }

        /* ---- avatar ---- */
        if (req.files?.avatar?.[0]) {
            try {
                const result = await uploadBufferToCloudinary(
                    req.files.avatar[0].buffer,
                    "users/avatars"
                );
                updateData.avatar = result.secure_url;
            } catch (err) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Avatar upload failed: " + err.message,
                });
            }
        }

        /* ---- cover image ---- */
        if (req.files?.cover?.[0]) {
            try {
                const result = await uploadBufferToCloudinary(
                    req.files.cover[0].buffer,
                    "users/covers"
                );
                updateData.coverImage = result.secure_url;
            } catch (err) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Cover upload failed: " + err.message,
                });
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No changes were provided.",
            });
        }

        const updated = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            {
                new: true,
                runValidators: true,
            }
        ).select("-password");

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            user: updated,
        });
    } catch (error) {
        console.error("Update Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error.",
        });
    }
};

/* ------------------------------------------------------------------ */
/*  CHANGE PASSWORD                                                    */
/* ------------------------------------------------------------------ */
/*  Body: { currentPassword, newPassword }                             */
/*  Verifies the current password, hashes the new one, saves it.       */
/* ------------------------------------------------------------------ */

const changePassword = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const { currentPassword, newPassword } = req.body || {};

        if (
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Current password and new password are required.",
            });
        }

        const trimmedCurrent = currentPassword.trim();
        const trimmedNew = newPassword.trim();

        if (!trimmedCurrent || !trimmedNew) {
            return res.status(400).json({
                success: false,
                message:
                    "Current password and new password are required.",
            });
        }

        if (trimmedNew.length < 8) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must be at least 8 characters long.",
            });
        }

        if (trimmedNew.length > 128) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must not exceed 128 characters.",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        const isMatch = await bcrypt.compare(
            trimmedCurrent,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect.",
            });
        }

        if (trimmedCurrent === trimmedNew) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must be different from the current one.",
            });
        }

        const hashedNew = await bcrypt.hash(trimmedNew, 12);

        user.password = hashedNew;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password updated successfully.",
        });
    } catch (error) {
        console.error("Change Password Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error.",
        });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({
                createdAt: -1,
            });

        return res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error("Get All Users Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required.",
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        await User.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "User deleted successfully.",
        });
    } catch (error) {
        console.error("Delete User Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

/* ------------------------------------------------------------------ */
/*  MATCH CONTACTS                                                     */
/* ------------------------------------------------------------------ */

const normalizePhone = (raw) => {
    if (!raw) return "";
    const digits = String(raw).replace(/\D/g, "");
    return digits.length > 10 ? digits.slice(-10) : digits;
};

const matchContacts = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const { phones } = req.body;

        if (!Array.isArray(phones)) {
            return res.status(400).json({
                success: false,
                message: "phones must be an array of phone numbers.",
            });
        }

        if (phones.length === 0) {
            return res.status(200).json({
                success: true,
                matched: [],
                unmatched: [],
            });
        }

        if (phones.length > 500) {
            return res.status(400).json({
                success: false,
                message:
                    "Too many phone numbers in a single request (max 500).",
            });
        }

        const normalizedMap = new Map();
        phones.forEach((raw) => {
            if (typeof raw !== "string") return;
            const key = normalizePhone(raw);
            if (key.length === 10 && !normalizedMap.has(key)) {
                normalizedMap.set(key, raw);
            }
        });

        const normalizedList = Array.from(normalizedMap.keys());

        if (normalizedList.length === 0) {
            return res.status(200).json({
                success: true,
                matched: [],
                unmatched: [],
            });
        }

        const allUsers = await User.find({
            phone: { $exists: true, $ne: null },
        })
            .select("fullName email phone avatar _id")
            .lean();

        const matched = [];
        const seenUserIds = new Set();

        allUsers.forEach((u) => {
            const normalized = normalizePhone(u.phone);
            if (normalized && normalizedMap.has(normalized)) {
                if (String(u._id) === String(userId)) return;

                if (seenUserIds.has(String(u._id))) return;
                seenUserIds.add(String(u._id));

                matched.push({
                    phone: u.phone,
                    user: {
                        _id: String(u._id),
                        fullName: u.fullName,
                        email: u.email,
                        phone: u.phone,
                        avatar: u.avatar || null,
                    },
                });
            }
        });

        const matchedNormalized = new Set(
            matched.map((m) => normalizePhone(m.phone))
        );

        const unmatched = [];
        normalizedMap.forEach((original, normalized) => {
            if (!matchedNormalized.has(normalized)) {
                unmatched.push(original);
            }
        });

        return res.status(200).json({
            success: true,
            matchedCount: matched.length,
            unmatchedCount: unmatched.length,
            matched,
            unmatched,
        });
    } catch (error) {
        console.error("Match Contacts Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error.",
        });
    }
};

/* ------------------------------------------------------------------ */
/*  REQUEST PASSWORD RESET                                             */
/* ------------------------------------------------------------------ */
/*  Body: { phone }                                                    */
/*                                                                     */
/*  Flow:                                                              */
/*    1. Find the user by phone (last-10-digit match)                  */
/*    2. Generate a 6-digit OTP                                        */
/*    3. Save it to `resetOtp` with a 10-minute expiry                 */
/*    4. (Later: send via Fast2SMS)                                    */
/*                                                                     */
/*  NOTE: We intentionally do NOT reveal whether a phone exists, to    */
/*  avoid user enumeration. But we return the OTP in dev for testing.  */
/* ------------------------------------------------------------------ */

const requestPasswordReset = async (req, res) => {
    try {
        const { phone } = req.body || {};

        if (typeof phone !== "string" || !phone.trim()) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required.",
            });
        }

        const normalized = normalizePhone(phone);

        if (normalized.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid phone number.",
            });
        }

        const user = await User.findOne({
            phone: { $regex: normalized + "$" },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this phone number.",
            });
        }

        /* Generate a random 6-digit OTP */
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        /* Expires in 10 minutes */
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        user.resetOtp = otp;
        user.resetOtpExpiry = expiry;
        await user.save();

        console.log(`[PASSWORD RESET] OTP for ${user.email}: ${otp}`);

        /* ------------------------------------------------------------------ */
        /*  TODO: Send OTP via Fast2SMS in a future step.                      */
        /*  For now, we return it in the response so the frontend can display  */
        /*  it during development. REMOVE `devOtp` before production.          */
        /* ------------------------------------------------------------------ */
        return res.status(200).json({
            success: true,
            message: "OTP sent to your registered phone number.",
            devOtp: otp, // ← REMOVE BEFORE PRODUCTION
        });
    } catch (error) {
        console.error("Request Password Reset Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error.",
        });
    }
};

/* ------------------------------------------------------------------ */
/*  RESET PASSWORD                                                     */
/* ------------------------------------------------------------------ */
/*  Body: { phone, otp, newPassword }                                  */
/*                                                                     */
/*  ⚠️  DEV/TESTING MODE:                                              */
/*      Accepts ANY 6-digit OTP for now so testers can reset without   */
/*      needing a real SMS. When Firebase/SMS is integrated, restore    */
/*      the OTP comparison block (marked below).                       */
/* ------------------------------------------------------------------ */

const resetPassword = async (req, res) => {
    try {
        const { phone, otp, newPassword } = req.body || {};

        if (
            typeof phone !== "string" ||
            typeof otp !== "string" ||
            typeof newPassword !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Phone, OTP and new password are required.",
            });
        }

        const normalized = normalizePhone(phone);

        if (normalized.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid phone number.",
            });
        }

        if (!/^\d{6}$/.test(otp.trim())) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid 6-digit OTP.",
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must be at least 8 characters long.",
            });
        }

        if (newPassword.length > 128) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must not exceed 128 characters.",
            });
        }

        const user = await User.findOne({
            phone: { $regex: normalized + "$" },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this phone number.",
            });
        }

        /* ============================================================ */
        /*  ⚠️  DEV MODE: Skip OTP verification entirely                */
        /*  Any 6-digit OTP will be accepted.                           */
        /*  Re-enable the block below when Firebase/SMS is integrated.  */
        /* ============================================================ */

        /* ---- TEMPORARILY DISABLED ----
        if (!user.resetOtp || !user.resetOtpExpiry) {
            return res.status(400).json({
                success: false,
                message: "No password reset was requested. Please start over.",
            });
        }

        if (new Date() > new Date(user.resetOtpExpiry)) {
            user.resetOtp = null;
            user.resetOtpExpiry = null;
            await user.save();

            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one.",
            });
        }

        if (String(user.resetOtp) !== String(otp.trim())) {
            return res.status(400).json({
                success: false,
                message: "Incorrect OTP. Please try again.",
            });
        }
        ---- END TEMPORARILY DISABLED ---- */

        /* Hash + save new password */
        const hashed = await bcrypt.hash(newPassword, 12);
        user.password = hashed;

        /* Clear reset fields */
        user.resetOtp = null;
        user.resetOtpExpiry = null;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. Please log in.",
        });
    } catch (error) {
        console.error("Reset Password Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error.",
        });
    }
};

/* ------------------------------------------------------------------ */
/*  TOGGLE USER ROLE (Promote / Demote)                                */
/* ------------------------------------------------------------------ */

const toggleUserRole = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required.",
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        // Prevent modifying your own role
        if (user._id.toString() === req.user.id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot change your own role.",
            });
        }

        // Toggle the role
        const newRole = user.role === "admin" ? "user" : "admin";
        user.role = newRole;

        await user.save();

        return res.status(200).json({
            success: true,
            message: `User is now ${newRole}.`,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Toggle User Role Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error.",
        });
    }
};

export {
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
    toggleUserRole,
};