import { Router } from "express";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
} from "./api-key.service";
import { requireApiKeyAdminSecret } from "../../middleware/api-key.middleware";

const router = Router();

const requireOnboardSecret = (req: any, res: any, next: any) => {
  const expectedSecret = process.env.API_KEY_ONBOARD_SECRET;
  if (!expectedSecret) {
    return res.status(500).json({
      error: "Onboard secret is not configured",
      message: "Set API_KEY_ONBOARD_SECRET in environment",
    });
  }

  const provided = req.header("x-onboard-secret");
  if (!provided || provided !== expectedSecret) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
};

router.post("/onboard", requireOnboardSecret, async (req, res) => {
  try {
    const { clientName, createdBy, expiresInDays } = req.body || {};
    if (!clientName || typeof clientName !== "string") {
      return res.status(400).json({
        error: "Invalid request",
        message: "clientName is required",
      });
    }

    const generated = await createApiKey({
      name: clientName.trim(),
      createdBy:
        typeof createdBy === "string" ? createdBy.trim() : "integration-onboard",
      expiresInDays:
        typeof expiresInDays === "number" ? Math.floor(expiresInDays) : undefined,
    });

    const baseUrl =
      process.env.PUBLIC_API_BASE_URL ||
      `${req.protocol}://${req.get("host")}`;

    return res.status(201).json({
      success: true,
      onboarding: {
        clientName: clientName.trim(),
        baseUrl,
        authHeader: {
          name: "x-api-key",
          value: generated.apiKey,
        },
        endpoints: {
          health: `${baseUrl}/health`,
          users: `${baseUrl}/api/v1/users`,
          chats: `${baseUrl}/api/v1/chats`,
          messages: `${baseUrl}/api/v1/messages`,
        },
      },
      message:
        "API key onboarding complete. Save this key now; it will not be shown again.",
      key: generated.key,
    });
  } catch (error: any) {
    console.error("Failed to onboard integration:", error);
    return res.status(500).json({
      error: "Failed to onboard integration",
      details: error.message,
    });
  }
});

router.use(requireApiKeyAdminSecret);

router.post("/generate", async (req, res) => {
  try {
    const { name, createdBy, expiresInDays } = req.body || {};

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        error: "Invalid request",
        message: "name is required",
      });
    }

    const generated = await createApiKey({
      name: name.trim(),
      createdBy: typeof createdBy === "string" ? createdBy.trim() : undefined,
      expiresInDays:
        typeof expiresInDays === "number" ? Math.floor(expiresInDays) : undefined,
    });

    return res.status(201).json({
      success: true,
      message: "API key generated. Save it now; it will not be shown again.",
      apiKey: generated.apiKey,
      key: generated.key,
    });
  } catch (error: any) {
    console.error("Failed to generate API key:", error);
    return res.status(500).json({
      error: "Failed to generate API key",
      details: error.message,
    });
  }
});

router.get("/", async (_req, res) => {
  try {
    const keys = await listApiKeys();
    return res.json({ success: true, keys });
  } catch (error: any) {
    console.error("Failed to list API keys:", error);
    return res.status(500).json({
      error: "Failed to list API keys",
      details: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid key id" });
  }

  try {
    const revoked = await revokeApiKey(id);
    if (!revoked) {
      return res.status(404).json({ error: "API key not found" });
    }

    return res.json({ success: true, key: revoked });
  } catch (error: any) {
    console.error("Failed to revoke API key:", error);
    return res.status(500).json({
      error: "Failed to revoke API key",
      details: error.message,
    });
  }
});

export default router;
