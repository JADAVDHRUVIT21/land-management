import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/config/db.js";
import userRoutes from "./src/routes/UserRoutes.js";
import landRoutes from "./src/routes/LandRoutes.js";
import ownershipRoutes from "./src/routes/OwnershipRoutes.js";
import documentRoutes from "./src/routes/DocumentRoutes.js";

dotenv.config();

connectDB();

const app = express();


// Middleware

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes

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


// Home Route

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

// Error Handler
// This should be AFTER all routes

app.use((err, req, res, next) => {

    console.log("========== ERROR ==========");

    console.dir(err, {
        depth: null,
    });

    console.log(
        "Error message:",
        err?.message
    );

    res.status(
        err.status || 500
    ).json({
        success: false,
        message:
            err?.message ||
            "Internal Server Error",
    });
});


// Server

const PORT =
    process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `Server Running on Port ${PORT}`
    );

});