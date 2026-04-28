"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireApiKeyAdminSecret = exports.apiKeyAuthMiddleware = void 0;
const api_key_service_1 = require("../modules/api-key/api-key.service");
const extractApiKey = (req) => {
    const headerKey = req.header("x-api-key");
    if (headerKey) {
        return headerKey.trim();
    }
    const authHeader = req.header("authorization") || "";
    if (authHeader.toLowerCase().startsWith("apikey ")) {
        return authHeader.slice(7).trim();
    }
    return null;
};
const apiKeyAuthMiddleware = async (req, res, next) => {
    const requireApiKey = process.env.REQUIRE_API_KEY === "true";
    if (!requireApiKey) {
        return next();
    }
    const apiKey = extractApiKey(req);
    if (!apiKey) {
        return res.status(401).json({
            error: "Missing API key",
            message: "Provide x-api-key header or Authorization: ApiKey <key>",
        });
    }
    try {
        const keyInfo = await (0, api_key_service_1.validateApiKey)(apiKey);
        if (!keyInfo) {
            return res.status(401).json({ error: "Invalid or expired API key" });
        }
        req.apiClient = {
            id: keyInfo.id,
            name: keyInfo.name,
            keyPrefix: keyInfo.key_prefix,
            createdBy: keyInfo.created_by,
        };
        next();
    }
    catch (error) {
        console.error("API key validation failed:", error);
        return res.status(500).json({ error: "Failed to validate API key" });
    }
};
exports.apiKeyAuthMiddleware = apiKeyAuthMiddleware;
const requireApiKeyAdminSecret = (req, res, next) => {
    const expectedSecret = process.env.API_KEY_ADMIN_SECRET;
    if (!expectedSecret) {
        return res.status(500).json({
            error: "API key admin secret is not configured",
            message: "Set API_KEY_ADMIN_SECRET in environment",
        });
    }
    const providedSecret = req.header("x-admin-secret");
    if (!providedSecret || providedSecret !== expectedSecret) {
        return res.status(403).json({ error: "Forbidden" });
    }
    next();
};
exports.requireApiKeyAdminSecret = requireApiKeyAdminSecret;
//# sourceMappingURL=api-key.middleware.js.map