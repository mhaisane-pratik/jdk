# ZatChat SDK Packages

This repo now includes reusable npm packages:

- `@zatchat/frontend-sdk` in `packages/zatchat-frontend-sdk`
- `@zatchat/backend-sdk` in `packages/zatchat-backend-sdk`

## Build packages

From repo root:

```bash
npm install
npm run build:sdk
```

## Publish packages

Inside each package folder:

```bash
npm login
npm publish --access public
```

## Typical cross-app SSO flow

1. User signs in to external app.
2. External app backend creates SSO token (`/api/v1/auth/sso-token`).
3. External app frontend redirects to chat login URL with `ssoToken`.
4. Chat app verifies token with `/api/v1/auth/sso-login`.
5. User enters chat app already authenticated.

## Security checklist

- Keep `SSO_MASTER_KEY` secret on backend only.
- Keep `SSO_JWT_SECRET` private and rotated periodically.
- Keep SSO token TTL short (default 10 minutes).
- Use HTTPS for all auth requests.
