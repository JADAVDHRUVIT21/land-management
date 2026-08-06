import Land from "../models/LandModel.js";


// // Create Land
// export const createLand = async (req, res) => {
//     try {
//         const {
//             surveyNumber,
//             owner,
//             area,
//             village,
//             district,
//             state,
//             landType,
//             location,
//             price,
//             description,
//             image,
//             video
//         } = req.body;


//         const existingLand = await Land.findOne({ surveyNumber });

//         if (existingLand) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Survey Number already exists.",
//             });
//         }

//         const land = await Land.create({
//             surveyNumber,
//             owner,
//             area,
//             village,
//             district,
//             state,
//             landType,
//             location,
//             price,
//             description,
//             image,
//             video
//         });

//         return res.status(201).json({
//             success: true,
//             message: "Land added successfully.",
//             land,
//         });
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };
import Land from "../models/Land.js";

// Create Land
export const createLand = async (req, res) => {
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

        // Check if survey number already exists
        const existingLand = await Land.findOne({ surveyNumber });

        if (existingLand) {
            return res.status(400).json({
                success: false,
                message: "Survey Number already exists.",
            });
        }

        // Images
        const images = req.files?.image
            ? req.files.image.map(file => ({
                url: file.path,
                public_id: file.filename,
            }))
            : [];

        // Videos
        const videos = req.files?.video
            ? req.files.video.map(file => ({
                url: file.path,
                public_id: file.filename,
            }))
            : [];

        const land = await Land.create({
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
            image: images,
            video: videos,
        });

        return res.status(201).json({
            success: true,
            message: "Land added successfully.",
            land,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get All Lands
export const getAllLands = async (req, res) => {
    try {
        const lands = await Land.find()
            .populate("owner", "fullName email phone role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: lands.length,
            lands,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// Get Land By ID
export const getLandById = async (req, res) => {
    try {
        const land = await Land.findById(req.params.id)
            .populate("owner", "fullName email phone role");

        if (!land) {
            return res.status(404).json({
                success: false,
                message: "Land not found.",
            });
        }

        return res.status(200).json({
            success: true,
            land,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// Update Land
export const updateLand = async (req, res) => {
    try {
        const land = await Land.findById(req.params.id);

        if (!land) {
            return res.status(404).json({
                success: false,
                message: "Land not found.",
            });
        }

        const updatedLand = await Land.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        return res.status(200).json({
            success: true,
            message: "Land updated successfully.",
            land: updatedLand,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// Delete Land
export const deleteLand = async (req, res) => {
    try {
        const land = await Land.findById(req.params.id);

        if (!land) {
            return res.status(404).json({
                success: false,
                message: "Land not found.",
            });
        }

        await Land.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Land deleted successfully.",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};