import mongoose from "mongoose";

const landSchema = new mongoose.Schema(
    {
        surveyNumber: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        area: {
            type: Number,
            required: true,
        },

        areaUnit: {
            type: String,
            default: "sqft",
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
            required: true,
            enum: ["Agricultural", "Residential", "Commercial", "Industrial"],
        },

        listingType: {
            type: String,
            required: true,
            enum: ["For Sale", "Wanted to Buy"],
        },

        isForSale: {
            type: Boolean,
            default: false,
        },

        price: {
            type: Number,
            required: true,
        },

        description: {
            type: String,
            default: "",
            trim: true,
        },

        /* ============================================================= */
        /*  IMAGES — MUST be an array of objects with a `url` field       */
        /*  ❌ WRONG:  image: [String]                                     */
        /*  ✅ RIGHT:  image: [{ url: String }]                            */
        /* ============================================================= */
        image: [
            {
                url: {
                    type: String,
                    required: true,
                },
            },
        ],

        /* ============================================================= */
        /*  VIDEOS — same structure                                       */
        /* ============================================================= */
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
                url: {
                    type: String,
                },
                name: {
                    type: String,
                },
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
    },
    {
        timestamps: true,
    }
);

const Land = mongoose.model("Land", landSchema);

export default Land;