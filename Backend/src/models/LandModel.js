import mongoose from "mongoose";

const landSchema = new mongoose.Schema(
    {
        // Optional survey number
        surveyNumber: {
            type: String,
            required: false,
            trim: true,
            default: undefined,
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
            enum: [
                "House",
                "Flat",
                "Land",
                "Hostel",
                "Agricultural",
                "Residential",
                "Commercial",
                "Industrial",
            ],
        },

        listingType: {
            type: String,
            required: true,
            enum: ["For Sale", "For Rent"],
        },

        isForSale: {
            type: Boolean,
            default: false,
        },

        price: {
            type: Number,
            required: true,
        },

        rentPeriod: {
            type: String,
            set: (value) => {
                if (value === "" || value === undefined) {
                    return null;
                }
                return value;
            },
            enum: ["Per Month", "Per Year", "Per Day", "Per Week", null],
            default: null,
        },

        minimumRentDuration: {
            type: String,
            default: "",
            trim: true,
        },

        securityDeposit: {
            type: Number,
            default: null,
        },

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

// Survey number must be unique within the same village and district,
// but only when a non-empty survey number is provided.
landSchema.index(
    {
        surveyNumber: 1,
        village: 1,
        district: 1,
    },
    {
        unique: true,
        name: "unique_survey_per_village_district",
        partialFilterExpression: {
            surveyNumber: {
                $type: "string",
                $gt: "",
            },
        },
    }
);

const Land = mongoose.model("Land", landSchema);

export default Land;