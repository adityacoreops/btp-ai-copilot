import express from "express";
import { fetchMetadata, parseAndExtractMetadata } from "../services/odata-metadata.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { servicePath } = req.query;
  if (!servicePath) {
    return res.status(400).json({ success: false, error: "servicePath query is required" });
  }

  try {
    const xml = await fetchMetadata(servicePath);
    const extracted = parseAndExtractMetadata(xml);
    res.json({
      success: true,
      metadata: extracted
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;