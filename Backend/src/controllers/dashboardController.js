import User from "../models/UserModels.js";
import Land from "../models/LandModel.js";

const getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, totalLands, landsForSale] = await Promise.all([
            User.countDocuments(),

            Land.countDocuments(),

            Land.countDocuments({
                isForSale: true,
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

export { getDashboardStats };