import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import servicesRoutes from "./routes/services.js";
import metadataRoutes from "./routes/metadata.js";
import dataRoutes from "./routes/data.js";
import copilotRoutes from "./routes/copilot.js";

// Force override system-level environment variables injected by SAP BAS
dotenv.config({ override: true });

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/services", servicesRoutes);
app.use("/api/metadata", metadataRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/copilot", copilotRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "S/4HANA AI Copilot Server Running"
  });
});

// Default fallback to 5001 if the .env config is not detected
const PORT = process.env.PORT || 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Express Backend is successfully listening on: http://127.0.0.1:${PORT}`);
});