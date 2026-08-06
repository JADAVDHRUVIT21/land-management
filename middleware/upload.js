import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        const isVideo = file.mimetype.startsWith("video");

        return {
            folder: "lands",
            resource_type: isVideo ? "video" : "image",
            allowed_formats: isVideo
                ? ["mp4", "mov", "avi", "mkv"]
                : ["jpg", "jpeg", "png", "webp"],
        };
    },
});

export default multer({ storage });