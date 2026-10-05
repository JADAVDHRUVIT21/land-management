import mongoose from "mongoose";
import Land from "../models/LandModel.js";
import cloudinary from "../config/cloudinary.js";

/*
|--------------------------------------------------------------------------
| Cloudinary upload helpers
|--------------------------------------------------------------------------
*/

const uploadToCloudinary = (fileBuffer, folder = "uploads") => {
    return new Promise((resolve, reject) => {
        console.log(`[CLOUDINARY] Starting image upload to folder "${folder}" (${fileBuffer.length} bytes)`);

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "auto",
            },
            (error, result) => {
                if (error) {
                    console.error("[CLOUDINARY] ✗ Upload error:", error);
                    return reject(error);
                }
                console.log(`[CLOUDINARY] ✓ Uploaded: ${result.secure_url}`);
                resolve(result);
            }
        );

        uploadStream.end(fileBuffer);
    });
};

const uploadVideoToCloudinary = (fileBuffer, folder = "videos") => {
    return new Promise((resolve, reject) => {
        console.log(`[CLOUDINARY] Starting video upload to folder "${folder}" (${fileBuffer.length} bytes)`);

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "video",
                chunk_size: 6000000,
            },
            (error, result) => {
                if (error) {
                    console.error("[CLOUDINARY] ✗ Video error:", error);
                    return reject(error);
                }
                console.log(`[CLOUDINARY] ✓ Uploaded: ${result.secure_url}`);
                resolve(result);
            }
        );

        uploadStream.end(fileBuffer);
    });
};

/*
|--------------------------------------------------------------------------
| Helper: find an existing land with the same survey number IN THE SAME
| village + district (case-insensitive on village/district to prevent
| near-duplicates like "bhavnagar" vs "Bhavnagar").
|--------------------------------------------------------------------------
*/

const findDuplicateLand = async ({ surveyNumber, village, district, excludeId }) => {
    const query = {
        surveyNumber: String(surveyNumber).trim(),
        village: {
            $regex: `^${String(village).trim()}$`,
            $options: "i",
        },
        district: {
            $regex: `^${String(district).trim()}$`,
            $options: "i",
        },
    };

    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    return Land.findOne(query);
};

/*
|--------------------------------------------------------------------------
| Create Land
|--------------------------------------------------------------------------
*/

