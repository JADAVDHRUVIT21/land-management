import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js";
import userRoutes from "./src/routes/userRoutes.js";
import landRoutes from "./src/routes/landRoutes.js";


dotenv.config();

connectDB();

const app = express();


// Middleware
app.use(cors());
app.use(express.json());   


// Routes
app.use("/api/users", userRoutes);

app.use("/api/lands", landRoutes);


app.get("/", (req, res) => {
    res.send("Land Management API Running...");
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server Running on Port ${PORT}`);
});