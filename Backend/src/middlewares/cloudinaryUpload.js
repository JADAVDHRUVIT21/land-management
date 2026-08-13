import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedImages = [
        "image/jpg",
        "image/jpeg",
        "image/png",
        "image/webp",
    ];

    const allowedVideos = [
        "video/mp4",
        "video/quicktime",
        "video/avi",
        "video/x-msvideo",
        "video/x-matroska",
        "video/webm",
    ];

    const allowedDocuments = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedImages.includes(file.mimetype)) {
        console.log("IMAGE ACCEPTED");
        cb(null, true);
    } else if (allowedVideos.includes(file.mimetype)) {
        console.log("VIDEO ACCEPTED");
        cb(null, true);
    } else if (allowedDocuments.includes(file.mimetype)) {
        console.log("DOCUMENT ACCEPTED");
        cb(null, true);
    } else {
        cb(
            new Error(
                `Unsupported file format: ${file.mimetype}`
            ),
            false
        );
    }
};

const upload = multer({
    storage,
    fileFilter,

    limits: {
        files: 15,
        fileSize: 100 * 1024 * 1024,
    },
});

export default upload;