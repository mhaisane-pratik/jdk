export interface MessageReceiptRow {
    viewer_username: string;
    seen_at: string;
    display_name: string | null;
    profile_picture: string | null;
}
export declare const ensureMessageReceiptsTable: () => Promise<void>;
export declare const recordMessageSeen: (messageIds: string[], viewerUsername: string) => Promise<void>;
export declare const getMessageSeenBy: (messageId: string) => Promise<MessageReceiptRow[]>;
