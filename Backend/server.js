import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./src/config/db.js";
import userRoutes from "./src/routes/userRoutes.js";
import landRoutes from "./src/routes/landRoutes.js";
import ownershipRoutes from "./src/routes/ownershipRoutes.js";
import documentRoutes from "./src/routes/documentRoutes.js";
dotenv.config();

connectDB();

const app = express();


// Middleware
app.use((err, req, res, next) => {
    console.log("========== ERROR ==========");
    console.dir(err, { depth: null });

    console.log("Error message:", err?.message);
    console.log("Error name:", err?.name);
    console.log("Error stack:", err?.stack);

    res.status(500).json({
        success: false,
        message: err?.message || "Upload failed",
        error: err
    });
});
app.use(cors());
app.use(express.json());


// Routes
app.use("/api/users", userRoutes);

app.use("/api/lands", landRoutes);
app.use("/api/ownership-transfers", ownershipRoutes);
app.use("/api/documents", documentRoutes);

app.get("/", (req, res) => {
    res.send("Land Management API Running...");
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
});