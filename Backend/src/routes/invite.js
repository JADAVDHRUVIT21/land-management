import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.post("/invite/sms", async (req, res) => {
    const { phone } = req.body;
    const normalized = String(phone || "").replace(/\D/g, "").slice(-10);

    if (normalized.length !== 10) {
        return res.status(400).json({ message: "Invalid phone number" });
    }

    try {
        const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
            method: "POST",
            headers: {
                authorization: process.env.FAST2SMS_API_KEY,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                route: "q",
                message:
                    "Join me on LandManage to buy, sell and manage land. Register: https://landmanage.app",
                language: "english",
                flash: 0,
                numbers: normalized,
            }),
        });

        const data = await response.json();

        if (!response.ok || data.return === false) {
            return res.status(500).json({
                message: data.message?.[0] || "SMS provider rejected the request",
            });
        }

        return res.json({ success: true });
    } catch (err) {
        console.error("SMS SEND ERROR:", err);
        return res.status(500).json({ message: "Failed to send SMS" });
    }
});

export default router;