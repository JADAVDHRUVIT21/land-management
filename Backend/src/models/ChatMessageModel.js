import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
    {

        land: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Land",
            required: false,
            default: null,
        },


        isDirect: {
            type: Boolean,
            default: false,
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

        read: {
            type: Boolean,
            default: false,
        },

        readAt: {
            type: Date,
            default: null,
        },

        deletedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
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