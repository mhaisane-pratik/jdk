# @zatchat/backend-sdk

Backend SDK for SSO endpoints to plug ZatChat into any app.

## Install

```bash
npm i @zatchat/backend-sdk jsonwebtoken
```

## Usage

```ts
import express from "express";
import jwt from "jsonwebtoken";
import { createZatChatSsoRouter } from "@zatchat/backend-sdk";

const app = express();
app.use(express.json());

app.use(
  "/api/v1/auth",
  createZatChatSsoRouter({
    ssoJwtSecret: process.env.SSO_JWT_SECRET!,
    ssoMasterKey: process.env.SSO_MASTER_KEY!,
    issueJwt: ({ username }) =>
      jwt.sign({ username }, process.env.JWT_SECRET!, { expiresIn: "1d" }),
    upsertUser: async ({ username, display_name, profile_picture }) => {
      // Replace with DB upsert
      return {
        username,
        display_name: display_name || username,
        profile_picture: profile_picture || null,
      };
    },
  })
);
```

Exposed endpoints:

- `POST /api/v1/auth/sso-token`
- `POST /api/v1/auth/sso-login`
