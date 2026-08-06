import User from "../models/UserModels.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


// Register User
export const register = async (req, res) => {
    try {
        const { fullName, email, password, phone, role } = req.body;


        if (!fullName || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields.",
            });
        }


        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already registered.",
            });
        }


        const hashedPassword = await bcrypt.hash(password, 10);


        const user = await User.create({
            fullName,
            email,
            password: hashedPassword,
            phone,
            role: role || "user",
        });


        const userData = user.toObject();
        delete userData.password;

        res.status(201).json({
            success: true,
            message: "User registered successfully.",
            user: userData,
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};


// Login User
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and Password are required.",
            });
        }


        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid Email or Password.",
            });
        }


        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.status(200).json({
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
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};


// Get Logged In User Profile
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        res.status(200).json({
            success: true,
            user,
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};
// Get All Users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("password");

        res.status(200).json({
            success: true,
            count: users.length,
            users,
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};


// Delete User
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "User deleted successfully.",
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};