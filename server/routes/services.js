import express from "express";
import { discoverServices } from "../services/odata-discovery.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const services = await discoverServices();
    res.json({
      success: true,
      count: services.length,
      services
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;