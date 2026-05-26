"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessageSeenBy = exports.recordMessageSeen = exports.ensureMessageReceiptsTable = void 0;
const db_1 = require("../../db");
let ensuredReceiptsTable = false;
let receiptsUnavailable = false;
const ensureMessageReceiptsTable = async () => {
    if (ensuredReceiptsTable || receiptsUnavailable)
        return;
    if (!db_1.isDirectDbEnabled) {
        receiptsUnavailable = true;
        console.warn(`Message receipts disabled: direct database connection is unavailable${db_1.directDbReason ? ` (${db_1.directDbReason})` : ""}`);
        return;
    }
    try {
        await db_1.pool.query(`
      CREATE TABLE IF NOT EXISTS message_read_receipts (
        message_id TEXT NOT NULL,
        viewer_username TEXT NOT NULL,
        seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (message_id, viewer_username)
      )
    `);
        await db_1.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message_id
      ON message_read_receipts (message_id)
    `);
        await db_1.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_message_read_receipts_viewer_username
      ON message_read_receipts (viewer_username)
    `);
        ensuredReceiptsTable = true;
    }
    catch (error) {
        receiptsUnavailable = true;
        console.error("❌ Message receipts table unavailable:", error);
    }
};
exports.ensureMessageReceiptsTable = ensureMessageReceiptsTable;
const recordMessageSeen = async (messageIds, viewerUsername) => {
    if (!viewerUsername || messageIds.length === 0)
        return;
    await (0, exports.ensureMessageReceiptsTable)();
    if (receiptsUnavailable)
        return;
    const uniqueMessageIds = [...new Set(messageIds.filter(Boolean))];
    if (uniqueMessageIds.length === 0)
        return;
    const values = [];
    const params = [];
    uniqueMessageIds.forEach((messageId, index) => {
        const offset = index * 2;
        values.push(`($${offset + 1}, $${offset + 2}, NOW())`);
        params.push(messageId, viewerUsername);
    });
    try {
        await db_1.pool.query(`
        INSERT INTO message_read_receipts (message_id, viewer_username, seen_at)
        VALUES ${values.join(", ")}
        ON CONFLICT (message_id, viewer_username)
        DO UPDATE SET seen_at = EXCLUDED.seen_at
      `, params);
    }
    catch (error) {
        receiptsUnavailable = true;
        console.error("❌ Failed to store message receipt:", error);
    }
};
exports.recordMessageSeen = recordMessageSeen;
const getMessageSeenBy = async (messageId) => {
    await (0, exports.ensureMessageReceiptsTable)();
    if (receiptsUnavailable)
        return [];
    try {
        const result = await db_1.pool.query(`
        SELECT
          receipts.viewer_username,
          receipts.seen_at,
          users.display_name,
          users.profile_picture
        FROM message_read_receipts AS receipts
        LEFT JOIN chat_users AS users
          ON users.username = receipts.viewer_username
        WHERE receipts.message_id = $1
        ORDER BY receipts.seen_at ASC
      `, [messageId]);
        return result.rows;
    }
    catch (error) {
        receiptsUnavailable = true;
        console.error("❌ Failed to fetch message receipts:", error);
        return [];
    }
};
exports.getMessageSeenBy = getMessageSeenBy;
//# sourceMappingURL=message-receipts.service.js.map