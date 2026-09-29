import mongoose from "mongoose";

const brokerRequestSchema = new mongoose.Schema(
    {
        land: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Land",
            required: true,
        },

        broker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        requester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        requesterType: {
            type: String,
            enum: ["seller", "buyer"],
            required: true,
        },

        message: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Accepted",
                "Rejected",
                "Completed",
                "Cancelled",
            ],
            default: "Pending",
        },

        meetingDate: {
            type: Date,
            default: null,
        },

        meetingLocation: {
            type: String,
            trim: true,
            default: "",
        },

        brokerNotes: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

const BrokerRequest = mongoose.model(
    "BrokerRequest",
    brokerRequestSchema
);

export default BrokerRequest;