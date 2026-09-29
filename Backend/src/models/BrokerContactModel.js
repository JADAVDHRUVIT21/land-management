import mongoose from "mongoose";

const brokerContactSchema = new mongoose.Schema(
    {
        broker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        contact: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        contactType: {
            type: String,
            enum: ["seller", "buyer"],
            required: true,
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

brokerContactSchema.index(
    {
        broker: 1,
        contact: 1,
    },
    {
        unique: true,
    }
);

const BrokerContact = mongoose.model(
    "BrokerContact",
    brokerContactSchema
);

export default BrokerContact;