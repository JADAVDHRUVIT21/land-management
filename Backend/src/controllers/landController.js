import Land from "../models/LandModel.js";
import cloudinary from "../config/cloudinary.js";

// Upload File to Cloudinary
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


// Upload Video to Cloudinary
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
    console.log("=================================");

    try {

        const {
            surveyNumber,
            owner,
            area,
            village,
            district,
            state,
            landType,
            location,
            price,
            description,
        } = req.body;

        // Required Fields

        if (
            !surveyNumber ||
            !owner ||
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

        // Check Duplicate Survey Number

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

        // Parse Location

        let myLocation;

        console.log(
            "Location:",
            location,
            "Type:",
            typeof location
        );

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

        // Validate Location

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

        // Convert Coordinates to Number

        myLocation.latitude =
            Number(myLocation.latitude);

        myLocation.longitude =
            Number(myLocation.longitude);

        // Validate Coordinates

        if (
            Number.isNaN(myLocation.latitude) ||
            Number.isNaN(myLocation.longitude)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Latitude and longitude must be valid numbers.",
            });
        }

        // Upload Images        

        console.log("1. Uploading images...");

        let images = [];

        if (
            req.files &&
            req.files.image &&
            req.files.image.length > 0
        ) {

            images = await Promise.all(

                req.files.image.map(
                    async (file) => {

                        console.log(
                            "Uploading image:",
                            file.originalname
                        );

                        const result =
                            await uploadToCloudinary(
                                file.buffer,
                                "lands/images"
                            );

                        console.log(
                            "Image uploaded:",
                            result.secure_url
                        );

                        return {
                            url: result.secure_url,
                        };
                    }
                )
            );
        }

        // Upload Videos

        console.log("2. Uploading videos...");

        let videos = [];

        if (
            req.files &&
            req.files.video &&
            req.files.video.length > 0
        ) {

            videos = await Promise.all(
                req.files.video.map(
                    async (file) => {
                        console.log(
                            "Uploading video:",
                            file.originalname
                        );

                        const result =
                            await uploadVideoToCloudinary(
                                file.buffer,
                                "lands/videos"
                            );

                        console.log(
                            "Video uploaded:",
                            result.secure_url
                        );

                        return {
                            url: result.secure_url,
                        };
                    }
                )
            );
        }

        // Create Land Object

        const landData = {
            surveyNumber,
            owner,
            area,
            village,
            district,
            state,
            landType,
            location: myLocation,
            price,
            description,
            image: images,
            video: videos,
        };

        console.log(
            "3. Creating land:",
            landData
        );

        // Save Land

        const land =
            await Land.create(landData);

        console.log(
            "4. Land saved successfully"
        );

        // Response

        return res.status(201).json({
            success: true,
            message:
                "Land added successfully.",
            land,
        });

    } catch (error) {
        console.error(
            "Create Land Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message,

        });
    }
};

// GET ALL LANDS
const getAllLands = async (req, res) => {
    try {

        const {
            search,
            village,
            district,
            state,
            landType,
            status,
            minPrice,
            maxPrice,
            page = 1,
            limit = 10,
        } = req.query;

        // Build Filter

        const filter = {};

        // Search by Survey Number

        if (search) {

            filter.surveyNumber = {
                $regex: search,
                $options: "i",
            };
        }

        // Village

        if (village) {
            filter.village = {
                $regex: village,
                $options: "i",
            };
        }

        // District

        if (district) {
            filter.district = {
                $regex: district,
                $options: "i",
            };
        }

        // State

        if (state) {
            filter.state = {
                $regex: state,
                $options: "i",
            };
        }

        // Land Type

        if (landType) {
            filter.landType = landType;
        }

        // Status
        if (status) {
            filter.status = status;
        }

        // Price Filter

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) {
                const minimum =
                    Number(minPrice);

                if (Number.isNaN(minimum)) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "minPrice must be a valid number.",
                    });
                }
                filter.price.$gte =
                    minimum;
            }

            if (maxPrice) {
                const maximum =
                    Number(maxPrice);

                if (Number.isNaN(maximum)) {
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

        // Pagination

        const pageNumber =
            Math.max(Number(page) || 1, 1);

        const limitNumber =
            Math.min(
                Math.max(Number(limit) || 10, 1),
                100
            );

        const skip =
            (pageNumber - 1) *
            limitNumber;

        // Get Total Count

        const total =
            await Land.countDocuments(filter);

        // Get Lands

        const lands =
            await Land.find(filter)

                .populate(
                    "owner",
                    "fullName email phone role"
                )
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limitNumber);

        // Response

        return res.status(200).json({
            success: true,
            count: lands.length,
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages:
                Math.ceil(
                    total / limitNumber
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
            message: error.message,
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
            message: error.message,
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

        // Prepare Update Data

        const updateData = {
            ...req.body,
        };

        // Parse Location

        if (updateData.location) {

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
                            updateData.location
                                .latitude
                        );
                }

                if (
                    updateData.location.longitude !==
                    undefined
                ) {

                    updateData.location.longitude =
                        Number(
                            updateData.location
                                .longitude
                        );
                }

            } catch (error) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid location format.",
                });
            }
        }

        // Update

        const updatedLand =
            await Land.findByIdAndUpdate(
                req.params.id,
                updateData,
                {
                    new: true,
                    runValidators: true,
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
            land: updatedLand,
        });

    } catch (error) {

        console.error(
            "Update Land Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message,
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
            message: error.message,
        });
    }
};

export {createLand, getAllLands, getLandById, updateLand, deleteLand };
