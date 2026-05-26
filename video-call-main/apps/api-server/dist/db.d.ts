import { Pool } from "pg";
export declare const isDirectDbEnabled: boolean;
export declare const directDbReason: string;
export declare const pool: {
    query: () => Promise<never>;
    end: () => Promise<any>;
} | Pool;
