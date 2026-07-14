import { supabase } from "../../config/supabase";

export interface MessageReceiptRow {
  viewer_username: string;
  seen_at: string;
  display_name: string | null;
  profile_picture: string | null;
}

export const ensureMessageReceiptsTable = async () => {
  // Table is created/ensured via Supabase SQL Editor
};

export const recordMessageSeen = async (messageIds: string[], viewerUsername: string) => {
  if (!viewerUsername || messageIds.length === 0) return;

  const uniqueMessageIds = [...new Set(messageIds.filter(Boolean))];
  if (uniqueMessageIds.length === 0) return;

  const rows = uniqueMessageIds.map((messageId) => ({
    message_id: messageId,
    viewer_username: viewerUsername,
    seen_at: new Date().toISOString(),
  }));

  try {
    const { error } = await supabase
      .from("message_read_receipts")
      .upsert(rows, { onConflict: "message_id,viewer_username" });

    if (error) {
      console.error("❌ Failed to store message receipt:", error.message);
    }
  } catch (error) {
    console.error("❌ Failed to store message receipt:", error);
  }
};

export const getMessageSeenBy = async (messageId: string): Promise<MessageReceiptRow[]> => {
  try {
    const { data, error } = await supabase
      .from("message_read_receipts")
      .select(`
        viewer_username,
        seen_at,
        users:chat_users(display_name, profile_picture)
      `)
      .eq("message_id", messageId)
      .order("seen_at", { ascending: true });

    if (error) {
      console.error("❌ Failed to fetch message receipts:", error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      viewer_username: row.viewer_username,
      seen_at: row.seen_at,
      display_name: row.users?.display_name || null,
      profile_picture: row.users?.profile_picture || null,
    }));
  } catch (error) {
    console.error("❌ Failed to fetch message receipts:", error);
    return [];
  }
};
