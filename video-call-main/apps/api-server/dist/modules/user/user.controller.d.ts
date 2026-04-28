import { Request, Response } from "express";
export declare function getAllUsers(req: Request, res: Response): Promise<void>;
export declare function upsertUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getUserProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateSettings(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateOnlineStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function uploadProfilePicture(req: Request, res: Response): Promise<void>;
export declare const userController: {
    getAllUsers: typeof getAllUsers;
    upsertUser: typeof upsertUser;
    getUserProfile: typeof getUserProfile;
    updateSettings: typeof updateSettings;
    updateOnlineStatus: typeof updateOnlineStatus;
    uploadProfilePicture: typeof uploadProfilePicture;
};
