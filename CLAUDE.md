# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This repo contains a build specification (`AGENT_SPEC.md`) for converting an existing Next.js barbershop booking app into a **Turborepo monorepo** with three apps and four shared packages. The source project lives at `C:\Users\bruno\Documents\GitHub\BarberLab-main\BarberLab-main\` (referred to as `[SOURCE]` in the spec). **Do not modify anything in that directory.**

## Target Structure

```
barberlab-mono/
├── apps/
│   ├── web/        ← Next.js 15 (App Router, replaces current app)
│   ├── mobile/     ← Expo 53 + Expo Router v4 (iOS + Android)
│   └── api/        ← Fastify + tRPC server (port 4000)
└── packages/
    ├── db/         ← Prisma schema + typed client (@barberlab/db)
    ├── trpc/       ← tRPC router + client factory (@barberlab/trpc)
    ├── ui/         ← Tamagui shared components (@barberlab/ui)
    └── config/     ← Shared tsconfig + eslint
```

Package manager: **pnpm 10** with pnpm workspaces. Orchestration: **Turborepo**.

## Dev Commands (once built)

```bash
pnpm dev                              # Start all apps
pnpm dev --filter=@barberlab/api      # API only (Fastify, port 4000)
pnpm dev --filter=@barberlab/web      # Web only (Next.js, port 3000)
pnpm dev --filter=@barberlab/mobile   # Mobile only (Expo)
pnpm build                            # Build all
pnpm lint                             # Lint all
pnpm db:migrate                       # Run Prisma migrations
pnpm db:seed                          # Seed the database
pnpm db:studio                        # Open Prisma Studio
```

Individual app dev scripts:
- `apps/api`: `tsx watch src/index.ts`
- `apps/web`: standard Next.js `next dev`
- `apps/mobile`: `expo start`

## Architecture

### Data flow
- `packages/db` holds the Prisma client — imported **only** by `apps/api`, never by web or mobile directly.
- `packages/trpc` holds the router definition and a `createClient()` factory — imported by all three apps.
- Web and mobile call the API exclusively via tRPC over HTTP (`/trpc` endpoint). Server Components in web may use the tRPC server-side caller to avoid the HTTP hop.

### Auth
- **Mobile**: Expo AuthSession → Google ID token → `POST /auth/google` on the API → app JWT stored in `expo-secure-store`.
- **Web**: NextAuth v4 with `strategy: "jwt"`. The JWT callback exchanges the Google ID token for an `accessToken` (via the same `/auth/google` endpoint or directly) and stores it in the NextAuth session.
- **API**: Every tRPC request carries `Authorization: Bearer <token>`. The Fastify middleware decodes it and populates `ctx.user: { id, email, isAdmin }`.

### Converting source patterns
| Source (`[SOURCE]`) | This monorepo |
|---|---|
| `app/_actions/*.ts` (Server Actions) | tRPC mutation procedures in `packages/trpc/src/routers/` |
| `app/_data/*.ts` (data helpers) | tRPC query procedures |
| `getServerSession(authOptions)` | `ctx.user` from JWT context |
| `revalidatePath(...)` | Remove — clients invalidate their own cache |
| `throw new Error("Usuário não autenticado")` | `throw new TRPCError({ code: 'UNAUTHORIZED' })` |
| Direct Prisma import in page/action | `db` imported from `@barberlab/db` in API routers only |
| shadcn/ui components | `@barberlab/ui` Tamagui components |

### Key business logic (read source files carefully before porting)
- **Slot generation** (`[SOURCE]/app/api/slots/route.ts`): 15-minute intervals from business hours; blocked by existing bookings, time blocks, and past times (with a 15-min buffer for today); `after` param for multi-service sequential booking.
- **Multi-service booking** (`[SOURCE]/app/_components/booking-sheet.tsx`): services booked sequentially, each with its own slot; gaps > 30 min trigger a warning; one `Booking` DB record with multiple `BookingService` children.
- **Currency**: always `Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" })`.
- **Dates**: always use `pt` locale from `date-fns/locale` (pt-PT, not `ptBR`).
- **Booking status**: `CONFIRMED → COMPLETED` (admin only) or `CONFIRMED → CANCELLED` (user or admin). Concluded = `COMPLETED` or date < today.

