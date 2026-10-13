import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, "Full Name is required"],
            trim: true,
            minlength: 3,
            maxlength: 50,
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^\S+@\S+\.\S+$/,
                "Please enter a valid email address",
            ],
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 6,
        },

        phone: {
            type: String,
            required: [true, "Phone Number is required"],
            trim: true,
        },

        role: {
            type: String,
            enum: ["admin", "user"],
            default: "user",
        },

        avatar: {
            type: String,
            default: null,
        },

        coverImage: {
            type: String,
            default: null,
        },

        /* ------------------------------------------------------------------ */
        /*  Password reset (OTP-based)                                         */
        /*  These are cleared after a successful password reset.               */
        /* ------------------------------------------------------------------ */
        resetOtp: {
            type: String,
            default: null,
        },

        resetOtpExpiry: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model(
    "User",
    userSchema
);

export default User;