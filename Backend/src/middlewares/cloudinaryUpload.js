import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// File filter for Multer
const fileFilter = (req, file, cb) => {
    const isVideo = file.mimetype.startsWith("video/");
    const isImage = file.mimetype.startsWith("image/");

    const allowedVideoFormats = ["video/mp4", "video/mov", "video/avi", "video/x-matroska", "video/webm"];
    const allowedImageFormats = ["image/jpg", "image/jpeg", "image/png", "image/webp"];

    if (isVideo && allowedVideoFormats.includes(file.mimetype)) {
        cb(null, true);
    } else if (isImage && allowedImageFormats.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("unsupported file format from cloudnary upload js file"), false);
    }
};

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const isVideo = file.mimetype.startsWith("video/");
        return {
            folder: "land-management",
            // resource_type: isVideo ? "video" : "image",
            resource_type: 'auto'
        };
    },
});
// const upload = multer({
//     storage,
//     fileFilter,
//     limits: {
//         fileSize: 100 * 1024 * 1024, // 100 MB
//     }
// });

const upload = multer({ storage });

export default upload;