import mongoose from "mongoose";
import Land from "../models/LandModel.js";
import cloudinary from "../config/cloudinary.js";

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
                            "Cloudinary Upload Error:",
                            error
                        );
                        return reject(error);
                    }

                    resolve(result);
                }
            );

        uploadStream.end(fileBuffer);
    });
};

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
                            "Cloudinary Video Error:",
                            error
                        );
                        return reject(error);
                    }

                    resolve(result);
                }
            );

        uploadStream.end(fileBuffer);
    });
};

const createLand = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

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

        if (
            !surveyNumber ||
            area === undefined ||
            area === "" ||
            !village ||
            !district ||
            !state ||
            !landType ||
            !location ||
            price === undefined ||
            price === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields.",
            });
        }

        const parsedArea = Number(area);
        const parsedPrice = Number(price);

        if (
            Number.isNaN(parsedArea) ||
            parsedArea <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Area must be a valid positive number.",
            });
        }

        if (
            Number.isNaN(parsedPrice) ||
            parsedPrice < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Price must be a valid number.",
            });
        }

        const existingLand = await Land.findOne({
            surveyNumber: surveyNumber.trim(),
        });

        if (existingLand) {
            return res.status(400).json({
                success: false,
                message: "Survey Number already exists.",
            });
        }

        let parsedLocation;

        try {
            parsedLocation =
                typeof location === "string"
                    ? JSON.parse(location)
                    : location;
        } catch (error) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid location format.",
            });
        }

        if (
            !parsedLocation ||
            parsedLocation.latitude === undefined ||
            parsedLocation.longitude === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Latitude and longitude are required.",
            });
        }

        const latitude = Number(
            parsedLocation.latitude
        );

        const longitude = Number(
            parsedLocation.longitude
        );

        if (
            Number.isNaN(latitude) ||
            Number.isNaN(longitude)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Latitude and longitude must be valid numbers.",
            });
        }

        if (
            latitude < -90 ||
            latitude > 90
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Latitude must be between -90 and 90.",
            });
        }

        if (
            longitude < -180 ||
            longitude > 180
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Longitude must be between -180 and 180.",
            });
        }

        let images = [];

        if (
            req.files?.image &&
            req.files.image.length > 0
        ) {
            images = await Promise.all(
                req.files.image.map(async (file) => {
                    const result =
                        await uploadToCloudinary(
                            file.buffer,
                            "lands/images"
                        );

                    return {
                        url: result.secure_url,
                    };
                })
            );
        }

        let videos = [];

        if (
            req.files?.video &&
            req.files.video.length > 0
        ) {
            videos = await Promise.all(
                req.files.video.map(async (file) => {
                    const result =
                        await uploadVideoToCloudinary(
                            file.buffer,
                            "lands/videos"
                        );

                    return {
                        url: result.secure_url,
                    };
                })
            );
        }

        const land = await Land.create({
            surveyNumber: surveyNumber.trim(),
            owner: req.user.id,
            area: parsedArea,
            village: village.trim(),
            district: district.trim(),
            state: state.trim(),
            landType,
            isForSale: false,
            price: parsedPrice,
            description: description
                ? description.trim()
                : "",
            image: images,
            video: videos,
            location: {
                latitude,
                longitude,
            },
        });

        const populatedLand =
            await Land.findById(land._id).populate(
                "owner",
                "fullName email phone role"
            );

        return res.status(201).json({
            success: true,
            message:
                "Land created successfully and saved as draft.",
            land: populatedLand,
        });
    } catch (error) {
        console.error(
            "Create Land Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

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

        const filter = {
            isForSale: true,
        };

        if (req.user?.id) {
            filter.owner = {
                $ne: req.user.id,
            };
        }

        if (search?.trim()) {
            filter.surveyNumber = {
                $regex: search.trim(),
                $options: "i",
            };
        }

        if (village?.trim()) {
            filter.village = {
                $regex: village.trim(),
                $options: "i",
            };
        }

        if (district?.trim()) {
            filter.district = {
                $regex: district.trim(),
                $options: "i",
            };
        }

        if (state?.trim()) {
            filter.state = {
                $regex: state.trim(),
                $options: "i",
            };
        }

        if (landType) {
            filter.landType = landType;
        }

        if (
            minPrice !== undefined ||
            maxPrice !== undefined
        ) {
            filter.price = {};

            if (
                minPrice !== undefined &&
                minPrice !== ""
            ) {
                const minimum = Number(minPrice);

                if (
                    Number.isNaN(minimum) ||
                    minimum < 0
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "minPrice must be a valid number.",
                    });
                }

                filter.price.$gte = minimum;
            }

            if (
                maxPrice !== undefined &&
                maxPrice !== ""
            ) {
                const maximum = Number(maxPrice);

                if (
                    Number.isNaN(maximum) ||
                    maximum < 0
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "maxPrice must be a valid number.",
                    });
                }

                filter.price.$lte = maximum;
            }

            if (
                filter.price.$gte !== undefined &&
                filter.price.$lte !== undefined &&
                filter.price.$gte >
                filter.price.$lte
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "minPrice cannot be greater than maxPrice.",
                });
            }
        }

        const pageNumber = Math.max(
            Number(page) || 1,
            1
        );

        const limitNumber = Math.min(
            Math.max(
                Number(limit) || 10,
                1
            ),
            100
        );

        const skip =
            (pageNumber - 1) *
            limitNumber;

        const total =
            await Land.countDocuments(filter);

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

        return res.status(200).json({
            success: true,
            count: lands.length,
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(
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
            message: "Server Error",
        });
    }
};

