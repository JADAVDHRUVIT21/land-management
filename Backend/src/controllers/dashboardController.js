import mongoose from "mongoose";
import User from "../models/UserModels.js";
import Land from "../models/LandModel.js";
import SupportTicket from "../models/SupportTicketModel.js";
import ChatMessage from "../models/ChatMessageModel.js";

/* ------------------------------------------------------------------ */
/*  GET DASHBOARD STATS (existing — user dashboard)                    */
/* ------------------------------------------------------------------ */

const getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, totalLands, landsForSale] = await Promise.all([
            User.countDocuments(),
            Land.countDocuments(),
            Land.countDocuments({ isForSale: true }),
        ]);

        return res.status(200).json({
            success: true,
            statistics: {
                users: { total: totalUsers },
                lands: { total: totalLands, forSale: landsForSale },
            },
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch dashboard statistics.",
        });
    }
};

/* ================================================================== */
/*  ADMIN ENDPOINTS                                                   */
/* ================================================================== */

/* ------------------------------------------------------------------ */
/*  ADMIN STATS — top-level numbers for the admin dashboard            */
/* ------------------------------------------------------------------ */

const getAdminStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(
            now.getTime() - 30 * 24 * 60 * 60 * 1000,
        );

        const [
            totalUsers,
            newUsersThisMonth,
            newUsersLast7Days,
            totalLands,
            listedLands,
            forSaleLands,
            forRentLands,
            landsAddedThisMonth,
            totalTickets,
            openTickets,
            totalMessages,
            totalAdmins,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ createdAt: { $gte: startOfMonth } }),
            User.countDocuments({ createdAt: { $gte: last7Days } }),
            Land.countDocuments(),
            Land.countDocuments({ isForSale: true }),
            Land.countDocuments({ listingType: "For Sale" }),
            Land.countDocuments({ listingType: "For Rent" }),
            Land.countDocuments({ createdAt: { $gte: startOfMonth } }),
            SupportTicket.countDocuments(),
            SupportTicket.countDocuments({ status: "Open" }),
            ChatMessage.countDocuments(),
            User.countDocuments({ role: "admin" }),
        ]);

        /* Land type breakdown (Residential / Agricultural / etc.) */
        const landTypeBreakdown = await Land.aggregate([
            { $group: { _id: "$landType", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        return res.status(200).json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    newThisMonth: newUsersThisMonth,
                    newLast7Days: newUsersLast7Days,
                    admins: totalAdmins,
                },
                lands: {
                    total: totalLands,
                    listed: listedLands,
                    forSale: forSaleLands,
                    forRent: forRentLands,
                    addedThisMonth: landsAddedThisMonth,
                    byType: landTypeBreakdown.map((row) => ({
                        type: row._id || "Unknown",
                        count: row.count,
                    })),
                },
                tickets: {
                    total: totalTickets,
                    open: openTickets,
                },
                messages: {
                    total: totalMessages,
                },
            },
        });
    } catch (error) {
        console.error("Admin Stats Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch admin statistics.",
        });
    }
};

/* ------------------------------------------------------------------ */
/*  ADMIN RECENT USERS — latest signups                                */
/* ------------------------------------------------------------------ */

const getAdminRecentUsers = async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 8, 50);

        const users = await User.find()
            .select("fullName email phone role avatar createdAt")
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error("Admin Recent Users Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch recent users.",
        });
    }
};

/* ------------------------------------------------------------------ */
/*  ADMIN RECENT LANDS — latest property listings                      */
/* ------------------------------------------------------------------ */

const getAdminRecentLands = async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 8, 50);

        const lands = await Land.find()
            .populate("owner", "fullName email phone avatar")
            .select(
                "surveyNumber village district state landType listingType price isForSale createdAt image",
            )
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        /* Normalize the image field for the frontend */
        const normalized = lands.map((land) => ({
            ...land,
            image:
                Array.isArray(land.image) && land.image.length > 0
                    ? land.image[0]?.url || null
                    : null,
        }));

        return res.status(200).json({
            success: true,
            count: normalized.length,
            lands: normalized,
        });
    } catch (error) {
        console.error("Admin Recent Lands Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch recent lands.",
        });
    }
};

