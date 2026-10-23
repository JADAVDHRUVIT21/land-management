import mongoose from "mongoose";

const landSchema = new mongoose.Schema(
    {
        surveyNumber: {
            type: String,
            required: true,
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
            // 🔥 FIXED: Added House, Flat, Land, Hostel to the enum
            enum: [
                "House",
                "Flat",
                "Land",
                "Hostel",
                "Agricultural",
                "Residential",
                "Commercial",
                "Industrial"
            ],
        },

        /* ------------------------------------------------------------- */
        /*  LISTING TYPE                                                 */
        /*  - "For Sale"  → selling the land                             */
        /*  - "For Rent"  → renting out the land                         */
        /* ------------------------------------------------------------- */
        listingType: {
            type: String,
            required: true,
            enum: ["For Sale", "For Rent"],
        },

        isForSale: {
            type: Boolean,
            default: false,
        },

        /* ------------------------------------------------------------- */
        /*  PRICE                                                        */
        /*  - For Sale listings: total price                             */
        /*  - For Rent listings: price per rentPeriod                    */
        /* ------------------------------------------------------------- */
        price: {
            type: Number,
            required: true,
        },

        /* ------------------------------------------------------------- */
        /*  RENT-SPECIFIC FIELDS (optional)                              */
        /*  Only meaningful when listingType = "For Rent".               */
        /* ------------------------------------------------------------- */

        /* How the rent price is quoted */
        rentPeriod: {
            type: String,
            enum: ["Per Month", "Per Year", "Per Day", "Per Week", null],
            default: null,
        },

        /* Minimum rental duration (free text, e.g. "6 months") */
        minimumRentDuration: {
            type: String,
            default: "",
            trim: true,
        },

        /* Refundable deposit, if any */
        securityDeposit: {
            type: Number,
            default: null,
        },

        /* Whether the price is negotiable */
        isNegotiable: {
            type: Boolean,
            default: false,
        },

        description: {
            type: String,
            default: "",
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

landSchema.index(
    { surveyNumber: 1, village: 1, district: 1 },
    { unique: true, name: "unique_survey_per_village_district" }
);

const Land = mongoose.model("Land", landSchema);

export default Land;