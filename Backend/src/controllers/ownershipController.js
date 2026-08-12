import mongoose from "mongoose";

import OwnershipTransfer from "../models/OwnershipTransfer.js";
import Land from "../models/LandModel.js";
import User from "../models/UserModels.js";


// CREATE OWNERSHIP TRANSFER REQUEST
export const createTransferRequest = async (req, res) => {
    try {
        const {
            land,
            newOwner,
            reason,
        } = req.body;

        // Check required fields
        if (!land || !newOwner || !reason) {
            return res.status(400).json({
                success: false,
                message: "Land, new owner and reason are required.",
            });
        }

        // Validate Land ID
        if (!mongoose.Types.ObjectId.isValid(land)) {
            return res.status(400).json({
                success: false,
                message: "Invalid land ID.",
            });
        }

        // Validate New Owner ID
        if (!mongoose.Types.ObjectId.isValid(newOwner)) {
            return res.status(400).json({
                success: false,
                message: "Invalid new owner ID.",
            });
        }

        // Find land
        const existingLand = await Land.findById(land);

        if (!existingLand) {
            return res.status(404).json({
                success: false,
                message: "Land not found.",
            });
        }

        // Find new owner
        const existingNewOwner = await User.findById(newOwner);

        if (!existingNewOwner) {
            return res.status(404).json({
                success: false,
                message: "New owner not found.",
            });
        }

        // Prevent transferring to the same owner
        if (
            existingLand.owner.toString() ===
            newOwner.toString()
        ) {
            return res.status(400).json({
                success: false,
                message: "New owner must be different from current owner.",
            });
        }

        // Check if there is already a pending transfer
        const pendingTransfer = await OwnershipTransfer.findOne({
            land,
            status: "Pending",
        });

        if (pendingTransfer) {
            return res.status(400).json({
                success: false,
                message: "A transfer request is already pending for this land.",
            });
        }

        // Current logged-in user
        const requestedBy = req.user.id || req.user._id;

        // Create transfer request
        const transfer = await OwnershipTransfer.create({
            land,
            currentOwner: existingLand.owner,
            newOwner,
            requestedBy,
            reason,
        });

        // Populate response
        const populatedTransfer =
            await OwnershipTransfer.findById(transfer._id)
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
                );

        return res.status(201).json({
            success: true,
            message: "Ownership transfer request created successfully.",
            transfer: populatedTransfer,
        });

    } catch (error) {
        console.error(
            "Create Transfer Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



// GET ALL TRANSFER REQUESTS
export const getAllTransferRequests = async (req, res) => {
    try {
        const transfers =
            await OwnershipTransfer.find()
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
                )
                .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: transfers.length,
            transfers,
        });

    } catch (error) {
        console.error(
            "Get Transfer Requests Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// GET SINGLE TRANSFER REQUEST
export const getTransferById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid transfer ID.",
            });
        }

        const transfer =
            await OwnershipTransfer.findById(id)
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
        console.error(
            "Get Transfer Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// APPROVE OWNERSHIP TRANSFER
export const approveTransfer = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid transfer ID.",
            });
        }

        // Find transfer
        const transfer =
            await OwnershipTransfer.findById(id);

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: "Transfer request not found.",
            });
        }

        // Check status
        if (transfer.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: `Transfer request is already ${transfer.status}.`,
            });
        }

        // Find land
        const land =
            await Land.findById(transfer.land);

        if (!land) {
            return res.status(404).json({
                success: false,
                message: "Land not found.",
            });
        }

        // Make sure current owner is still the same
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

        // Logged-in admin/officer
        const approvedBy =
            req.user.id || req.user._id;

        // Update land owner
        land.owner = transfer.newOwner;

        await land.save();

        // Update transfer
        transfer.status = "Approved";
        transfer.approvedBy = approvedBy;
        transfer.transferDate = new Date();

        await transfer.save();

        // Populate response
        const populatedTransfer =
            await OwnershipTransfer.findById(
                transfer._id
            )
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

        return res.status(200).json({
            success: true,
            message:
                "Ownership transfer approved and land owner updated successfully.",
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



// REJECT OWNERSHIP TRANSFER
export const rejectTransfer = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid transfer ID.",
            });
        }

        if (!rejectionReason) {
            return res.status(400).json({
                success: false,
                message: "Rejection reason is required.",
            });
        }

        // Find transfer
        const transfer =
            await OwnershipTransfer.findById(id);

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: "Transfer request not found.",
            });
        }

        // Check status
        if (transfer.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: `Transfer request is already ${transfer.status}.`,
            });
        }

        // Admin / Officer
        const approvedBy =
            req.user.id || req.user._id;

        transfer.status = "Rejected";
        transfer.approvedBy = approvedBy;
        transfer.rejectionReason = rejectionReason;
        transfer.transferDate = new Date();

        await transfer.save();

        const populatedTransfer =
            await OwnershipTransfer.findById(
                transfer._id
            )
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

        return res.status(200).json({
            success: true,
            message: "Ownership transfer rejected successfully.",
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