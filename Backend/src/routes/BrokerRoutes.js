import express from "express";

import { getBrokerLands, getBrokerContacts, saveBrokerContact, deleteBrokerContact,} from "../controllers/BrokerController.js";

import {verifyToken} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
    "/lands",
    verifyToken,
    getBrokerLands
);

router.get(
    "/contacts",
    verifyToken,
    getBrokerContacts
);

router.post(
    "/contacts",
    verifyToken,
    saveBrokerContact
);

router.delete(
    "/contacts/:contactId",
    verifyToken,
    deleteBrokerContact
);

export default router;