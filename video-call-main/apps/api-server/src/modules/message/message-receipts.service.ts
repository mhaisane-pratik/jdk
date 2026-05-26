import { directDbReason, isDirectDbEnabled, pool } from "../../db";

export interface MessageReceiptRow {
  viewer_username: string;
  seen_at: string;
  display_name: string | null;
  profile_picture: string | null;
}

let ensuredReceiptsTable = false;
let receiptsUnavailable = false;

export const ensureMessageReceiptsTable = async () => {
  if (ensuredReceiptsTable || receiptsUnavailable) return;
  if (!isDirectDbEnabled) {
    receiptsUnavailable = true;
    console.warn(
      `Message receipts disabled: direct database connection is unavailable${directDbReason ? ` (${directDbReason})` : ""}`
    );
    return;
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS message_read_receipts (
        message_id TEXT NOT NULL,
        viewer_username TEXT NOT NULL,
        seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (message_id, viewer_username)
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message_id
      ON message_read_receipts (message_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_message_read_receipts_viewer_username
      ON message_read_receipts (viewer_username)
    `);

    ensuredReceiptsTable = true;
  } catch (error) {
    receiptsUnavailable = true;
    console.error("❌ Message receipts table unavailable:", error);
  }
};

export const recordMessageSeen = async (messageIds: string[], viewerUsername: string) => {
  if (!viewerUsername || messageIds.length === 0) return;

  await ensureMessageReceiptsTable();
  if (receiptsUnavailable) return;

  const uniqueMessageIds = [...new Set(messageIds.filter(Boolean))];
  if (uniqueMessageIds.length === 0) return;

  const values: string[] = [];
  const params: string[] = [];

  uniqueMessageIds.forEach((messageId, index) => {
    const offset = index * 2;
    values.push(`($${offset + 1}, $${offset + 2}, NOW())`);
    params.push(messageId, viewerUsername);
  });

  try {
    await pool.query(
      `
        INSERT INTO message_read_receipts (message_id, viewer_username, seen_at)
        VALUES ${values.join(", ")}
        ON CONFLICT (message_id, viewer_username)
        DO UPDATE SET seen_at = EXCLUDED.seen_at
      `,
      params
    );
  } catch (error) {
    receiptsUnavailable = true;
    console.error("❌ Failed to store message receipt:", error);
  }
};

export const getMessageSeenBy = async (messageId: string): Promise<MessageReceiptRow[]> => {
  await ensureMessageReceiptsTable();
  if (receiptsUnavailable) return [];

  try {
    const result = await pool.query<MessageReceiptRow>(
      `
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
      `,
      [messageId]
    );

    return result.rows;
  } catch (error) {
    receiptsUnavailable = true;
    console.error("❌ Failed to fetch message receipts:", error);
    return [];
  }
};
