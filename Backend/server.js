import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./src/config/db.js";

import userRoutes from "./src/routes/UserRoutes.js";
import landRoutes from "./src/routes/LandRoutes.js";
import ownershipRoutes from "./src/routes/OwnershipRoutes.js";
import documentRoutes from "./src/routes/DocumentRoutes.js";
import dashboardRoutes from "./src/routes/DashboardRoutes.js";

dotenv.config();

// Connect MongoDB
connectDB();

const app = express();

// MIDDLEWARE

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ROUTES

app.use("/api/users", userRoutes);
app.use("/api/lands", landRoutes);
app.use("/api/ownership-transfers",ownershipRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/dashboard", dashboardRoutes);

// HOME ROUTE

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Land Management API Running...",
    });
});

// ERROR HANDLER

app.use((err, req, res, next) => {
    console.error("========== ERROR ==========");
    console.error(err);

    res.status(500).json({
        success: false,
        message: err?.message || "Internal Server Error",
    });
});

// SERVER

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
});