const getMyLands = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const lands =
            await Land.find({
                owner: req.user.id,
            })
                .populate(
                    "owner",
                    "fullName email phone role"
                )
                .sort({
                    createdAt: -1,
                });

        return res.status(200).json({
            success: true,
            count: lands.length,
            lands,
        });
    } catch (error) {
        console.error(
            "Get My Lands Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

const getLandById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid land ID.",
            });
        }

        const land =
            await Land.findById(id).populate(
                "owner",
                "fullName email phone role"
            );

        if (!land) {
            return res.status(404).json({
                success: false,
                message: "Land not found.",
            });
        }

        const userId =
            req.user?.id || req.user?._id;

        const ownerId =
            land.owner?._id || land.owner;

        const isOwner =
            userId &&
            ownerId &&
            ownerId.toString() ===
            userId.toString();

        if (!isOwner && !land.isForSale) {
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
            message: "Server Error",
        });
    }
};

const updateLand = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid land ID.",
            });
        }

        const land =
            await Land.findById(id);

        if (!land) {
            return res.status(404).json({
                success: false,
                message: "Land not found.",
            });
        }

        if (
            land.owner.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not allowed to update this land.",
            });
        }

        const updateData = {
            ...req.body,
        };

        delete updateData.owner;
        delete updateData.isForSale;

        if (updateData.surveyNumber) {
            const surveyNumber =
                updateData.surveyNumber.trim();

            const duplicate =
                await Land.findOne({
                    surveyNumber,
                    _id: {
                        $ne: id,
                    },
                });

            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Survey Number already exists.",
                });
            }

            updateData.surveyNumber =
                surveyNumber;
        }

        if (updateData.area !== undefined) {
            updateData.area =
                Number(updateData.area);

            if (
                Number.isNaN(updateData.area) ||
                updateData.area <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Area must be a valid positive number.",
                });
            }
        }

        if (updateData.price !== undefined) {
            updateData.price =
                Number(updateData.price);

            if (
                Number.isNaN(updateData.price) ||
                updateData.price < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Price must be a valid number.",
                });
            }
        }

        [
            "village",
            "district",
            "state",
            "description",
        ].forEach((field) => {
            if (updateData[field] !== undefined) {
                updateData[field] =
                    String(
                        updateData[field]
                    ).trim();
            }
        });

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

                const latitude = Number(
                    updateData.location
                        .latitude
                );

                const longitude = Number(
                    updateData.location
                        .longitude
                );

                if (
                    Number.isNaN(latitude) ||
                    Number.isNaN(longitude)
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Latitude and longitude must be valid numbers.",
                    });
                }

                if (
                    latitude < -90 ||
                    latitude > 90
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Latitude must be between -90 and 90.",
                    });
                }

                if (
                    longitude < -180 ||
                    longitude > 180
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Longitude must be between -180 and 180.",
                    });
                }

                updateData.location = {
                    latitude,
                    longitude,
                };
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid location format.",
                });
            }
        }

        const updatedLand =
            await Land.findByIdAndUpdate(
                id,
                updateData,
                {
                    new: true,
                    runValidators: true,
                }
            ).populate(
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
            message: "Server Error",
        });
    }
};

const deleteLand = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid land ID.",
            });
        }

        const land =
            await Land.findById(id);

        if (!land) {
            return res.status(404).json({
                success: false,
                message: "Land not found.",
            });
        }

        if (
            land.owner.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not allowed to delete this land.",
            });
        }

        if (land.isForSale) {
            return res.status(400).json({
                success: false,
                message:
                    "Remove the land from sale before deleting it.",
            });
        }

        await Land.findByIdAndDelete(id);

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
            message: "Server Error",
        });
    }
};

const toggleLandForSale = async (
    req,
    res
) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid land ID.",
            });
        }

        const land =
            await Land.findById(id);

        if (!land) {
            return res.status(404).json({
                success: false,
                message: "Land not found.",
            });
        }

        if (
            land.owner.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not allowed to change this land.",
            });
        }

        if (
            land.isForSale === true &&
            req.body.isForSale === false
        ) {
            land.isForSale = false;
        } else {
            let isForSale =
                req.body.isForSale;

            if (
                typeof isForSale ===
                "string"
            ) {
                if (
                    isForSale === "true"
                ) {
                    isForSale = true;
                } else if (
                    isForSale === "false"
                ) {
                    isForSale = false;
                } else {
                    return res.status(400).json({
                        success: false,
                        message:
                            "isForSale must be true or false.",
                    });
                }
            }

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

            if (
                isForSale &&
                land.isForSale
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Land is already available for sale.",
                });
            }

            land.isForSale = isForSale;
        }

        await land.save();

        await land.populate(
            "owner",
            "fullName email phone role"
        );

        return res.status(200).json({
            success: true,
            message: land.isForSale
                ? "Land is now available for sale."
                : "Land removed from sale.",
            land,
        });
    } catch (error) {
        console.error(
            "Toggle Land For Sale Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

export { createLand, getAllLands, getMyLands, getLandById, updateLand, deleteLand, toggleLandForSale, };