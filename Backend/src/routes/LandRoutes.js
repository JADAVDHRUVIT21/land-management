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
import { verifyToken } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/CloudinaryUpload.js";

const router = express.Router();

/* ------------------------------------------------------------------ */
/*  Upload field config                                                */
/* ------------------------------------------------------------------ */
const landUploadFields = upload.fields([
    { name: "image", maxCount: 10 },
    { name: "video", maxCount: 5 },
]);

/* ------------------------------------------------------------------ */
/*  DEBUG endpoint — hit this FIRST to verify multer works             */
/* ------------------------------------------------------------------ */
router.post("/upload", verifyToken, landUploadFields, (req, res) => {
    console.log("===== /upload debug =====");
    console.log("req.files:", req.files);
    console.log("req.body:", req.body);

    return res.status(200).json({
        success: true,
        message: "Files received.",
        files: req.files,
        body: req.body,
    });
});

/* ------------------------------------------------------------------ */
/*  Create                                                             */
/* ------------------------------------------------------------------ */
router.post("/", verifyToken, landUploadFields, createLand);

/* ------------------------------------------------------------------ */
/*  Read                                                               */
/* ------------------------------------------------------------------ */
router.get("/my", verifyToken, getMyLands);
router.get("/for-sale", verifyToken, async (req, res, next) => {
    try {
        const Land = (await import("../models/LandModel.js")).default;
        const lands = await Land.find({
            isForSale: true,
            listingType: "For Sale",
        })
            .populate("owner", "fullName email phone role")
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, count: lands.length, lands });
    } catch (error) {
        next(error);
    }
});

router.get("/wanted-to-buy", verifyToken, async (req, res, next) => {
    try {
        const Land = (await import("../models/LandModel.js")).default;
        const lands = await Land.find({
            isForSale: true,
            listingType: "Wanted to Buy",
        })
            .populate("owner", "fullName email phone role")
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, count: lands.length, lands });
    } catch (error) {
        next(error);
    }
});

router.get("/", verifyToken, getAllLands);
router.get("/:id", verifyToken, getLandById);

/* ------------------------------------------------------------------ */
/*  Update                                                             */
/* ------------------------------------------------------------------ */
router.put("/:id", verifyToken, landUploadFields, updateLand);

/* ------------------------------------------------------------------ */
/*  Delete / Toggle                                                    */
/* ------------------------------------------------------------------ */
router.delete("/:id", verifyToken, deleteLand);
router.patch("/:id/for-sale", verifyToken, toggleLandForSale);

export default router;