interface ChatSsoUser {
    username: string;
    display_name?: string;
    profile_picture?: string;
    app_id?: string;
}
interface RequestSsoTokenOptions {
    authBaseUrl: string;
    masterKey: string;
    user: ChatSsoUser;
}
interface BuildChatLoginUrlOptions {
    chatAppBaseUrl: string;
    ssoToken: string;
    loginPath?: string;
}
declare function requestSsoToken(options: RequestSsoTokenOptions): Promise<string>;
declare function buildChatLoginUrl(options: BuildChatLoginUrlOptions): string;
declare function redirectToChatWithSso(tokenOptions: RequestSsoTokenOptions, chatAppBaseUrl: string, loginPath?: string): Promise<void>;

export { type BuildChatLoginUrlOptions, type ChatSsoUser, type RequestSsoTokenOptions, buildChatLoginUrl, redirectToChatWithSso, requestSsoToken };
