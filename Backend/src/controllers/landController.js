import Land from "../models/LandModel.js";
import cloudinary from "../config/cloudinary.js";


// UPLOAD FILE TO CLOUDINARY

const uploadToCloudinary = (
    fileBuffer,
    folder = "uploads"
) => {

    return new Promise((resolve, reject) => {

        const uploadStream =
            cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: "auto",
                },

                (error, result) => {

                    if (error) {

                        console.error(
                            "CLOUDINARY ERROR:",
                            error
                        );

                        return reject(error);
                    }

                    console.log(
                        "CLOUDINARY SUCCESS:",
                        result.secure_url
                    );

                    resolve(result);
                }
            );

        uploadStream.end(fileBuffer);
    });
};


// UPLOAD VIDEO TO CLOUDINARY

const uploadVideoToCloudinary = (
    fileBuffer,
    folder = "videos"
) => {

    return new Promise((resolve, reject) => {

        const uploadStream =
            cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: "video",
                    chunk_size: 6000000,
                },

                (error, result) => {

                    if (error) {

                        console.error(
                            "CLOUDINARY VIDEO ERROR:",
                            error
                        );

                        return reject(error);
                    }

                    console.log(
                        "VIDEO UPLOAD SUCCESS:",
                        result.secure_url
                    );

                    resolve(result);
                }
            );

        uploadStream.end(fileBuffer);
    });
};


// CREATE LAND
const createLand = async (req, res) => {

    console.log("=================================");
    console.log("CREATE LAND START");
    console.log("Request Body:", req.body);
    console.log("Files:", req.files);
    console.log("Logged-in User:", req.user);
    console.log("=================================");

    try {

        const {
            surveyNumber,
            area,
            village,
            district,
            state,
            landType,
            location,
            price,
            description,
        } = req.body;


        // CHECK LOGIN

        if (
            !req.user ||
            !req.user.id
        ) {

            return res.status(401).json({
                success: false,
                message:
                    "Authentication required.",
            });
        }


        // OWNER = LOGGED-IN USER

        const owner = req.user.id;


        // VALIDATE REQUIRED FIELDS

        if (
            !surveyNumber ||
            !area ||
            !village ||
            !district ||
            !state ||
            !landType ||
            !location ||
            price === undefined ||
            price === null ||
            price === ""
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please fill all required fields.",
            });
        }


        // CHECK DUPLICATE SURVEY NUMBER

        const existingLand =
            await Land.findOne({
                surveyNumber,
            });


        if (existingLand) {

            return res.status(400).json({
                success: false,
                message:
                    "Survey Number already exists.",
            });
        }


        // PARSE LOCATION

        let myLocation;

        try {

            myLocation =
                typeof location === "string"
                    ? JSON.parse(location)
                    : location;

        } catch (error) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid location format. Please provide valid latitude and longitude.",
            });
        }


        // VALIDATE LOCATION

        if (
            !myLocation ||
            myLocation.latitude === undefined ||
            myLocation.longitude === undefined
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Latitude and longitude are required.",
            });
        }


        // CONVERT COORDINATES TO NUMBER

        myLocation.latitude =
            Number(myLocation.latitude);

        myLocation.longitude =
            Number(myLocation.longitude);


        // VALIDATE COORDINATES

        if (
            Number.isNaN(
                myLocation.latitude
            ) ||
            Number.isNaN(
                myLocation.longitude
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Latitude and longitude must be valid numbers.",
            });
        }


        // UPLOAD IMAGES

        console.log(
            "1. Uploading images..."
        );

        let images = [];


        if (
            req.files &&
            req.files.image &&
            req.files.image.length > 0
        ) {

            images = await Promise.all(

                req.files.image.map(
                    async (file) => {

                        const result =
                            await uploadToCloudinary(
                                file.buffer,
                                "lands/images"
                            );

                        return {
                            url:
                                result.secure_url,
                        };
                    }
                )
            );
        }


        // UPLOAD VIDEOS

        console.log(
            "2. Uploading videos..."
        );

        let videos = [];


        if (
            req.files &&
            req.files.video &&
            req.files.video.length > 0
        ) {

            videos = await Promise.all(

                req.files.video.map(
                    async (file) => {

                        const result =
                            await uploadVideoToCloudinary(
                                file.buffer,
                                "lands/videos"
                            );

                        return {
                            url:
                                result.secure_url,
                        };
                    }
                )
            );
        }


        // CREATE LAND DATA

        const landData = {

            surveyNumber,

            owner,

            area,

            village,

            district,

            state,

            landType,

            location:
                myLocation,

            price,

            description,

            image:
                images,

            video:
                videos,

            // New land is always a draft.

            isForSale: false,
        };


        // SAVE LAND

        const land =
            await Land.create(
                landData
            );


        console.log(
            "Land saved successfully."
        );


        // RESPONSE

        return res.status(201).json({

            success: true,

            message:
                "Land saved as draft successfully.",

            land,
        });

    } catch (error) {

        console.error(
            "Create Land Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message,
        });
    }
};


