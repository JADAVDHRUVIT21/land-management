import express from "express";

import {
    createLand,
    getAllLands,
    getMyLands,
    getLandById,
    updateLand,
    deleteLand,
    toggleLandForSale,
} from "../controllers/landController.js";

import {
    verifyToken,
} from "../middlewares/authMiddleware.js";

import upload from "../middlewares/CloudinaryUpload.js";

const router = express.Router();

router.post(
    "/",
    verifyToken,
    upload.fields([
        {
            name: "image",
            maxCount: 10,
        },
        {
            name: "video",
            maxCount: 5,
        },
    ]),
    createLand
);

router.post(
    "/upload",
    verifyToken,
    upload.fields([
        {
            name: "image",
            maxCount: 10,
        },
        {
            name: "video",
            maxCount: 5,
        },
    ]),
    (req, res) => {
        console.log("req.files:");
        console.dir(req.files, { depth: null });

        console.log("req.body:");
        console.dir(req.body, { depth: null });

        return res.status(200).json({
            success: true,
            files: req.files,
        });
    }
);

router.get(
    "/my",
    verifyToken,
    getMyLands
);

router.get(
    "/",
    verifyToken,
    getAllLands
);

router.get(
    "/:id",
    verifyToken,
    getLandById
);

router.put(
    "/:id",
    verifyToken,
    updateLand
);

router.delete(
    "/:id",
    verifyToken,
    deleteLand
);

router.patch(
    "/:id/for-sale",
    verifyToken,
    toggleLandForSale
);

export default router;