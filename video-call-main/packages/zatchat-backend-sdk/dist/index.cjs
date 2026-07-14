"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  createZatChatSsoRouter: () => createZatChatSsoRouter
});
module.exports = __toCommonJS(index_exports);
var import_express = require("express");
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
function createZatChatSsoRouter(options) {
  const router = (0, import_express.Router)();
  const issuer = options.issuer || "zatchat-sso";
  router.post("/sso-token", (req, res) => {
    const masterKey = req.headers["x-sso-master-key"];
    if (!masterKey || masterKey !== options.ssoMasterKey) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { username, display_name, profile_picture, app_id } = req.body || {};
    if (!username) {
      return res.status(400).json({ error: "username is required" });
    }
    const ssoToken = import_jsonwebtoken.default.sign(
      { username, display_name, profile_picture, app_id },
      options.ssoJwtSecret,
      { expiresIn: "10m", issuer }
    );
    return res.json({ success: true, ssoToken });
  });
  router.post("/sso-login", async (req, res) => {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ error: "Missing SSO token" });
    }
    try {
      let decoded;
      try {
        decoded = import_jsonwebtoken.default.verify(token, options.ssoJwtSecret, { issuer });
      } catch {
        decoded = import_jsonwebtoken.default.verify(token, options.ssoJwtSecret);
      }
      const { username, display_name, profile_picture, app_id } = decoded;
      if (!username) {
        return res.status(400).json({ error: "Username missing in token" });
      }
      const user = await options.upsertUser({
        username,
        display_name,
        profile_picture,
        app_id
      });
      const chatToken = await options.issueJwt({ username: user.username || username });
      return res.json({
        success: true,
        user,
        token: chatToken
      });
    } catch (err) {
      return res.status(401).json({
        error: "Invalid token",
        details: err.message
      });
    }
  });
  return router;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createZatChatSsoRouter
});