## Agent Rules

### Always use CLIs to scaffold projects — never create boilerplate manually
Using the official CLI ensures correct config, native plugins, and version alignment. Writing config files from scratch is error-prone and will drift from what the tool generates.

| What to scaffold | Command |
|---|---|
| New Next.js app | `pnpm create next-app@latest <dir> --typescript --tailwind --app` |
| New Expo app | `pnpm create expo-app <dir> --template blank-typescript` |
| shadcn/ui component | `pnpm dlx shadcn@latest add <component>` |
| Prisma setup in a package | `pnpm dlx prisma init` |

Never hand-write `app.json`, `metro.config.js`, `next.config.ts`, or Expo plugin boilerplate — generate them and then patch.

### Commit before starting a new feature
Before beginning any new feature or major refactor, ensure all current work is committed. This keeps each feature isolated, makes bisecting failures trivial, and prevents unrelated changes from contaminating a feature branch. If the working tree is dirty when you start, commit it with a `chore:` or `wip:` message first.

### Use Docker for all external services
Never install Postgres, Redis, or any other external service directly on the host. Run them via Docker Compose. This keeps the environment reproducible and makes it easy to reset state.

A minimal `docker-compose.yml` for this project's Postgres:
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: barberlab
      POSTGRES_PASSWORD: barberlab
      POSTGRES_DB: barberlab
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

Start with `docker compose up -d`, stop with `docker compose down`. Use `docker compose down -v` to wipe the volume and start fresh.

### TypeScript strictness
All packages extend `packages/config/tsconfig.base.json` which has `"strict": true`. Do not add `@ts-ignore` or `as any` to work around type errors — fix the types.

### Never import `@barberlab/db` outside `apps/api`
The Prisma client must only run server-side in the API process. Web Server Components and mobile must call the API via tRPC. If you need data in a Server Component, use the tRPC server-side caller, not a direct `db.*` call.

### tRPC errors, not thrown strings
All error paths in tRPC procedures must throw `TRPCError` with an appropriate code (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`). Never `throw new Error(...)` inside a router — it will surface as a 500 with no useful code for the client to handle.

### No `revalidatePath` / `revalidateTag` in tRPC procedures
These are Next.js Server Action APIs and have no effect in the Fastify API. Remove them when porting from source. Clients are responsible for invalidating their own query cache after a mutation.

### Tamagui, not Tailwind, for shared UI
Components in `packages/ui` must use Tamagui styled primitives — no Tailwind classes. `apps/web` may use Tailwind for layout-level wrappers that are web-only, but any component that will be shared with mobile must be pure Tamagui.

### One language: pt-PT
All user-facing strings are in European Portuguese (Portugal). Date formatting always uses `pt` from `date-fns/locale` (the pt-PT locale — not `ptBR`). Currency always uses `Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" })`. Do not introduce English strings or Brazilian Portuguese spellings in UI copy.

## Implementation Order

Follow this sequence to avoid dependency issues (from `AGENT_SPEC.md` Section 15):

1. Monorepo root (Turborepo + pnpm workspace)
2. `packages/config`
3. `packages/db` — copy Prisma schema verbatim, port client singleton
4. `packages/trpc` — all routers ported from source actions
5. `apps/api` — Fastify server, `/auth/google` endpoint, tRPC mount
6. `packages/ui` — Tamagui config + shared components
7. `apps/web` — Next.js app, NextAuth, all pages
8. `apps/mobile` — Expo app, auth, all screens

Test the API standalone before touching frontends. Test web fully before starting mobile.

## Environment Variables

`apps/api/.env`: `DATABASE_URL`, `DATABASE_SSL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `PORT=4000`

`apps/web/.env.local`: `NEXT_PUBLIC_API_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_AUTH_SECRET`, `NEXTAUTH_URL`

`apps/mobile/.env`: `EXPO_PUBLIC_API_URL` (use local network IP, not localhost), `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
