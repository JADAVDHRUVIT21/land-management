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
            // select: false, 
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
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;