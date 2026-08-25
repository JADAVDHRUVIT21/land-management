import express from "express";

import {
    createLand,
    getAllLands,
    getLandById,
    updateLand,
    deleteLand,
} from "../controllers/LandController.js";

import {
    verifyToken,
    isAdmin,
} from "../middlewares/AuthMiddleware.js";
import upload from "../middlewares/CloudinaryUpload.js";


const router = express.Router();

router.post(
    "/",
    verifyToken,
    isAdmin,
    upload.fields([
        { name: "image", maxCount: 10 },
        { name: "video", maxCount: 5 },
    ]),
    createLand
);

router.post(
    "/upload",
    verifyToken,
    isAdmin,
    upload.fields([
        { name: "image", maxCount: 10 },
        { name: "video", maxCount: 5 }
    ]),
    (req, res) => {

        console.log("========== START ==========");

        console.log("req.files:");
        console.dir(req.files, { depth: null });

        console.log("req.body:");
        console.dir(req.body, { depth: null });

        console.log("========== END ==========");

        res.status(200).json({
            success: true,
            files: req.files
        });
    }
);

// Get All Lands
router.get(
    "/",
    verifyToken,
    isAdmin,
    getAllLands
);

// Get Single Land
router.get(
    "/:id",
    verifyToken,
    getLandById
);

// Update Land
router.put(
    "/:id",
    verifyToken,
    isAdmin,
    updateLand
);

// Delete Land
router.delete(
    "/:id",
    verifyToken,
    isAdmin,
    deleteLand
);
router.patch(
    "/:id/status",
    verifyToken,
    isAdmin,
    updateLandStatus
);

export default router;