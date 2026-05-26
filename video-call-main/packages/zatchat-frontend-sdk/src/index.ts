export interface ChatSsoUser {
  username: string;
  display_name?: string;
  profile_picture?: string;
  app_id?: string;
}

export interface RequestSsoTokenOptions {
  authBaseUrl: string;
  masterKey: string;
  user: ChatSsoUser;
}

export interface BuildChatLoginUrlOptions {
  chatAppBaseUrl: string;
  ssoToken: string;
  loginPath?: string;
}

export async function requestSsoToken(options: RequestSsoTokenOptions): Promise<string> {
  const { authBaseUrl, masterKey, user } = options;

  const response = await fetch(`${authBaseUrl}/api/v1/auth/sso-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sso-master-key": masterKey,
    },
    body: JSON.stringify(user),
  });

  const data = await response.json();
  if (!response.ok || !data?.ssoToken) {
    throw new Error(data?.error || "Failed to generate SSO token");
  }

  return data.ssoToken as string;
}

export function buildChatLoginUrl(options: BuildChatLoginUrlOptions): string {
  const { chatAppBaseUrl, ssoToken, loginPath = "/chat-login" } = options;
  const base = chatAppBaseUrl.replace(/\/$/, "");
  return `${base}${loginPath}?ssoToken=${encodeURIComponent(ssoToken)}`;
}

export async function redirectToChatWithSso(
  tokenOptions: RequestSsoTokenOptions,
  chatAppBaseUrl: string,
  loginPath = "/chat-login"
): Promise<void> {
  const ssoToken = await requestSsoToken(tokenOptions);
  const url = buildChatLoginUrl({ chatAppBaseUrl, ssoToken, loginPath });
  window.location.href = url;
}
