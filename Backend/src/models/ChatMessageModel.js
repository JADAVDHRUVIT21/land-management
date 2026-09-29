import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
    {
        land: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Land",
            required: true,
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
        },

        isRedacted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const ChatMessage = mongoose.model(
    "ChatMessage",
    ChatMessageSchema
);

export default ChatMessage;