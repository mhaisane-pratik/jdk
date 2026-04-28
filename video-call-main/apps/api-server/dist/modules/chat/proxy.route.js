"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
router.get("/proxy-image", async (req, res) => {
    try {
        const imageUrl = req.query.url;
        if (!imageUrl) {
            return res.status(400).json({ error: "Image URL required" });
        }
        const response = await axios_1.default.get(imageUrl, {
            responseType: "arraybuffer",
        });
        res.set("Content-Type", response.headers["content-type"]);
        res.send(response.data);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch image" });
    }
});
exports.default = router;
//# sourceMappingURL=proxy.route.js.map