const createLand = async (req, res) => {
    try {
        console.log("\n========== createLand CALLED ==========");

        /* ---- 1. Auth check ---- */
        if (!req.user?.id) {
            console.log("[createLand] ✗ No req.user.id — auth failed");
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }
        console.log("[createLand] ✓ Auth OK. user.id =", req.user.id);

        /* ---- 2. Check multer parsed files ---- */
        console.log("[createLand] req.body keys:", Object.keys(req.body || {}));
        console.log("[createLand] req.files is:", req.files ? "OBJECT" : "UNDEFINED");
        console.log("[createLand] req.files keys:", req.files ? Object.keys(req.files) : []);
        console.log("[createLand] image files:", req.files?.image?.length || 0);
        console.log("[createLand] video files:", req.files?.video?.length || 0);

        if (req.files?.image?.length) {
            req.files.image.forEach((f, i) => {
                console.log(`  image[${i}] → ${f.originalname} | ${f.mimetype} | ${f.size} bytes | buffer=${f.buffer ? f.buffer.length : "MISSING"}`);
            });
        }
        if (req.files?.video?.length) {
            req.files.video.forEach((f, i) => {
                console.log(`  video[${i}] → ${f.originalname} | ${f.mimetype} | ${f.size} bytes | buffer=${f.buffer ? f.buffer.length : "MISSING"}`);
            });
        }

        /* ---- 3. Destructure + validate text fields ---- */
        const {
            surveyNumber,
            area,
            village,
            district,
            state,
            landType,
            listingType,
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
            !listingType ||
            !location ||
            price === undefined ||
            price === ""
        ) {
            console.log("[createLand] ✗ Missing required text field");
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields.",
            });
        }

        if (!["For Sale", "Wanted to Buy"].includes(listingType)) {
            return res.status(400).json({
                success: false,
                message: "listingType must be For Sale or Wanted to Buy.",
            });
        }

        const parsedArea = Number(area);
        const parsedPrice = Number(price);

        if (Number.isNaN(parsedArea) || parsedArea <= 0) {
            return res.status(400).json({
                success: false,
                message: "Area must be a valid positive number.",
            });
        }

        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({
                success: false,
                message: "Price must be a valid number.",
            });
        }

        /* ---- 4. Scoped duplicate check (surveyNumber + village + district) ---- */
        const existingLand = await findDuplicateLand({
            surveyNumber,
            village,
            district,
        });

        if (existingLand) {
            return res.status(400).json({
                success: false,
                message:
                    "Survey Number already exists in this village and district.",
            });
        }

        /* ---- 5. Location parsing ---- */
        let parsedLocation;
        try {
            parsedLocation =
                typeof location === "string"
                    ? JSON.parse(location)
                    : location;
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: "Invalid location format.",
            });
        }

        if (
            !parsedLocation ||
            parsedLocation.latitude === undefined ||
            parsedLocation.longitude === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude are required.",
            });
        }

        const latitude = Number(parsedLocation.latitude);
        const longitude = Number(parsedLocation.longitude);

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude must be valid numbers.",
            });
        }

        if (latitude < -90 || latitude > 90) {
            return res.status(400).json({
                success: false,
                message: "Latitude must be between -90 and 90.",
            });
        }

        if (longitude < -180 || longitude > 180) {
            return res.status(400).json({
                success: false,
                message: "Longitude must be between -180 and 180.",
            });
        }

        console.log("[createLand] ✓ All text fields + location validated");

        /* ---- 6. Upload images ---- */
        let images = [];

        if (req.files?.image && req.files.image.length > 0) {
            console.log(`[createLand] Uploading ${req.files.image.length} image(s) to Cloudinary...`);

            try {
                images = [];
                for (const file of req.files.image) {
                    console.log(`  → Uploading image: ${file.originalname}`);
                    const result = await uploadToCloudinary(
                        file.buffer,
                        "lands/images"
                    );
                    console.log(`  ✓ Got URL: ${result.secure_url}`);
                    images.push({ url: result.secure_url });
                }
                console.log("[createLand] ✓ All images uploaded. Count:", images.length);
            } catch (err) {
                console.error("[createLand] ✗ IMAGE UPLOAD FAILED:", err);
                return res.status(500).json({
                    success: false,
                    message: "Image upload failed: " + err.message,
                });
            }
        } else {
            console.log("[createLand] ⚠ No images in req.files.image (skipping)");
        }

        /* ---- 7. Upload videos ---- */
        let videos = [];

        if (req.files?.video && req.files.video.length > 0) {
            console.log(`[createLand] Uploading ${req.files.video.length} video(s) to Cloudinary...`);

            try {
                videos = [];
                for (const file of req.files.video) {
                    console.log(`  → Uploading video: ${file.originalname}`);
                    const result = await uploadVideoToCloudinary(
                        file.buffer,
                        "lands/videos"
                    );
                    console.log(`  ✓ Got URL: ${result.secure_url}`);
                    videos.push({ url: result.secure_url });
                }
                console.log("[createLand] ✓ All videos uploaded. Count:", videos.length);
            } catch (err) {
                console.error("[createLand] ✗ VIDEO UPLOAD FAILED:", err);
                return res.status(500).json({
                    success: false,
                    message: "Video upload failed: " + err.message,
                });
            }
        } else {
            console.log("[createLand] ⚠ No videos in req.files.video (skipping)");
        }

        /* ---- 8. Save to Mongo ---- */
        console.log("[createLand] Saving to MongoDB...");
        console.log("  images being saved:", images);
        console.log("  videos being saved:", videos);

        const land = await Land.create({
            surveyNumber: surveyNumber.trim(),
            owner: req.user.id,
            area: parsedArea,
            village: village.trim(),
            district: district.trim(),
            state: state.trim(),
            landType,
            listingType,
            isForSale: false,
            price: parsedPrice,
            description: description ? description.trim() : "",
            image: images,
            video: videos,
            location: {
                latitude,
                longitude,
            },
        });

        console.log("[createLand] ✓ Mongo saved. Land _id:", land._id);
        console.log("  → saved image count:", land.image?.length || 0);
        console.log("  → saved video count:", land.video?.length || 0);

        const populatedLand = await Land.findById(land._id).populate(
            "owner",
            "fullName email phone role"
        );

        return res.status(201).json({
            success: true,
            message: "Land created successfully and saved as draft.",
            land: populatedLand,
        });
    } catch (error) {
        console.error("[createLand] ✗✗✗ FATAL ERROR:", error);
        console.error("Stack:", error.stack);

        // Handle the compound unique index race-condition error
        if (error?.code === 11000) {
            return res.status(400).json({
                success: false,
                message:
                    "Survey Number already exists in this village and district.",
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || "Server Error",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Get All Lands
|--------------------------------------------------------------------------
*/

const getAllLands = async (req, res) => {
    try {
        const {
            search,
            village,
            district,
            state,
            landType,
            listingType,
            minPrice,
            maxPrice,
            page = 1,
            limit = 10,
        } = req.query;

        const filter = { isForSale: true };

        if (req.user?.id) {
            filter.owner = { $ne: req.user.id };
        }

        if (listingType) {
            if (!["For Sale", "Wanted to Buy"].includes(listingType)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid listingType.",
                });
            }
            filter.listingType = listingType;
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

        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};

            if (minPrice !== undefined && minPrice !== "") {
                const minimum = Number(minPrice);
                if (Number.isNaN(minimum) || minimum < 0) {
                    return res.status(400).json({
                        success: false,
                        message: "minPrice must be a valid number.",
                    });
                }
                filter.price.$gte = minimum;
            }

            if (maxPrice !== undefined && maxPrice !== "") {
                const maximum = Number(maxPrice);
                if (Number.isNaN(maximum) || maximum < 0) {
                    return res.status(400).json({
                        success: false,
                        message: "maxPrice must be a valid number.",
                    });
                }
                filter.price.$lte = maximum;
            }

            if (
                filter.price.$gte !== undefined &&
                filter.price.$lte !== undefined &&
                filter.price.$gte > filter.price.$lte
            ) {
                return res.status(400).json({
                    success: false,
                    message: "minPrice cannot be greater than maxPrice.",
                });
            }
        }

        const pageNumber = Math.max(Number(page) || 1, 1);
        const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);
        const skip = (pageNumber - 1) * limitNumber;

        const total = await Land.countDocuments(filter);

        const lands = await Land.find(filter)
            .populate("owner", "fullName email phone role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber);

        return res.status(200).json({
            success: true,
            count: lands.length,
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
            lands,
        });
    } catch (error) {
        console.error("Get All Lands Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Get My Lands
|--------------------------------------------------------------------------
*/

const getMyLands = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const lands = await Land.find({ owner: req.user.id })
            .populate("owner", "fullName email phone role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: lands.length,
            lands,
        });
    } catch (error) {
        console.error("Get My Lands Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Get Land By ID
|--------------------------------------------------------------------------
*/

const getLandById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid land ID.",
            });
        }

        const land = await Land.findById(id).populate(
            "owner",
            "fullName email phone role"
        );

        if (!land) {
            return res.status(404).json({
                success: false,
                message: "Land not found.",
            });
        }

        const userId = req.user?.id || req.user?._id;
        const ownerId = land.owner?._id || land.owner;

        const isOwner =
            userId &&
            ownerId &&
            ownerId.toString() === userId.toString();

        if (!isOwner && !land.isForSale) {
            return res.status(403).json({
                success: false,
                message: "This land is not available for viewing.",
            });
        }

        return res.status(200).json({
            success: true,
            land,
        });
    } catch (error) {
        console.error("Get Land By ID Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Update Land
|--------------------------------------------------------------------------
*/

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

        const land = await Land.findById(id);

        if (!land) {
            return res.status(404).json({
                success: false,
                message: "Land not found.",
            });
        }

        if (land.owner.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update this land.",
            });
        }

        console.log("===== updateLand =====");
        console.log("image count:", req.files?.image?.length || 0);
        console.log("video count:", req.files?.video?.length || 0);

        const updateData = {};

        const allowedTextFields = [
            "surveyNumber",
            "area",
            "village",
            "district",
            "state",
            "landType",
            "listingType",
            "price",
            "description",
        ];

        allowedTextFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        if (updateData.listingType !== undefined) {
            if (
                !["For Sale", "Wanted to Buy"].includes(
                    updateData.listingType
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "listingType must be For Sale or Wanted to Buy.",
                });
            }
        }

        /*
        |----------------------------------------------------------------------
        | Scoped duplicate check
        |----------------------------------------------------------------------
        | Compare against the FINAL values of surveyNumber, village, and
        | district — i.e. the incoming values if present, otherwise the
        | existing land's values. This way editing just the survey number
        | (while keeping the same village/district) still gets checked
        | correctly.
        |----------------------------------------------------------------------
        */

        const finalSurveyNumber =
            updateData.surveyNumber !== undefined
                ? String(updateData.surveyNumber).trim()
                : land.surveyNumber;

        const finalVillage =
            updateData.village !== undefined
                ? String(updateData.village).trim()
                : land.village;

        const finalDistrict =
            updateData.district !== undefined
                ? String(updateData.district).trim()
                : land.district;

        if (
            updateData.surveyNumber !== undefined ||
            updateData.village !== undefined ||
            updateData.district !== undefined
        ) {
            const duplicate = await findDuplicateLand({
                surveyNumber: finalSurveyNumber,
                village: finalVillage,
                district: finalDistrict,
                excludeId: id,
            });

            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Survey Number already exists in this village and district.",
                });
            }
        }

        if (updateData.surveyNumber !== undefined) {
            updateData.surveyNumber = finalSurveyNumber;
        }

        if (updateData.area !== undefined) {
            updateData.area = Number(updateData.area);

            if (Number.isNaN(updateData.area) || updateData.area <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Area must be a valid positive number.",
                });
            }
        }

        if (updateData.price !== undefined) {
            updateData.price = Number(updateData.price);

            if (Number.isNaN(updateData.price) || updateData.price < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Price must be a valid number.",
                });
            }
        }

        ["village", "district", "state", "description"].forEach((field) => {
            if (updateData[field] !== undefined) {
                updateData[field] = String(updateData[field]).trim();
            }
        });

        if (req.body.location) {
            try {
                let parsedLocation = req.body.location;

                if (typeof parsedLocation === "string") {
                    parsedLocation = JSON.parse(parsedLocation);
                }

                const latitude = Number(parsedLocation.latitude);
                const longitude = Number(parsedLocation.longitude);

                if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
                    return res.status(400).json({
                        success: false,
                        message: "Latitude and longitude must be valid numbers.",
                    });
                }

                if (latitude < -90 || latitude > 90) {
                    return res.status(400).json({
                        success: false,
                        message: "Latitude must be between -90 and 90.",
                    });
                }

                if (longitude < -180 || longitude > 180) {
                    return res.status(400).json({
                        success: false,
                        message: "Longitude must be between -180 and 180.",
                    });
                }

                updateData.location = { latitude, longitude };
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid location format.",
                });
            }
        }

        /* ---- Media merge ---- */
        let existingImages = [];
        let existingVideos = [];

        if (req.body.existingImages !== undefined) {
            try {
                existingImages =
                    typeof req.body.existingImages === "string"
                        ? JSON.parse(req.body.existingImages)
                        : req.body.existingImages;
                if (!Array.isArray(existingImages)) existingImages = [];
            } catch (err) {
                existingImages = [];
            }
        } else {
            existingImages = Array.isArray(land.image)
                ? land.image.map((img) => img.url)
                : [];
        }

        if (req.body.existingVideos !== undefined) {
            try {
                existingVideos =
                    typeof req.body.existingVideos === "string"
                        ? JSON.parse(req.body.existingVideos)
                        : req.body.existingVideos;
                if (!Array.isArray(existingVideos)) existingVideos = [];
            } catch (err) {
                existingVideos = [];
            }
        } else {
            existingVideos = Array.isArray(land.video)
                ? land.video.map((vid) => vid.url)
                : [];
        }

        let newImageObjects = [];
        if (req.files?.image && req.files.image.length > 0) {
            try {
                newImageObjects = await Promise.all(
                    req.files.image.map(async (file) => {
                        const result = await uploadToCloudinary(
                            file.buffer,
                            "lands/images"
                        );
                        return { url: result.secure_url };
                    })
                );
            } catch (err) {
                return res.status(500).json({
                    success: false,
                    message: "Image upload failed: " + err.message,
                });
            }
        }

        let newVideoObjects = [];
        if (req.files?.video && req.files.video.length > 0) {
            try {
                newVideoObjects = await Promise.all(
                    req.files.video.map(async (file) => {
                        const result = await uploadVideoToCloudinary(
                            file.buffer,
                            "lands/videos"
                        );
                        return { url: result.secure_url };
                    })
                );
            } catch (err) {
                return res.status(500).json({
                    success: false,
                    message: "Video upload failed: " + err.message,
                });
            }
        }

        const mergedImages = [
            ...existingImages
                .map((item) => {
                    if (!item) return null;
                    if (typeof item === "string") return { url: item };
                    if (typeof item === "object" && item.url)
                        return { url: item.url };
                    return null;
                })
                .filter(Boolean),
            ...newImageObjects,
        ];

        const mergedVideos = [
            ...existingVideos
                .map((item) => {
                    if (!item) return null;
                    if (typeof item === "string") return { url: item };
                    if (typeof item === "object" && item.url)
                        return { url: item.url };
                    return null;
                })
                .filter(Boolean),
            ...newVideoObjects,
        ];

        updateData.image = mergedImages;
        updateData.video = mergedVideos;

        const updatedLand = await Land.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).populate("owner", "fullName email phone role");

        return res.status(200).json({
            success: true,
            message: "Land updated successfully.",
            land: updatedLand,
        });
    } catch (error) {
        console.error("Update Land Error:", error);

        if (error?.code === 11000) {
            return res.status(400).json({
                success: false,
                message:
                    "Survey Number already exists in this village and district.",
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || "Server Error",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Delete Land
|--------------------------------------------------------------------------
*/

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

        const land = await Land.findById(id);

        if (!land) {
            return res.status(404).json({
                success: false,
                message: "Land not found.",
            });
        }

        if (land.owner.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to delete this land.",
            });
        }

        if (land.isForSale) {
            return res.status(400).json({
                success: false,
                message: "Remove the land from active listing before deleting it.",
            });
        }

        await Land.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Land deleted successfully.",
        });
    } catch (error) {
        console.error("Delete Land Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Toggle Land For Sale
|--------------------------------------------------------------------------
*/

const toggleLandForSale = async (req, res) => {
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

        const land = await Land.findById(id);

        if (!land) {
            return res.status(404).json({
                success: false,
                message: "Land not found.",
            });
        }

        if (land.owner.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to change this land.",
            });
        }

        let isForSale = req.body.isForSale;

        if (typeof isForSale === "string") {
            if (isForSale === "true") isForSale = true;
            else if (isForSale === "false") isForSale = false;
            else {
                return res.status(400).json({
                    success: false,
                    message: "isForSale must be true or false.",
                });
            }
        }

        if (typeof isForSale !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isForSale must be true or false.",
            });
        }

        if (isForSale && land.isForSale) {
            return res.status(400).json({
                success: false,
                message: "Land is already available as an active listing.",
            });
        }

        if (!isForSale && !land.isForSale) {
            return res.status(400).json({
                success: false,
                message: "Land is already inactive.",
            });
        }

        land.isForSale = isForSale;

        await land.save();
        await land.populate("owner", "fullName email phone role");

        const listingMessage =
            land.listingType === "Wanted to Buy"
                ? isForSale
                    ? "Your wanted-to-buy listing is now active."
                    : "Your wanted-to-buy listing is now inactive."
                : isForSale
                    ? "Land is now available for sale."
                    : "Land removed from sale.";

        return res.status(200).json({
            success: true,
            message: listingMessage,
            land,
        });
    } catch (error) {
        console.error("Toggle Land Listing Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

export {
    createLand,
    getAllLands,
    getMyLands,
    getLandById,
    updateLand,
    deleteLand,
    toggleLandForSale,
};