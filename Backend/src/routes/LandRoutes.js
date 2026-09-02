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

/*
|--------------------------------------------------------------------------
| CREATE LAND
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| UPLOAD FILES TEST
|--------------------------------------------------------------------------
*/

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
            message: "Files uploaded successfully.",
            files: req.files,
            body: req.body,
        });
    }
);


/*
|--------------------------------------------------------------------------
| GET MY LANDS
|--------------------------------------------------------------------------
*/

router.get(
    "/my",
    verifyToken,
    getMyLands
);


/*
|--------------------------------------------------------------------------
| GET LANDS FOR SALE
|--------------------------------------------------------------------------
| IMPORTANT:
| This MUST be before /:id
|--------------------------------------------------------------------------
*/

router.get(
    "/for-sale",
    verifyToken,
    async (req, res, next) => {

        try {

            const Land = (
                await import("../models/LandModel.js")
            ).default;

            const lands = await Land.find({
                isForSale: true,
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


/*
|--------------------------------------------------------------------------
| GET ALL LANDS
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    verifyToken,
    getAllLands
);


/*
|--------------------------------------------------------------------------
| GET SINGLE LAND
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    verifyToken,
    getLandById
);


/*
|--------------------------------------------------------------------------
| UPDATE LAND
|--------------------------------------------------------------------------
*/

router.put(
    "/:id",
    verifyToken,
    updateLand
);


/*
|--------------------------------------------------------------------------
| DELETE LAND
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",
    verifyToken,
    deleteLand
);


/*
|--------------------------------------------------------------------------
| TOGGLE LAND FOR SALE
|--------------------------------------------------------------------------
*/

router.patch(
    "/:id/for-sale",
    verifyToken,
    toggleLandForSale
);


export default router;