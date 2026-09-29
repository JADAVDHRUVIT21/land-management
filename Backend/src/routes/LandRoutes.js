import express from "express";

import {
    createLand,
    getAllLands,
    getMyLands,
    getLandById,
    updateLand,
    deleteLand,
    toggleLandForSale,
} from "../controllers/LandController.js";

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
        console.dir(req.files, {
            depth: null,
        });

        console.log("req.body:");
        console.dir(req.body, {
            depth: null,
        });

        return res.status(200).json({
            success: true,
            message:
                "Files uploaded successfully.",
            files: req.files,
            body: req.body,
        });
    }
);

router.get(
    "/my",
    verifyToken,
    getMyLands
);

router.get(
    "/for-sale",
    verifyToken,
    async (req, res, next) => {
        try {
            const Land = (
                await import(
                    "../models/LandModel.js"
                )
            ).default;

            const lands =
                await Land.find({
                    isForSale: true,
                    listingType: "For Sale",
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
                "Get Lands For Sale Error:",
                error
            );

            next(error);
        }
    }
);

router.get(
    "/wanted-to-buy",
    verifyToken,
    async (req, res, next) => {
        try {
            const Land = (
                await import(
                    "../models/LandModel.js"
                )
            ).default;

            const lands =
                await Land.find({
                    isForSale: true,
                    listingType:
                        "Wanted to Buy",
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
                "Get Wanted To Buy Error:",
                error
            );

            next(error);
        }
    }
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