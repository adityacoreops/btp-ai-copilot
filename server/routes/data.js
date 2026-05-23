import express from "express";
import { queryEntity } from "../services/odata-data.js";

const router = express.Router();

router.get("/query", async (req, res) => {
  const { serviceUrl, entitySet, top, skip, filter, orderBy, select } = req.query;

  if (!serviceUrl || !entitySet) {
    return res.status(400).json({ success: false, error: "serviceUrl and entitySet queries are required" });
  }

  try {
    const results = await queryEntity({
      serviceUrl,
      entitySet,
      top: top ? parseInt(top) : 20,
      skip: skip ? parseInt(skip) : 0,
      filter,
      orderBy,
      select
    });

    res.json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;