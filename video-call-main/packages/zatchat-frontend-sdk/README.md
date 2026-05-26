# @zatchat/frontend-sdk

Frontend SDK for SSO redirect into ZatChat from another app.

## Install

```bash
npm i @zatchat/frontend-sdk
```

## Usage

```ts
import { redirectToChatWithSso } from "@zatchat/frontend-sdk";

await redirectToChatWithSso(
  {
    authBaseUrl: "https://chat-api.example.com",
    masterKey: "SERVER_SIDE_ONLY_KEY",
    user: {
      username: "john_doe",
      display_name: "John Doe",
      profile_picture: "https://cdn.example.com/avatar.png",
      app_id: "crm-app"
    }
  },
  "https://chat.example.com"
);
```

Note: `masterKey` should only be used in trusted environments.
