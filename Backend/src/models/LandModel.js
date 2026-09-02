import mongoose from "mongoose";

const LandSchema = new mongoose.Schema(
    {
        surveyNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        area: {
            type: Number,
            required: true,
            min: 0,
        },

        village: {
            type: String,
            required: true,
            trim: true,
        },

        district: {
            type: String,
            required: true,
            trim: true,
        },

        state: {
            type: String,
            required: true,
            trim: true,
        },

        location: {
            latitude: {
                type: Number,
                required: true,
                min: -90,
                max: 90,
            },
            longitude: {
                type: Number,
                required: true,
                min: -180,
                max: 180,
            },
        },

        landType: {
            type: String,
            enum: [
                "Agricultural",
                "Residential",
                "Commercial",
                "Industrial",
            ],
            default: "Residential",
        },

        isForSale: {
            type: Boolean,
            default: false,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        image: [
            {
                url: {
                    type: String,
                    required: true,
                },
            },
        ],

        video: [
            {
                url: {
                    type: String,
                    required: true,
                },
            },
        ],

        documents: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Document",
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Land = mongoose.model("Land", LandSchema);

export default Land;