/* ------------------------------------------------------------------ */
/*  ADMIN CHARTS — time-series data for dashboard charts               */
/* ------------------------------------------------------------------ */

const getAdminCharts = async (req, res) => {
    try {
        const days = Math.min(Number(req.query.days) || 30, 90);
        const now = new Date();
        const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        /* User signups per day */
        const usersPerDay = await User.aggregate([
            { $match: { createdAt: { $gte: from } } },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt",
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        /* Lands added per day */
        const landsPerDay = await Land.aggregate([
            { $match: { createdAt: { $gte: from } } },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt",
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        /* Build a full date range so the chart doesn't skip empty days */
        const buildSeries = (rows) => {
            const map = new Map(rows.map((r) => [r._id, r.count]));
            const series = [];
            for (let i = 0; i < days; i++) {
                const d = new Date(from);
                d.setDate(d.getDate() + i);
                const key = d.toISOString().slice(0, 10);
                series.push({
                    date: key,
                    count: map.get(key) || 0,
                });
            }
            return series;
        };

        return res.status(200).json({
            success: true,
            days,
            users: buildSeries(usersPerDay),
            lands: buildSeries(landsPerDay),
        });
    } catch (error) {
        console.error("Admin Charts Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch chart data.",
        });
    }
};

/* ------------------------------------------------------------------ */
/*  ADMIN USERS LIST — paginated + searchable                          */
/* ------------------------------------------------------------------ */

const getAdminUsers = async (req, res) => {
    try {
        const {
            search = "",
            role = "",
            page = 1,
            limit = 20,
        } = req.query;

        const filter = {};

        if (search.trim()) {
            const q = search.trim();
            filter.$or = [
                { fullName: { $regex: q, $options: "i" } },
                { email: { $regex: q, $options: "i" } },
                { phone: { $regex: q, $options: "i" } },
            ];
        }

        if (role && ["admin", "user"].includes(role)) {
            filter.role = role;
        }

        const pageNumber = Math.max(Number(page) || 1, 1);
        const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
        const skip = (pageNumber - 1) * limitNumber;

        const [total, users] = await Promise.all([
            User.countDocuments(filter),
            User.find(filter)
                .select(
                    "fullName email phone role avatar createdAt coverImage",
                )
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber)
                .lean(),
        ]);

        return res.status(200).json({
            success: true,
            count: users.length,
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
            users,
        });
    } catch (error) {
        console.error("Admin Users List Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch users.",
        });
    }
};

/* ------------------------------------------------------------------ */
/*  ADMIN — GET SINGLE USER DETAIL                                     */
/* ------------------------------------------------------------------ */

const getAdminUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID.",
            });
        }

        const user = await User.findById(id)
            .select("-password -resetOtp -resetOtpExpiry")
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        /* Extra counts for this user */
        const [landCount, listedCount, messageCount] = await Promise.all([
            Land.countDocuments({ owner: id }),
            Land.countDocuments({ owner: id, isForSale: true }),
            ChatMessage.countDocuments({
                $or: [{ sender: id }, { receiver: id }],
            }),
        ]);

        return res.status(200).json({
            success: true,
            user,
            stats: {
                lands: landCount,
                listed: listedCount,
                messages: messageCount,
            },
        });
    } catch (error) {
        console.error("Admin User Detail Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch user.",
        });
    }
};

/* ------------------------------------------------------------------ */
/*  ADMIN — TOGGLE USER ROLE (user ↔ admin)                            */
/* ------------------------------------------------------------------ */

const toggleUserRole = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID.",
            });
        }

        /* Prevent admin from demoting themselves */
        const adminId = req.user?.id || req.user?._id;
        if (String(id) === String(adminId)) {
            return res.status(400).json({
                success: false,
                message: "You cannot change your own role.",
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        user.role = user.role === "admin" ? "user" : "admin";
        await user.save();

        return res.status(200).json({
            success: true,
            message: `User is now ${user.role}.`,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Toggle User Role Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update role.",
        });
    }
};

export {
    getDashboardStats,
    getAdminStats,
    getAdminRecentUsers,
    getAdminRecentLands,
    getAdminCharts,
    getAdminUsers,
    getAdminUserById,
    toggleUserRole,
};