import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./src/config/db.js";
import userRoutes from "./src/routes/userRoutes.js";
import landRoutes from "./src/routes/landRoutes.js";
import ownershipRoutes from "./src/routes/ownershipRoutes.js";

dotenv.config();

connectDB();

const app = express();


// Middleware
app.use((err, req, res, next) => {
    console.log("Error middleware start")
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
    }
    console.log("Error middleware end")
    next(err);
});
app.use(cors());
app.use(express.json());


// Routes
app.use("/api/users", userRoutes);

app.use("/api/lands", landRoutes);
app.use("/api/ownership", ownershipRoutes);


app.get("/", (req, res) => {
    res.send("Land Management API Running...");
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
});