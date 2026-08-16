import { estimatePhoto } from "../server/estimatePhoto.js";

// AI photo analysis (vision + several web searches) routinely takes well
// past Vercel's 10s default. 60 is the max Hobby-plan functions can request.
export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const result = await estimatePhoto(req.body);
  res.status(result.status).json(result.body);
}
