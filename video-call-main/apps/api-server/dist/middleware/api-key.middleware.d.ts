import { Request, Response, NextFunction } from "express";
export declare const apiKeyAuthMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const requireApiKeyAdminSecret: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
