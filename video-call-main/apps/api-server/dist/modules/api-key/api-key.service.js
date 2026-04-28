"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeApiKey = exports.listApiKeys = exports.validateApiKey = exports.createApiKey = exports.ensureApiKeyTable = void 0;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../../db");
const hashApiKey = (rawKey) => {
    return crypto_1.default.createHash("sha256").update(rawKey).digest("hex");
};
const generateRawApiKey = () => {
    return `zk_${crypto_1.default.randomBytes(24).toString("hex")}`;
};
const ensureApiKeyTable = async () => {
    await db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      key_prefix TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_by TEXT NULL,
      expires_at TIMESTAMPTZ NULL,
      last_used_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
    await db_1.pool.query("CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys (is_active)");
};
exports.ensureApiKeyTable = ensureApiKeyTable;
const createApiKey = async ({ name, createdBy, expiresInDays, }) => {
    const rawKey = generateRawApiKey();
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = rawKey.slice(0, 12);
    const expiresAt = typeof expiresInDays === "number" && expiresInDays > 0
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;
    const result = await db_1.pool.query(`
      INSERT INTO api_keys (name, key_hash, key_prefix, created_by, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, key_prefix, created_by, is_active, expires_at, created_at
    `, [name, keyHash, keyPrefix, createdBy || null, expiresAt]);
    return {
        apiKey: rawKey,
        key: result.rows[0],
    };
};
exports.createApiKey = createApiKey;
const validateApiKey = async (rawKey) => {
    const keyHash = hashApiKey(rawKey);
    const result = await db_1.pool.query(`
      SELECT id, name, key_prefix, is_active, created_by, expires_at
      FROM api_keys
      WHERE key_hash = $1
        AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    `, [keyHash]);
    const key = result.rows[0];
    if (!key) {
        return null;
    }
    await db_1.pool.query("UPDATE api_keys SET last_used_at = NOW() WHERE id = $1", [
        key.id,
    ]);
    return key;
};
exports.validateApiKey = validateApiKey;
const listApiKeys = async () => {
    const result = await db_1.pool.query(`
    SELECT id, name, key_prefix, is_active, created_by, expires_at, last_used_at, created_at
    FROM api_keys
    ORDER BY created_at DESC
  `);
    return result.rows;
};
exports.listApiKeys = listApiKeys;
const revokeApiKey = async (id) => {
    const result = await db_1.pool.query(`
      UPDATE api_keys
      SET is_active = FALSE
      WHERE id = $1
      RETURNING id, name, key_prefix, is_active, expires_at
    `, [id]);
    return result.rows[0] || null;
};
exports.revokeApiKey = revokeApiKey;
//# sourceMappingURL=api-key.service.js.map