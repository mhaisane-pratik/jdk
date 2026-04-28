export interface CreateApiKeyInput {
    name: string;
    createdBy?: string;
    expiresInDays?: number;
}
export declare const ensureApiKeyTable: () => Promise<void>;
export declare const createApiKey: ({ name, createdBy, expiresInDays, }: CreateApiKeyInput) => Promise<{
    apiKey: string;
    key: any;
}>;
export declare const validateApiKey: (rawKey: string) => Promise<any>;
export declare const listApiKeys: () => Promise<any[]>;
export declare const revokeApiKey: (id: number) => Promise<any>;
