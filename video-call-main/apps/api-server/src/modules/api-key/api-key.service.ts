import crypto from "crypto";
import { pool } from "../../db";

export interface CreateApiKeyInput {
  name: string;
  createdBy?: string;
  expiresInDays?: number;
}

const hashApiKey = (rawKey: string) => {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
};

const generateRawApiKey = () => {
  return `zk_${crypto.randomBytes(24).toString("hex")}`;
};

export const ensureApiKeyTable = async () => {
  await pool.query(`
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

  await pool.query(
    "CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys (is_active)"
  );
};

export const createApiKey = async ({
  name,
  createdBy,
  expiresInDays,
}: CreateApiKeyInput) => {
  const rawKey = generateRawApiKey();
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(0, 12);
  const expiresAt =
    typeof expiresInDays === "number" && expiresInDays > 0
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

  const result = await pool.query(
    `
      INSERT INTO api_keys (name, key_hash, key_prefix, created_by, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, key_prefix, created_by, is_active, expires_at, created_at
    `,
    [name, keyHash, keyPrefix, createdBy || null, expiresAt]
  );

  return {
    apiKey: rawKey,
    key: result.rows[0],
  };
};

export const validateApiKey = async (rawKey: string) => {
  const keyHash = hashApiKey(rawKey);

  const result = await pool.query(
    `
      SELECT id, name, key_prefix, is_active, created_by, expires_at
      FROM api_keys
      WHERE key_hash = $1
        AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    `,
    [keyHash]
  );

  const key = result.rows[0];
  if (!key) {
    return null;
  }

  await pool.query("UPDATE api_keys SET last_used_at = NOW() WHERE id = $1", [
    key.id,
  ]);

  return key;
};

export const listApiKeys = async () => {
  const result = await pool.query(`
    SELECT id, name, key_prefix, is_active, created_by, expires_at, last_used_at, created_at
    FROM api_keys
    ORDER BY created_at DESC
  `);

  return result.rows;
};

export const revokeApiKey = async (id: number) => {
  const result = await pool.query(
    `
      UPDATE api_keys
      SET is_active = FALSE
      WHERE id = $1
      RETURNING id, name, key_prefix, is_active, expires_at
    `,
    [id]
  );

  return result.rows[0] || null;
};
