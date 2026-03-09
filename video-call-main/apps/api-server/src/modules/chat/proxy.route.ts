import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/proxy-image", async (req, res) => {
  try {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL required" });
    }

    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });

    res.set("Content-Type", response.headers["content-type"]);
    res.send(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch image" });
  }
});

export default router;