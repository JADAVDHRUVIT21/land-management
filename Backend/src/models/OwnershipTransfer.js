import mongoose from "mongoose";

const ownershipTransferSchema = new mongoose.Schema(
    {
        // Land being transferred
        land: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Land",
            required: true,
        },

        // User A - current owner before transfer
        currentOwner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // User B - new owner after approval
        newOwner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // User B - person who created the purchase request
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // User who approves/rejects the request
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // Buy/transfer reason
        reason: {
            type: String,
            required: true,
            trim: true,
        },

        // Transfer status
        status: {
            type: String,
            enum: [
                "Pending",
                "Approved",
                "Rejected",
            ],
            default: "Pending",
        },

        // Reason if the request is rejected
        rejectionReason: {
            type: String,
            default: "",
            trim: true,
        },

        // Date when transfer was approved
        transferDate: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const OwnershipTransfer = mongoose.model(
    "OwnershipTransfer",
    ownershipTransferSchema
);

export default OwnershipTransfer;