import { Request, Response } from "express";
export declare function deleteMessage(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function forwardMessages(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getMessageById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getMessageSeenByUsers(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare const messageController: {
    deleteMessage: typeof deleteMessage;
    forwardMessages: typeof forwardMessages;
    getMessageById: typeof getMessageById;
    getMessageSeenByUsers: typeof getMessageSeenByUsers;
};
