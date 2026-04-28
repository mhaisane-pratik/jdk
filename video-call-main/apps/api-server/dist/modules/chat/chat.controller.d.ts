import { Request, Response } from "express";
export declare function getChatHistory(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getChatRooms(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function markAsRead(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createRoom(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateGroup(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function uploadFile(req: Request, res: Response): Promise<void>;
export declare function clearChat(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare const chatController: {
    getChatHistory: typeof getChatHistory;
    getChatRooms: typeof getChatRooms;
    markAsRead: typeof markAsRead;
    uploadFile: typeof uploadFile;
    createRoom: typeof createRoom;
    updateGroup: typeof updateGroup;
    clearChat: typeof clearChat;
};
