import mongoose from "mongoose";
import OwnershipTransfer from "../models/OwnershipTransfer.js";
import Land from "../models/LandModel.js";
import User from "../models/UserModels.js";

const populateTransfer = (query) => {
    return query
        .populate("land")
        .populate(
            "currentOwner",
            "fullName email phone role"
        )
        .populate(
            "newOwner",
            "fullName email phone role"
        )
        .populate(
            "requestedBy",
            "fullName email phone role"
        )
        .populate(
            "approvedBy",
            "fullName email phone role"
        );
};

const createTransferRequest = async (req, res) => {
    try {
        const { land, reason } = req.body;

        if (!land || !reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: "Land and reason are required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(land)) {
            return res.status(400).json({
                success: false,
                message: "Invalid land ID.",
            });
        }

        const buyerId = req.user?.id || req.user?._id;

        if (!buyerId) {
            return res.status(401).json({
                success: false,
                message: "User information not found in token.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(buyerId)) {
            return res.status(401).json({
                success: false,
                message: "Invalid user ID in token.",
            });
        }

        const buyer = await User.findById(buyerId);

        if (!buyer) {
            return res.status(404).json({
                success: false,
                message: "Buyer not found.",
            });
        }

        if (buyer.role !== "user") {
            return res.status(403).json({
                success: false,
                message: "Only users can purchase land.",
            });
        }

        const existingLand = await Land.findById(land);

        if (!existingLand) {
            return res.status(404).json({
                success: false,
                message: "Land not found.",
            });
        }

        if (!existingLand.owner) {
            return res.status(400).json({
                success: false,
                message: "This land does not have a valid owner.",
            });
        }

        if (existingLand.isForSale !== true) {
            return res.status(400).json({
                success: false,
                message: "This land is not currently available for sale.",
            });
        }

        if (
            existingLand.owner.toString() ===
            buyerId.toString()
        ) {
            return res.status(400).json({
                success: false,
                message: "You cannot buy your own land.",
            });
        }

        const pendingTransfer =
            await OwnershipTransfer.findOne({
                land: existingLand._id,
                status: "Pending",
            });

        if (pendingTransfer) {
            return res.status(400).json({
                success: false,
                message:
                    "A purchase request is already pending for this land.",
            });
        }

        const transfer = await OwnershipTransfer.create({
            land: existingLand._id,
            currentOwner: existingLand.owner,
            newOwner: buyerId,
            requestedBy: buyerId,
            reason: reason.trim(),
            status: "Pending",
            approvedBy: null,
            rejectionReason: "",
            transferDate: null,
        });

        const populatedTransfer = await populateTransfer(
            OwnershipTransfer.findById(transfer._id)
        );

        return res.status(201).json({
            success: true,
            message: "Purchase request created successfully.",
            transfer: populatedTransfer,
        });
    } catch (error) {
        console.error("Create Transfer Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getAllTransferRequests = async (req, res) => {
    try {
        const transfers = await populateTransfer(
            OwnershipTransfer.find().sort({
                createdAt: -1,
            })
        );

        return res.status(200).json({
            success: true,
            count: transfers.length,
            transfers,
        });
    } catch (error) {
        console.error(
            "Get All Transfer Requests Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getMyTransferRequests = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const transfers = await populateTransfer(
            OwnershipTransfer.find({
                requestedBy: userId,
            }).sort({
                createdAt: -1,
            })
        );

        return res.status(200).json({
            success: true,
            count: transfers.length,
            transfers,
        });
    } catch (error) {
        console.error(
            "Get My Transfer Requests Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getTransferById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid transfer ID.",
            });
        }

        const transfer = await populateTransfer(
            OwnershipTransfer.findById(id)
        );

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: "Transfer request not found.",
            });
        }

        return res.status(200).json({
            success: true,
            transfer,
        });
    } catch (error) {
        console.error("Get Transfer Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const approveTransfer = async (req, res) => {
    try {
        const { id } = req.params;

        const approvedBy =
            req.user?.id || req.user?._id;

        if (!approvedBy) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid transfer ID.",
            });
        }

        const transfer =
            await OwnershipTransfer.findById(id);

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: "Transfer request not found.",
            });
        }

        if (transfer.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message:
                    `Transfer request is already ${transfer.status}.`,
            });
        }

        const land =
            await Land.findById(transfer.land);

        if (!land) {
            return res.status(404).json({
                success: false,
                message: "Land not found.",
            });
        }

        if (!land.owner) {
            return res.status(400).json({
                success: false,
                message: "Land owner information is missing.",
            });
        }

        if (land.isForSale !== true) {
            return res.status(400).json({
                success: false,
                message:
                    "This land is no longer available for sale.",
            });
        }

        if (
            land.owner.toString() !==
            transfer.currentOwner.toString()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Current land owner has changed. This transfer request is no longer valid.",
            });
        }

        if (
            approvedBy.toString() !==
            transfer.currentOwner.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only the current land owner can approve this purchase request.",
            });
        }

        const newOwner =
            await User.findById(transfer.newOwner);

        if (!newOwner) {
            return res.status(404).json({
                success: false,
                message: "New owner not found.",
            });
        }

        if (newOwner.role !== "user") {
            return res.status(400).json({
                success: false,
                message: "New owner must be a user.",
            });
        }

        if (
            land.owner.toString() ===
            transfer.newOwner.toString()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Buyer is already the owner of this land.",
            });
        }

        land.owner = transfer.newOwner;
        land.isForSale = false;

        await land.save();

        transfer.status = "Approved";
        transfer.approvedBy = approvedBy;
        transfer.transferDate = new Date();
        transfer.rejectionReason = "";

        await transfer.save();

        const populatedTransfer =
            await populateTransfer(
                OwnershipTransfer.findById(
                    transfer._id
                )
            );

        return res.status(200).json({
            success: true,
            message:
                "Purchase approved. Land ownership transferred successfully.",
            transfer: populatedTransfer,
        });
    } catch (error) {
        console.error(
            "Approve Transfer Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const rejectTransfer = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        const approvedBy =
            req.user?.id || req.user?._id;

        if (!approvedBy) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid transfer ID.",
            });
        }

        if (
            !rejectionReason ||
            !rejectionReason.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Rejection reason is required.",
            });
        }

        const transfer =
            await OwnershipTransfer.findById(id);

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message:
                    "Transfer request not found.",
            });
        }

        if (transfer.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message:
                    `Transfer request is already ${transfer.status}.`,
            });
        }

        if (
            approvedBy.toString() !==
            transfer.currentOwner.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only the current land owner can reject this purchase request.",
            });
        }

        const land =
            await Land.findById(transfer.land);

        if (!land) {
            return res.status(404).json({
                success: false,
                message: "Land not found.",
            });
        }

        if (
            !land.owner ||
            land.owner.toString() !==
            transfer.currentOwner.toString()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Current land owner has changed. This transfer request is no longer valid.",
            });
        }

        transfer.status = "Rejected";
        transfer.approvedBy = approvedBy;
        transfer.rejectionReason =
            rejectionReason.trim();
        transfer.transferDate = null;

        await transfer.save();

        const populatedTransfer =
            await populateTransfer(
                OwnershipTransfer.findById(
                    transfer._id
                )
            );

        return res.status(200).json({
            success: true,
            message:
                "Purchase request rejected successfully.",
            transfer: populatedTransfer,
        });
    } catch (error) {
        console.error(
            "Reject Transfer Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export { createTransferRequest, getAllTransferRequests, getMyTransferRequests, getTransferById, approveTransfer, rejectTransfer, };