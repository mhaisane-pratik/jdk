import { Request, Response } from "express";
export declare function getDashboardStats(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateAppConfig(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateUserRole(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function verifyAdminPassword(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function banUser(req: Request, res: Response): Promise<void>;
export declare function warnUser(req: Request, res: Response): Promise<void>;
export declare function getGroupsDirectory(req: Request, res: Response): Promise<void>;
export declare const adminController: {
    getDashboardStats: typeof getDashboardStats;
    updateAppConfig: typeof updateAppConfig;
    updateUserRole: typeof updateUserRole;
    verifyAdminPassword: typeof verifyAdminPassword;
    banUser: typeof banUser;
    warnUser: typeof warnUser;
    getGroupsDirectory: typeof getGroupsDirectory;
};
