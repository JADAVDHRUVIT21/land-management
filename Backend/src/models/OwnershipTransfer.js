import mongoose from "mongoose";

const ownershipTransferSchema = new mongoose.Schema(
    {
        // Land being transferred
        land: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Land",
            required: true,
        },

        // Current owner before transfer
        currentOwner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // New owner after transfer
        newOwner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Person who requested the transfer
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Admin/Officer who approves or rejects
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // Reason for transfer
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

        // Optional rejection reason
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