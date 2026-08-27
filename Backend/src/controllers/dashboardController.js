import User from "../models/UserModels.js";
import Land from "../models/LandModel.js";
import Document from "../models/DocumentModel.js";
import OwnershipTransfer from "../models/OwnershipTransfer.js";

export const getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalLands,
            landsForSale,
            totalDocuments,
            pendingDocuments,
            approvedDocuments,
            rejectedDocuments,
            totalTransfers,
            pendingTransfers,
            approvedTransfers,
            rejectedTransfers,
        ] = await Promise.all([
            User.countDocuments(),

            Land.countDocuments(),

            Land.countDocuments({
                isForSale: true,
            }),

            Document.countDocuments(),

            Document.countDocuments({
                status: "Pending",
            }),

            Document.countDocuments({
                status: "Approved",
            }),

            Document.countDocuments({
                status: "Rejected",
            }),

            OwnershipTransfer.countDocuments(),

            OwnershipTransfer.countDocuments({
                status: "Pending",
            }),

            OwnershipTransfer.countDocuments({
                status: "Approved",
            }),

            OwnershipTransfer.countDocuments({
                status: "Rejected",
            }),
        ]);

        return res.status(200).json({
            success: true,

            statistics: {
                users: {
                    total: totalUsers,
                },

                lands: {
                    total: totalLands,
                    forSale: landsForSale,
                },

                documents: {
                    total: totalDocuments,
                    pending: pendingDocuments,
                    approved: approvedDocuments,
                    rejected: rejectedDocuments,
                },

                ownershipTransfers: {
                    total: totalTransfers,
                    pending: pendingTransfers,
                    approved: approvedTransfers,
                    rejected: rejectedTransfers,
                },
            },
        });

    } catch (error) {
        console.error(
            "Dashboard Stats Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};