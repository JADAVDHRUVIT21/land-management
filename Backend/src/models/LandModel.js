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

        status: {
            type: String,
            enum: [
                "Pending",
                "Approved",
                "Rejected",
            ],
            default: "Pending",
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
                // public_id: {
                //     type: String,
                //     required: true,
                // },
            },
        ],

        video: [
            {
                url: {
                    type: String,
                    required: true,
                },
                // public_id: {
                //     type: String,
                //     required: true,
                // },
            },
        ],

        location: {
            latitude: {
                type: Number,
                required: true,
            },
            longitude: {
                type: Number,
                required: true,
            },
        },

        documents: [
            {
                url: {
                    type: String,
                },
                public_id: {
                    type: String,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Land = mongoose.model("Land", LandSchema);

export default Land;