# ZatChat SDK + SSO Integration

This setup lets another app plug into ZatChat with SSO.

## 1) Backend setup (ZatChat API server)
Set env values:

- `SSO_JWT_SECRET` = shared JWT signing secret
- `SSO_MASTER_KEY` = private key to allow trusted server-to-server token creation
- `JWT_SECRET` = existing chat session token secret

New endpoint:

- `POST /api/v1/auth/sso-token`

Headers:

- `x-sso-master-key: <SSO_MASTER_KEY>`

Body:

```json
{
  "username": "john_doe",
  "display_name": "John Doe",
  "profile_picture": "https://cdn.example.com/u/john.png",
  "app_id": "crm-app"
}
```

Response:

```json
{
  "success": true,
  "ssoToken": "<jwt>"
}
```

## 2) Frontend SDK usage in another app
Use helper from `src/sdk/chat-sso-sdk.ts`.

```ts
import { redirectToChatWithSso } from "./sdk/chat-sso-sdk";

await redirectToChatWithSso(
  {
    authBaseUrl: "https://chat-api.example.com",
    masterKey: "YOUR_SERVER_MASTER_KEY",
    user: {
      username: "john_doe",
      display_name: "John Doe",
      profile_picture: "https://cdn.example.com/u/john.png",
      app_id: "crm-app",
    },
  },
  "https://chat-app.example.com",
  "/chat-login"
);
```

This redirects user to:

`https://chat-app.example.com/chat-login?ssoToken=<token>`

The existing login page already calls `/api/v1/auth/sso-login` and starts chat session.

## 3) Security notes

- Keep `SSO_MASTER_KEY` only on trusted server side.
- Do not expose `SSO_MASTER_KEY` in public frontend bundles.
- Prefer issuing SSO tokens from your own backend, then redirect from app server.

## 4) Plug-and-play flow

1. External app authenticates user normally.
2. External app backend calls `POST /api/v1/auth/sso-token`.
3. External app redirects user to chat app login URL with `ssoToken`.
4. ZatChat verifies token and auto signs in user.