// GET ALL LANDS FOR BUYING


const getAllLands = async (req, res) => {

    try {

        const {
            search,
            village,
            district,
            state,
            landType,
            minPrice,
            maxPrice,
            page = 1,
            limit = 10,
        } = req.query;


        // ONLY LANDS AVAILABLE FOR SALE

        const filter = {

            isForSale: true,
        };


        // EXCLUDE CURRENT USER'S OWN LAND

        if (
            req.user &&
            req.user.id
        ) {

            filter.owner = {
                $ne:
                    req.user.id,
            };
        }


        // SEARCH

        if (search) {

            filter.surveyNumber = {

                $regex:
                    search,

                $options:
                    "i",
            };
        }


        // VILLAGE

        if (village) {

            filter.village = {

                $regex:
                    village,

                $options:
                    "i",
            };
        }


        // DISTRICT

        if (district) {

            filter.district = {

                $regex:
                    district,

                $options:
                    "i",
            };
        }


        // STATE

        if (state) {

            filter.state = {

                $regex:
                    state,

                $options:
                    "i",
            };
        }


        // LAND TYPE

        if (landType) {

            filter.landType =
                landType;
        }


        // PRICE FILTER

        if (
            minPrice !== undefined ||
            maxPrice !== undefined
        ) {

            filter.price = {};


            if (
                minPrice !== undefined &&
                minPrice !== ""
            ) {

                const minimum =
                    Number(minPrice);


                if (
                    Number.isNaN(
                        minimum
                    )
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "minPrice must be a valid number.",
                    });
                }


                filter.price.$gte =
                    minimum;
            }


            if (
                maxPrice !== undefined &&
                maxPrice !== ""
            ) {

                const maximum =
                    Number(maxPrice);


                if (
                    Number.isNaN(
                        maximum
                    )
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "maxPrice must be a valid number.",
                    });
                }


                filter.price.$lte =
                    maximum;
            }
        }


        // PAGINATION

        const pageNumber =
            Math.max(
                Number(page) || 1,
                1
            );


        const limitNumber =
            Math.min(
                Math.max(
                    Number(limit) || 10,
                    1
                ),
                100
            );


        const skip =
            (pageNumber - 1) *
            limitNumber;


        // TOTAL

        const total =
            await Land.countDocuments(
                filter
            );


        // GET LANDS

        const lands =
            await Land.find(
                filter
            )

                .populate(
                    "owner",
                    "fullName email phone role"
                )

                .sort({
                    createdAt:
                        -1,
                })

                .skip(
                    skip
                )

                .limit(
                    limitNumber
                );


        // RESPONSE

        return res.status(200).json({

            success: true,

            count:
                lands.length,

            total,

            page:
                pageNumber,

            limit:
                limitNumber,

            totalPages:
                Math.ceil(
                    total /
                    limitNumber
                ),

            lands,
        });

    } catch (error) {

        console.error(
            "Get All Lands Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message,
        });
    }
};


// GET MY LANDS
const getMyLands = async (req, res) => {

    try {

        if (
            !req.user ||
            !req.user.id
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication required.",
            });
        }


        const lands =
            await Land.find({

                owner:
                    req.user.id,

            })

                .populate(
                    "owner",
                    "fullName email phone role"
                )

                .sort({

                    createdAt:
                        -1,
                });


        return res.status(200).json({

            success: true,

            count:
                lands.length,

            lands,
        });

    } catch (error) {

        console.error(
            "Get My Lands Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message,
        });
    }
};


// GET LAND BY ID
const getLandById = async (req, res) => {

    try {

        const land =
            await Land.findById(
                req.params.id
            )

                .populate(
                    "owner",
                    "fullName email phone role"
                );


        if (!land) {

            return res.status(404).json({

                success: false,

                message:
                    "Land not found.",
            });
        }


        // CHECK OWNER

        const isOwner =
            req.user &&
            req.user.id &&
            land.owner &&
            land.owner._id
                .toString() ===
            req.user.id
                .toString();


        // CHECK SALE STATUS

        const isAvailableForBuying =
            land.isForSale === true;


        // SECURITY

        if (
            !isOwner &&
            !isAvailableForBuying
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "This land is not available for viewing.",
            });
        }


        return res.status(200).json({

            success: true,

            land,
        });

    } catch (error) {

        console.error(
            "Get Land By ID Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message,
        });
    }
};


// UPDATE LAND

