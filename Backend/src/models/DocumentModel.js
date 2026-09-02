import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
    {
        land: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Land",
            required: true,
        },

        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        documentType: {
            type: String,
            enum: [
                "Ownership Proof",
                "Sale Deed",
                "Land Certificate",
                "Identity Proof",
                "Tax Receipt",
                "Other",
            ],
            required: true,
        },

        fileName: {
            type: String,
            required: true,
            trim: true,
        },

        fileUrl: {
            type: String,
            required: true,
        },

        publicId: {
            type: String,
            default: "",
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Approved",
                "Rejected",
            ],
            default: "Pending",
        },

        rejectionReason: {
            type: String,
            default: "",
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const Document = mongoose.model(
    "Document",
    documentSchema
);

export default Document;