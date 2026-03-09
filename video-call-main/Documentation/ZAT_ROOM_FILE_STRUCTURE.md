# ZAT Room - Industry Standard File Structure (Phase 1: Standalone)

## 1. The Monorepo "Truth" (Frontend vs Backend)
In modern industry standards (Turborepo/Nx), we **DO NOT** create root folders named `Frontend` or `Backend`.
Instead, we place **Application Services** in `apps/` and **Shared Code** in `packages/`.

However, to map your mental model to the structure, here is how we organize it logically:

*   **FRONTEND (User)** -> `apps/web-user` (The Teams-like App)
*   **FRONTEND (Admin)** -> `apps/web-admin` (The Super Admin Portal)
*   **BACKEND** -> `apps/api-server` (The Node.js logic)
*   **SHARED** -> `packages/` (Code used by both Frontends and Backends)

---

## 2. Directory Tree (The Physical Layout)

```text
ZAT-ROOM/
├── apps/                          # 🚀 DEPLOYABLE SERVICES
│   ├── web-user/                  # [FRONTEND] Main Standalone App (Host/Participant)
│   ├── web-admin/                 # [FRONTEND] Super Admin Dashboard
│   ├── api-server/                # [BACKEND] Main REST API + Socket Service
│   └── docs/                      # [DOCS] API Documentation (Optional)
│
├── packages/                      # 🧠 SHARED LIBRARIES
│   ├── database/                  # Prisma Client + Schema (Backend Only)
│   ├── ui-kit/                    # Shared Buttons, Inputs, Layouts (Frontend Only)
│   ├── meeting-logic/             # Hooks: useWebRTC, useWhiteboard (Shared Frontend)
│   └── types/                     # Shared TypeScript Interfaces (Frontend + Backend)
│
├── docker/                        # 🐳 Infrastructure (Redis, Postgres)
├── package.json                   # Root Dependencies
└── turbo.json                     # Build Pipeline Config
```

---

## 3. Deep Dive: Frontend Structure (`apps/web-user` & `apps/web-admin`)
We use **Next.js** for both. Why separate them?
1.  **Security**: Admin portal should be on a private URL (private.primezat.com) or behind VPN.
2.  **Size**: Users don't need to download Admin javascript.
3.  **Deployment**: You can deploy them to different servers if needed.

### Standard Frontend Folder Structure (Inside `apps/web-user`)
```text
src/
├── app/                           # Next.js App Router (Routes)
│   ├── (auth)/                    # Route Group: Login, Signup, Forgot Pass
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/               # Route Group: Protected User Area
│   │   ├── layout.tsx             # Sidebar + Navbar Wrapper
│   │   ├── home/page.tsx          # Landing Dashboard
│   │   └── schedule/page.tsx
│   └── meeting/[id]/              # The "Active" Meeting Room
│       ├── page.tsx               # Entry point
│       └── components/            # Meeting-specific UI (VideoGrid, Controls)
│
├── components/                    # LOCAL Components (Not shared with Admin)
│   ├── shared/                    # Re-exports from packages/ui-kit
│   └── features/                  # Complex logic components
│       ├── AuthForm.tsx
│       └── ScheduleMeetingForm.tsx
│
├── hooks/                         # React Hooks
├── lib/                           # API Clients (Axios/Fetch wrappers)
├── store/                         # State Management (Zustand)
└── types/                         # Local types (Page specific)
```

**`apps/web-admin`** follows the exact same structure but with routes like `(dashboard)/tenants`, `(dashboard)/analytics`.

---

## 4. Deep Dive: Backend Structure (`apps/api-server`)
We use **NestJS** (or Express with Controller/Service pattern). This example follows the Industry Standard **Modular Architecture**.

```text
src/
├── config/                        # ⚙️ Configuration
│   ├── env.validation.ts          # Zod schema to validate .env
│   └── data-source.ts             # TypeORM/Prisma config
│
├── modules/                       # 📦 DOMAIN MODULES (The "Meat")
│   ├── auth/
│   │   ├── dto/                   # Data Transfer Objects (Validation)
│   │   │   ├── login.dto.ts
│   │   │   └── register.dto.ts
│   │   ├── interfaces/            # Module-local interfaces
│   │   │   └── jwt-payload.interface.ts
│   │   ├── auth.controller.ts     # Routes: @Post('/login')
│   │   ├── auth.service.ts        # Business Logic
│   │   └── auth.module.ts         # Dependency Injection Wiring
│   │
│   ├── user/
│   │   └── ...
│   ├── meeting/
│   │   └── ...
│   └── chat/
│       └── ...
│
├── common/                        # 🛠 GLOBAL SHARED CODE
│   ├── middlewares/               # Express Middlewares
│   │   ├── logger.middleware.ts
│   │   └── rate-limit.middleware.ts
│   │
│   ├── filters/                   # Global Exception Filters (Error Handling)
│   │   ├── http-exception.filter.ts
│   │   └── all-exceptions.filter.ts
│   │
│   ├── interceptors/              # Response Transformation
│   │   ├── transform.interceptor.ts
│   │   └── timeout.interceptor.ts
│   │
│   ├── guards/                    # Authorization Guards
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   │
│   ├── decorators/                # Custom Param Decorators
│   │   ├── user.decorator.ts      # @User()
│   │   └── roles.decorator.ts     # @Roles('ADMIN')
│   │
│   └── errors/                    # Custom Error Classes
│       ├── app.error.ts
│       └── business-rule.error.ts
│
├── database/                      # 💾 DATABASE LAYER
│   ├── migrations/                # SQL Migration files
│   ├── seeds/                     # Initial data (Admin user, Plans)
│   └── repositories/              # (Optional) Custom Repositories
│
├── utils/                         # 🧰 General Utilities
│   ├── hash.util.ts
│   └── date.util.ts
│
└── main.ts                        # 🏁 Entry Point
```

### Key Components Explained:
1.  **Modules (`src/modules/*`)**: Groups everything related to a logical feature (User, Chat).
2.  **Controllers**: Only handle HTTP (User inputs -> Call Service -> Return Response). **No Logic Here!**
3.  **Services**: Contains the Business Logic. This is where the magic happens.
4.  **DTOs (Data Transfer Objects)**: Classes that define what data is sent over the network. Validated using `class-validator`.
5.  **Middlewares**: Code that runs *before* the route handler (e.g., Logging request IP).
6.  **Filters (Interceptors)**: Code that runs *after* the logic or when an error occurs (Standardizing error JSON responses).
7.  **Database/Migrations**: Keeps track of schema changes over time.

---

## 5. Why This Structure Wins?
1.  **Isolation**: If the User App crashes, the Admin App is safe.
2.  **Clarity**: New developers know exactly where to go.
    *   "I need to fix a button on the Dashboard" -> `apps/web-user/src/components`
    *   "I need to fix a bug in Login limit" -> `apps/api-server/src/modules/auth`
3.  **Scalability**: When you start Phase 2 (SDK), you just add `packages/sdk-react` and import usage from `packages/meeting-logic`. You don't have to rewrite anything.

## 6. Phase 1 Execution Plan
1.  Initialize Turborepo.
2.  Create `apps/web-user` (Next.js).
3.  Create `apps/web-admin` (Next.js).
4.  Create `apps/api-server` (Node.js/Express+TS).
5.  Create `packages/types` and `packages/ui-kit`.
