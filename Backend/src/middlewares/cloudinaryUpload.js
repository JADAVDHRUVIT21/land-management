import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    console.log("=== MULTER fileFilter ===");
    console.log("fieldname:", file.fieldname);
    console.log("originalname:", file.originalname);
    console.log("mimetype:", file.mimetype);

    const allowedImages = [
        "image/jpg",
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/heic",
    ];

    const allowedVideos = [
        "video/mp4",
        "video/quicktime",
        "video/avi",
        "video/x-msvideo",
        "video/x-matroska",
        "video/webm",
        "video/mov",
        "video/3gpp",
    ];

    const allowedDocuments = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const all = [...allowedImages, ...allowedVideos, ...allowedDocuments];

    if (all.includes(file.mimetype)) {
        console.log("✓ ACCEPTED:", file.mimetype);
        cb(null, true);
    } else {
        console.error("✗ REJECTED:", file.mimetype);
        cb(
            new Error(`Unsupported file format: ${file.mimetype}`),
            false
        );
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        files: 15,
        fileSize: 100 * 1024 * 1024, // 100 MB
    },
});

export default upload;