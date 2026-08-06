// import mongoose from "mongoose";

// // const landSchema = new mongoose.Schema(
// //     {
// //         surveyNumber: {
// //             type: String,
// //             required: true,
// //             unique: true,
// //             trim: true,
// //         },

// //         owner: {
// //             type: String,
// //             ref: "User",
// //             required: true,
// //         },

// //         area: {
// //             type: Number,
// //             required: true,
// //             min: 0,
// //         },

// //         village: {
// //             type: String,
// //             required: true,
// //             trim: true,
// //         },

// //         district: {
// //             type: String,
// //             required: true,
// //             trim: true,
// //         },

// //         state: {
// //             type: String,
// //             required: true,
// //             trim: true,
// //         },

// //         landType: {
// //             type: String,
// //             enum: [
// //                 "Agricultural",
// //                 "Residential",
// //                 "Commercial",
// //                 "Industrial"
// //             ],
// //             default: "Residential",
// //         },

// //         status: {
// //             type: String,
// //             enum: [
// //                 "Pending",
// //                 "Approved",
// //                 "Rejected"
// //             ],
// //             default: "Pending",
// //         },

// //         price: {
// //             type: Number,
// //             required: true,
// //             min: 0,
// //         },

// //         image: [
// //             {
// //                 type: String,
// //             }
// //         ],

// //         video: {
// //             type: String,
// //         },

// //         description: {
// //             type: String,
// //             trim: true,
// //             required: true
// //         },

// //         // Land Location (Google Map coordinates)
// //         location: {
// //             latitude: {
// //                 type: Number,
// //                 required: true
// //             },
// //             longitude: {
// //                 type: Number,
// //                 required: true
// //             }
// //         },

// //         documents: [
// //             {
// //                 type: String,
// //                 required: true
// //             }
// //         ]
// //     },
// //     {
// //         timestamps: true,
// //     }
// // );


// const LandSchema = new mongoose.Schema({
//     surveyNumber: {
//         type: String,
//         unique: true,
//         required: true,
//     },
//     owner: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true,
//     },
//     area: String,
//     village: String,
//     district: String,
//     state: String,
//     landType: String,
//     location: String,
//     price: Number,
//     description: String,

//     image: [
//         {
//             url: String,
//             public_id: String,
//         },
//     ],

//     video: [
//         {
//             url: String,
//             public_id: String,
//         },
//     ],
// });
// const Land = mongoose.model("Land", LandSchema);

// export default Land;

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
                public_id: {
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
                public_id: {
                    type: String,
                    required: true,
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