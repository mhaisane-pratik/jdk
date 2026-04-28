export declare const chatService: {
    updateRoomLastMessage(roomId: string, message: string, sender: string): Promise<void>;
    deleteMessage(messageId: string, deletedBy: string, deleteFor: string): Promise<void>;
    getUnreadCount(username: string): Promise<any>;
};