const updateLand = async (req, res) => {

    try {

        const land =
            await Land.findById(
                req.params.id
            );


        if (!land) {

            return res.status(404).json({

                success: false,

                message:
                    "Land not found.",
            });
        }


        // CHECK LOGIN

        if (
            !req.user ||
            !req.user.id
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication required.",
            });
        }


        // ONLY OWNER CAN UPDATE

        if (
            land.owner
                .toString() !==
            req.user.id
                .toString()
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not allowed to update this land.",
            });
        }


        // PREPARE UPDATE

        const updateData = {
            ...req.body,
        };


        // NEVER ALLOW OWNER CHANGE

        delete updateData.owner;


        // isForSale HAS ITS OWN ENDPOINT

        delete updateData.isForSale;


        // PARSE LOCATION

        if (
            updateData.location
        ) {

            try {

                if (
                    typeof updateData.location ===
                    "string"
                ) {

                    updateData.location =
                        JSON.parse(
                            updateData.location
                        );
                }


                if (
                    updateData.location.latitude !==
                    undefined
                ) {

                    updateData.location.latitude =
                        Number(
                            updateData
                                .location
                                .latitude
                        );
                }


                if (
                    updateData.location.longitude !==
                    undefined
                ) {

                    updateData.location.longitude =
                        Number(
                            updateData
                                .location
                                .longitude
                        );
                }


                if (
                    Number.isNaN(
                        updateData
                            .location
                            .latitude
                    ) ||
                    Number.isNaN(
                        updateData
                            .location
                            .longitude
                    )
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Latitude and longitude must be valid numbers.",
                    });
                }

            } catch (error) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid location format.",
                });
            }
        }


        // UPDATE

        const updatedLand =
            await Land.findByIdAndUpdate(

                req.params.id,

                updateData,

                {
                    new:
                        true,

                    runValidators:
                        true,
                }
            )

                .populate(
                    "owner",
                    "fullName email phone role"
                );


        return res.status(200).json({

            success: true,

            message:
                "Land updated successfully.",

            land:
                updatedLand,
        });

    } catch (error) {

        console.error(
            "Update Land Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message,
        });
    }
};


// DELETE LAND
const deleteLand = async (req, res) => {

    try {

        const land =
            await Land.findById(
                req.params.id
            );


        if (!land) {

            return res.status(404).json({

                success: false,

                message:
                    "Land not found.",
            });
        }


        // CHECK LOGIN

        if (
            !req.user ||
            !req.user.id
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication required.",
            });
        }


        // ONLY OWNER CAN DELETE

        if (
            land.owner
                .toString() !==
            req.user.id
                .toString()
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not allowed to delete this land.",
            });
        }


        // DELETE

        await Land.findByIdAndDelete(
            req.params.id
        );


        return res.status(200).json({

            success: true,

            message:
                "Land deleted successfully.",
        });

    } catch (error) {

        console.error(
            "Delete Land Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message,
        });
    }
};


// TOGGLE LAND FOR SALE
const toggleLandForSale = async (req, res) => {

    try {

        const land =
            await Land.findById(
                req.params.id
            );


        if (!land) {

            return res.status(404).json({

                success: false,

                message:
                    "Land not found.",
            });
        }


        // CHECK LOGIN

        if (
            !req.user ||
            !req.user.id
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication required.",
            });
        }


        // ONLY OWNER CAN CHANGE

        if (
            land.owner
                .toString() !==
            req.user.id
                .toString()
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not allowed to change this land.",
            });
        }


        // GET isForSale

        let isForSale =
            req.body.isForSale;


        // HANDLE FORMDATA STRING

        if (
            typeof isForSale ===
            "string"
        ) {

            if (
                isForSale ===
                "true"
            ) {

                isForSale =
                    true;

            } else if (
                isForSale ===
                "false"
            ) {

                isForSale =
                    false;

            } else {

                return res.status(400).json({

                    success: false,

                    message:
                        "isForSale must be true or false.",
                });
            }
        }


        // VALIDATE BOOLEAN

        if (
            typeof isForSale !==
            "boolean"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "isForSale must be true or false.",
            });
        }


        // UPDATE

        land.isForSale =
            isForSale;


        await land.save();


        // POPULATE OWNER

        await land.populate(
            "owner",
            "fullName email phone role"
        );


        // RESPONSE

        return res.status(200).json({

            success: true,

            message:

                isForSale

                    ? "Land is now available for sale."

                    : "Land removed from sale and saved as draft.",

            land,
        });

    } catch (error) {

        console.error(
            "Toggle Land For Sale Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message,
        });
    }
};


// EXPORT

export {
    createLand,
    getAllLands,
    getMyLands,
    getLandById,
    updateLand,
    deleteLand,
    toggleLandForSale,
};