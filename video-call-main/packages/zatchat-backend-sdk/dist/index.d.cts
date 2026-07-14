import { Router } from 'express';

interface SsoRouteFactoryOptions {
    ssoJwtSecret: string;
    ssoMasterKey: string;
    issueJwt: (payload: {
        username: string;
    }) => Promise<string> | string;
    upsertUser: (payload: {
        username: string;
        display_name?: string;
        profile_picture?: string;
        app_id?: string;
    }) => Promise<any>;
    issuer?: string;
}
declare function createZatChatSsoRouter(options: SsoRouteFactoryOptions): Router;

export { type SsoRouteFactoryOptions, createZatChatSsoRouter };
