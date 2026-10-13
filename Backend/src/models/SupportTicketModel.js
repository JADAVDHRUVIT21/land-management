import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        category: {
            type: String,
            required: true,
            enum: [
                "General",
                "Technical",
                "Billing",
                "Account",
                "Land Listing",
                "Chat / Messages",
                "Report a Bug",
                "Other",
            ],
            default: "General",
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000,
        },

        status: {
            type: String,
            enum: ["Open", "In Progress", "Resolved", "Closed"],
            default: "Open",
        },

        priority: {
            type: String,
            enum: ["Low", "Normal", "High", "Urgent"],
            default: "Normal",
        },

        /* Optional: admin reply thread */
        replies: [
            {
                from: {
                    type: String,
                    enum: ["User", "Support"],
                    required: true,
                },
                message: {
                    type: String,
                    required: true,
                    trim: true,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    { timestamps: true }
);

supportTicketSchema.index({ user: 1, createdAt: -1 });

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);

export default SupportTicket;