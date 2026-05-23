import { OrchestrationClient } from "@sap-ai-sdk/orchestration";
import dotenv from "dotenv";

dotenv.config();

let client = null;

try {
  // Checks environment properties to initialize the orchestration client
  if (process.env.AICORE_SERVICE_KEY) {
    client = new OrchestrationClient({
      promptTemplating: {
        model: {
          name: process.env.AI_MODEL_NAME || "gpt-4o"
        }
      }
    });
  } else {
    console.warn("AI SDK Local Warm Warning: AICORE_SERVICE_KEY environment variable is empty. AI features will require it.");
  }
} catch (error) {
  console.error("SAP AI Core orchestration client init failed:", error.message);
}

export async function askAI({ systemPrompt, userPrompt }) {
  if (!client) {
    throw new Error("SAP AI SDK Orchestration Client is not initialized. Please verify your AICORE_SERVICE_KEY config.");
  }

  try {
    const response = await client.chatCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    return {
      content: response.getContent(),
      usage: response.getTokenUsage()
    };
  } catch (error) {
    console.error("AI chat generation error:", error.message);
    throw error;
  }
}