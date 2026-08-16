import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { estimatePhoto } from "./server/estimatePhoto.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, "dist");
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json({ limit: "30mb" }));
app.use(express.static(DIST_DIR));

app.post("/api/estimate-photo", async (req, res) => {
  const result = await estimatePhoto(req.body);
  res.status(result.status).json(result.body);
});

app.listen(PORT, () => {
  console.log(`Contractor Estimate app running at http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("Warning: ANTHROPIC_API_KEY is not set. AI photo estimates will fail until it is configured.");
  }
  if (!fs.existsSync(DIST_DIR)) {
    console.warn('Warning: no "dist" build found. Run `npm run build` first, or use `npm run dev` for local development.');
  }
});
