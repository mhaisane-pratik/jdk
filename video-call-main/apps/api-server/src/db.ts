import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const rawDatabaseUrl = process.env.DATABASE_URL?.trim().replace(/^"(.*)"$/, "$1");
const directDbDisabledByEnv = process.env.DISABLE_DIRECT_DB === "true";

export const isDirectDbEnabled = Boolean(rawDatabaseUrl) && !directDbDisabledByEnv;

export const directDbReason = !rawDatabaseUrl
  ? "DATABASE_URL is not configured"
  : directDbDisabledByEnv
    ? "DISABLE_DIRECT_DB=true"
    : null;

const disabledPool = {
  query: async () => {
    throw new Error(
      `Direct Postgres connection is disabled${directDbReason ? `: ${directDbReason}` : ""}`
    );
  },
  end: async () => undefined,
};

export const pool = isDirectDbEnabled
  ? new Pool({
      connectionString: rawDatabaseUrl,
      ssl: { rejectUnauthorized: false }, // required for Supabase
    })
  : disabledPool;
