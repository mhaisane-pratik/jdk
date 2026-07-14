"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  buildChatLoginUrl: () => buildChatLoginUrl,
  redirectToChatWithSso: () => redirectToChatWithSso,
  requestSsoToken: () => requestSsoToken
});
module.exports = __toCommonJS(index_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildChatLoginUrl,
  redirectToChatWithSso,
  requestSsoToken
});
