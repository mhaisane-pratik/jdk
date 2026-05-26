"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.directDbReason = exports.isDirectDbEnabled = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const rawDatabaseUrl = process.env.DATABASE_URL?.trim().replace(/^"(.*)"$/, "$1");
const directDbDisabledByEnv = process.env.DISABLE_DIRECT_DB === "true";
exports.isDirectDbEnabled = Boolean(rawDatabaseUrl) && !directDbDisabledByEnv;
exports.directDbReason = !rawDatabaseUrl
    ? "DATABASE_URL is not configured"
    : directDbDisabledByEnv
        ? "DISABLE_DIRECT_DB=true"
        : null;
const disabledPool = {
    query: async () => {
        throw new Error(`Direct Postgres connection is disabled${exports.directDbReason ? `: ${exports.directDbReason}` : ""}`);
    },
    end: async () => undefined,
};
exports.pool = exports.isDirectDbEnabled
    ? new pg_1.Pool({
        connectionString: rawDatabaseUrl,
        ssl: { rejectUnauthorized: false },
    })
    : disabledPool;
//# sourceMappingURL=db.js.map