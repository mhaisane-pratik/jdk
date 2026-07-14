// src/index.ts
async function requestSsoToken(options) {
  const { authBaseUrl, masterKey, user } = options;
  const response = await fetch(`${authBaseUrl}/api/v1/auth/sso-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sso-master-key": masterKey
    },
    body: JSON.stringify(user)
  });
  const data = await response.json();
  if (!response.ok || !data?.ssoToken) {
    throw new Error(data?.error || "Failed to generate SSO token");
  }
  return data.ssoToken;
}
function buildChatLoginUrl(options) {
  const { chatAppBaseUrl, ssoToken, loginPath = "/chat-login" } = options;
  const base = chatAppBaseUrl.replace(/\/$/, "");
  return `${base}${loginPath}?ssoToken=${encodeURIComponent(ssoToken)}`;
}
async function redirectToChatWithSso(tokenOptions, chatAppBaseUrl, loginPath = "/chat-login") {
  const ssoToken = await requestSsoToken(tokenOptions);
  const url = buildChatLoginUrl({ chatAppBaseUrl, ssoToken, loginPath });
  window.location.href = url;
}
export {
  buildChatLoginUrl,
  redirectToChatWithSso,
  requestSsoToken
};
