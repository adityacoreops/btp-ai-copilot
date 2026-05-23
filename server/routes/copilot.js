import express from "express";
import { askAI } from "../services/ai-engine.js";
import { buildAIContext } from "../services/context-builder.js";
import { queryEntity } from "../services/odata-data.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
  const { prompt, serviceUrl, serviceName, entitySetName, schema } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, error: "Prompt is required" });
  }

  try {
    let sampleData = [];
    if (serviceUrl && entitySetName) {
      try {
        sampleData = await queryEntity({
          serviceUrl,
          entitySet: entitySetName,
          top: 10
        });
      } catch (err) {
        console.warn(`Querying sample records skipped: ${err.message}`);
      }
    }

    const systemPrompt = buildAIContext({
      serviceName: serviceName || "Catalog Context",
      entitySetName: entitySetName || "Root",
      schema,
      sampleData
    });

    const completion = await askAI({ systemPrompt, userPrompt: prompt });

    res.json({
      success: true,
      response: completion.content,
      usage: completion.usage
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;