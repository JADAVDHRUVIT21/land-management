import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./src/config/db.js";
import userRoutes from "./src/routes/userRoutes.js";
import landRoutes from "./src/routes/landRoutes.js";
import ownershipRoutes from "./src/routes/ownershipRoutes.js";
import documentRoutes from "./src/routes/documentRoutes.js";
import dashboardRoutes from "./src/routes/DashboardRoutes.js";

dotenv.config();

connectDB();

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ROUTES
app.use("/api/users", userRoutes);
app.use("/api/lands", landRoutes);
app.use(
    "/api/ownership-transfers",
    ownershipRoutes
);
app.use(
    "/api/documents",
    documentRoutes
);
app.use(
    "/api/dashboard",
    dashboardRoutes
);

// HOME ROUTE
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Land Management API Running...",
    });
});

// 404 ROUTE
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

// ERROR HANDLER
app.use((err, req, res, next) => {

    console.error("========== ERROR ==========");
    console.error("Error message:", err?.message);
    console.error("Error name:", err?.name);
    console.error("Error stack:", err?.stack);

    res.status(err.status || 500).json({
        success: false,
        message: err?.message || "Internal Server Error",
    });
});

// START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
});