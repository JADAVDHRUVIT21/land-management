import User from "../models/UserModels.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
            !fullName ||
            !email ||
            !password ||
            !phone
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields.",
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const existingUser =
            await User.findOne({
                email: normalizedEmail,
            });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already registered.",
            });
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const user = await User.create({
            fullName: fullName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            phone: phone.trim(),
            role: "user",
        });

        const userData =
            user.toObject();

        delete userData.password;

        return res.status(201).json({
            success: true,
            message: "User registered successfully.",
            user: userData,
        });
    } catch (error) {
        console.error(
            "Register Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message,
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

        const {
            email,
            password,
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and Password are required.",
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const user =
            await User.findOne({
                email: normalizedEmail,
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        const isMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid Email or Password.",
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error(
                "JWT_SECRET is missing in .env"
            );

            return res.status(500).json({
                success: false,
                message:
                    "JWT configuration is missing.",
            });
        }

        const token =
            jwt.sign(
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
            },
        });
    } catch (error) {
        console.error(
            "Login Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const userId =
            req.user?.id ||
            req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const user =
            await User.findById(
                userId
            ).select("-password");

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
        console.error(
            "Get Profile Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users =
            await User.find()
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
        console.error(
            "Get All Users Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user =
            await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        await User.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message:
                "User deleted successfully.",
        });
    } catch (error) {
        console.error(
            "Delete User Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export { register, login, getProfile, getAllUsers, deleteUser, };