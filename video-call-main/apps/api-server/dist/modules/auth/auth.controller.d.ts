import { Request, Response } from "express";
export declare class AuthController {
    private service;
    constructor();
    login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
}
