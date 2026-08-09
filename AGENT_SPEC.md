# BarberLab — Monorepo Rebuild Specification

> **For the agent executing this:** You have read access to the existing Next.js project at
> `C:\Users\bruno\Documents\GitHub\BarberLab-main\BarberLab-main\` (referred to as `[SOURCE]`
> throughout this document). Read files there to copy business logic, schemas, and content.
> Do not modify anything in that directory. Build everything new in a separate directory.

---

## 1. Goal

Convert the existing Next.js barbershop booking app into a **Turborepo monorepo** with three apps
sharing a common backend, database layer, type system, and (where possible) UI components.

```
barberlab-mono/
├── apps/
│   ├── web/        ← Next.js 15 (React, replaces the current app)
│   ├── mobile/     ← Expo 53 + Expo Router (iOS + Android)
│   └── api/        ← Fastify + tRPC (the backend, runs on a local server)
└── packages/
    ├── db/         ← Prisma schema + typed client (shared by api only)
    ├── trpc/       ← tRPC router definition + shared types (used by web + mobile)
    ├── ui/         ← Tamagui components shared between web and mobile
    └── config/     ← Shared tsconfig, eslint config
```

---

## 2. Tech Stack Decisions

| Concern | Choice | Reason |
|---|---|---|
| Monorepo | Turborepo + pnpm workspaces | Standard, fast, low overhead |
| Shared UI | Tamagui | Single component source → compiles to DOM (web) and RN primitives (mobile) |
| Backend framework | Fastify | Lightweight, fast, TS-native |
| API protocol | tRPC v11 | End-to-end type safety; no codegen; both clients get autocomplete |
| ORM | Prisma 7 (same as source) | Copy schema verbatim; zero migration needed |
| DB adapter | `@prisma/adapter-pg` + `pg.Pool` | Same as source; copy `[SOURCE]/app/_lib/prisma.ts` logic |
| Web auth | NextAuth v4 (JWT strategy) | Keep Google OAuth; switch from DB sessions to JWT so mobile can share the token |
| Mobile auth | Expo AuthSession + SecureStore | Google OAuth via the system browser; stores JWT |
| Mobile navigation | Expo Router v4 | File-based routing (same mental model as Next.js) |
| Validation | Zod (same as source) | Copy existing schemas; share between api and clients |
| Language | European Portuguese (pt-PT) | All user-facing strings stay in Portuguese |
| Package manager | pnpm 10 | Same as source |

---

## 3. Source Project Reference

The existing project is a **single Next.js app** where:
- Data fetching = async Server Components querying Prisma directly
- Mutations = Next.js Server Actions (`[SOURCE]/app/_actions/*.ts`)
- Auth = NextAuth v4 with database sessions and Google provider
- UI = shadcn/ui (Radix UI + Tailwind v4)
- DB adapter = `@prisma/adapter-pg` (NOT the default binary engine)

In the new architecture every Server Action becomes a **tRPC procedure**. The Prisma client moves
into `packages/db` and is only imported by `apps/api`. Clients (web + mobile) call the API via
the tRPC client in `packages/trpc`.

### Files to read and port from [SOURCE]

| Source path | What to do with it |
|---|---|
| `prisma/schema.prisma` | Copy verbatim to `packages/db/prisma/schema.prisma` |
| `prisma/seed.ts` | Copy to `packages/db/prisma/seed.ts`, adjust imports |
| `app/_lib/prisma.ts` | Port to `packages/db/src/client.ts` (same Pool + PrismaPg logic) |
| `app/_lib/auth.ts` | Port to `apps/web/src/lib/auth.ts` — change session strategy to `"jwt"` |
| `app/_lib/notifications.ts` | Port to `apps/api/src/lib/notifications.ts` |
| `app/_lib/utils.ts` | Copy `cn()` helper to `packages/ui/src/utils.ts` |
| `app/_actions/*.ts` | Convert each action to a tRPC procedure (see Section 6) |
| `app/_data/*.ts` | Convert each helper to a tRPC query procedure |
| `app/_constants/` | Copy to `packages/trpc/src/constants/` |
| `app/api/slots/route.ts` | Port slot-generation logic to a tRPC query |
| `app/api/closed-days/route.ts` | Port to a tRPC query |

---

## 4. Monorepo Bootstrap

```bash
mkdir barberlab-mono && cd barberlab-mono
pnpm init
# Add to package.json: "packageManager": "pnpm@10.33.0"
```

**`pnpm-workspace.yaml`**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**`turbo.json`**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev":   { "persistent": true, "cache": false },
    "lint":  { "dependsOn": ["^lint"] },
    "db:generate": { "cache": false }
  }
}
```

Root `package.json` scripts:
```json
{
  "scripts": {
    "dev":         "turbo dev",
    "build":       "turbo build",
    "lint":        "turbo lint",
    "db:migrate":  "turbo --filter=@barberlab/db db:migrate",
    "db:seed":     "turbo --filter=@barberlab/db db:seed",
    "db:studio":   "turbo --filter=@barberlab/db db:studio"
  }
}
```

---

## 5. Package: `packages/config`

Shared TypeScript and ESLint configs consumed by all workspaces.

**`packages/config/tsconfig.base.json`**
```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "jsx": "react-jsx",
    "baseUrl": "."
  }
}
```

Each workspace extends this with its own `tsconfig.json`.

---

## 6. Package: `packages/db`

### Setup
```bash
cd packages/db
pnpm add @prisma/client @prisma/adapter-pg pg
pnpm add -D prisma tsx dotenv typescript
```

### Files

**`prisma/schema.prisma`** — Copy verbatim from `[SOURCE]/prisma/schema.prisma`.
The schema has these models: `User`, `Account`, `Session`, `VerificationToken`, `Barbershop`,
`BusinessHours`, `BarbershopService`, `Booking`, `BookingService`, `BookingStatus` (enum),
`Client`, `Review`, `TimeBlock`.

**`src/client.ts`** — Port from `[SOURCE]/app/_lib/prisma.ts`. Keep the same
`Pool` + `PrismaPg` singleton pattern. Export `db` as the Prisma client instance.

**`src/index.ts`**
```ts
export { db } from './client'
export { Prisma, PrismaClient } from '@prisma/client'
export type { Barbershop, BarbershopService, Booking, BookingService,
              BusinessHours, Client, Review, TimeBlock, User } from '@prisma/client'
export { BookingStatus } from '@prisma/client'
```

**`package.json`**
```json
{
  "name": "@barberlab/db",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate":  "prisma migrate deploy",
    "db:seed":     "tsx --env-file=../../.env.local prisma/seed.ts",
    "db:studio":   "prisma studio"
  }
}
```

**`prisma/seed.ts`** — Copy from `[SOURCE]/prisma/seed.ts`, adjust the import of `db` to
`import { db } from '../src/client'`.

---

## 7. Package: `packages/trpc`

This package contains the **router definition** and the **client factory**. It is imported by
`apps/api` (to create the server) and by `apps/web` + `apps/mobile` (to call it).

```bash
cd packages/trpc
pnpm add @trpc/server @trpc/client zod date-fns
pnpm add -D typescript
```

### Router structure

```
packages/trpc/src/
├── index.ts            ← exports appRouter type + createCallerFactory
├── router.ts           ← merges all sub-routers
├── context.ts          ← request context (user from JWT)
├── trpc.ts             ← initTRPC instance
└── routers/
    ├── barbershop.ts   ← getBarbershops, getBarbershopById
    ├── booking.ts      ← createBooking, getUserBookings, deleteBooking
    ├── admin.ts        ← all admin procedures (protected by isAdmin)
    ├── service.ts      ← upsertService, deleteService
    ├── review.ts       ← createReview, deleteReview
    ├── slots.ts        ← getSlots, getClosedDays
    ├── client.ts       ← createClient, searchClients, getClientById
    └── timeblock.ts    ← createTimeBlock
```

### Converting Server Actions to tRPC procedures

Each file in `[SOURCE]/app/_actions/` maps to a procedure. Rules:
- `getServerSession(authOptions)` → read `ctx.user` from context (JWT decoded by api middleware)
- `revalidatePath(...)` → remove entirely (clients invalidate their own cache)
- `throw new Error("Usuário não autenticado")` → `throw new TRPCError({ code: 'UNAUTHORIZED' })`
- Direct `db.*` calls stay the same, just import `db` from `@barberlab/db`

Full mapping:

| Source action | tRPC procedure | Router |
|---|---|---|
| `create-booking.ts` | `booking.create` | `booking.ts` |
| `delete-booking.ts` | `booking.delete` | `booking.ts` |
| `create-admin-booking.ts` | `admin.createBooking` | `admin.ts` |
| `cancel-admin-booking.ts` | `admin.cancelBooking` | `admin.ts` |
| `complete-admin-booking.ts` | `admin.completeBooking` | `admin.ts` |
| `get-bookings-for-date.ts` | `admin.getBookingsForDate` | `admin.ts` |
| `get-booking-counts.ts` | `admin.getBookingCounts` | `admin.ts` |
| `upsert-service.ts` | `service.upsert` | `service.ts` |
| `delete-service.ts` | `service.delete` | `service.ts` |
| `create-review.ts` | `review.create` | `review.ts` |
| `delete-review.ts` | `review.delete` | `review.ts` |
| `update-barbershop.ts` | `admin.updateBarbershop` | `admin.ts` |
| `create-client.ts` | `client.create` | `client.ts` |
| `search-clients.ts` | `client.search` | `client.ts` |
| `create-time-block.ts` | `timeblock.create` | `timeblock.ts` |
| `[SOURCE]/app/api/slots/route.ts` | `slots.getSlots` | `slots.ts` |
| `[SOURCE]/app/api/closed-days/route.ts` | `slots.getClosedDays` | `slots.ts` |

Read the source files carefully to port the exact business logic (especially the slot generation
algorithm in `[SOURCE]/app/api/slots/route.ts`).

### Context

```ts
// packages/trpc/src/context.ts
export interface Context {
  user: { id: string; email: string; isAdmin: boolean } | null
}
```

The API middleware decodes the JWT and populates `ctx.user`. Protected procedures check
`ctx.user !== null`. Admin procedures additionally check `ctx.user.isAdmin === true`.

### Client factory

```ts
// packages/trpc/src/client.ts
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from './router'

export function createClient(baseUrl: string, getToken: () => string | null) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${baseUrl}/trpc`,
        headers: () => {
          const token = getToken()
          return token ? { Authorization: `Bearer ${token}` } : {}
        },
      }),
    ],
  })
}
```

**`packages/trpc/src/index.ts`** — export `AppRouter` type, `createClient`, `appRouter`.

---

## 8. Package: `packages/ui`

Tamagui components shared by both web and mobile.

```bash
cd packages/ui
pnpm add tamagui @tamagui/core @tamagui/config lucide-react-native
pnpm add -D typescript
```

### Tamagui setup

**`tamagui.config.ts`** — Use `@tamagui/config/v4` as the base config. Customise the primary
colour to match the current app (dark teal, check `[SOURCE]/app/globals.css` for CSS variables).

### Components to build

Build these as Tamagui components. They replace both the shadcn/ui web components and the
React Native equivalents:

| Component | Notes |
|---|---|
| `Button` | variants: default, outline, ghost, destructive |
| `Card` + `CardContent` | Simple container with border radius + shadow |
| `Input` | Controlled text input with label support |
| `Textarea` | Multi-line input |
| `Badge` | Small coloured label |
| `Avatar` | Circular image with fallback initials |
| `Separator` | Horizontal or vertical divider |
| `StarRating` | 1–5 star rating picker (from `[SOURCE]/app/barbershops/[id]/_components/review-form.tsx`) |
| `ServiceCard` | Barbershop service card (image, name, price, duration) |
| `BookingCard` | Booking history item (from `[SOURCE]/app/_components/booking-item.tsx`) |
| `BarbershopCard` | Barbershop list item (from `[SOURCE]/app/_components/barbershop-item.tsx`) |
| `LoadingSpinner` | Animated loading indicator |

> **Note on platform-specific logic:** Use Tamagui's `isWeb` / `isNative` from
> `@tamagui/core` for any unavoidable platform forks inside shared components.

**`packages/ui/src/index.ts`** — re-export all components and the tamagui config.

**`package.json`**
```json
{
  "name": "@barberlab/ui",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts"
}
```

---

## 9. App: `apps/api`

Standalone Fastify server. The DB lives on the same machine. This process is what both the web
app and the mobile app call.

```bash
cd apps/api
pnpm add fastify @fastify/cors @trpc/server fastify-plugin jsonwebtoken jose zod
pnpm add @barberlab/db @barberlab/trpc
pnpm add -D typescript tsx tsup
```

### Structure

```
apps/api/src/
├── index.ts         ← Fastify server bootstrap
├── auth.ts          ← JWT sign / verify helpers
├── trpc.ts          ← Fastify adapter for tRPC
├── routes/
│   └── auth.ts      ← POST /auth/google — exchanges Google token for app JWT
└── lib/
    └── notifications.ts  ← Port from [SOURCE]/app/_lib/notifications.ts
```

### Auth flow

1. Client obtains a Google ID token (via Google Sign-In SDK on mobile, or NextAuth on web).
2. Client sends `POST /auth/google` with `{ idToken: string }`.
3. API verifies the ID token with Google, upserts the User in the DB (same logic as NextAuth's
   `signIn` callback), and returns `{ accessToken: string }` — a signed JWT containing
   `{ id, email, isAdmin }` with a 30-day expiry.
4. Client stores the JWT (web: httpOnly cookie or localStorage; mobile: `expo-secure-store`).
5. Every tRPC request includes `Authorization: Bearer <token>`.

### tRPC integration

Use `@trpc/server/adapters/fetch` or the Fastify adapter. Mount the tRPC router at `/trpc`.

### CORS

Allow the web app origin and `*` for mobile (mobile apps do not send an Origin header).

### Environment variables (`apps/api/.env`)
```
DATABASE_URL=postgresql://...
DATABASE_SSL=false
JWT_SECRET=<random 64-char hex>
GOOGLE_CLIENT_ID=<same as current project>
PORT=4000
```

### `package.json` scripts
```json
{
  "scripts": {
    "dev":   "tsx watch src/index.ts",
    "build": "tsup src/index.ts --format cjs --dts",
    "start": "node dist/index.js"
  }
}
```

---

## 10. App: `apps/web`

Next.js 15 (App Router). Replaces the current project entirely. Visually identical.

```bash
cd apps/web
pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir
pnpm add @barberlab/ui @barberlab/trpc
pnpm add tamagui @tamagui/next-plugin next-auth
pnpm add date-fns date-fns/locale react-hook-form zod sonner
```

### Key differences from the source

| Source pattern | New pattern |
|---|---|
| Server Action `"use server"` | tRPC mutation called from Client Component via the tRPC client |
| `getServerSession(authOptions)` in Server Components | Read from the NextAuth JWT session server-side |
| Direct Prisma import in page | All data via tRPC (Server Components can use the tRPC server-side caller) |
| shadcn/ui components | `@barberlab/ui` Tamagui components |
| Tailwind utility classes | Tamagui `styled()` or inline `style` props |

### Auth

Use NextAuth v4 with `strategy: "jwt"`. The `jwt` callback must exchange the Google ID token for
an `accessToken` using the same `/auth/google` endpoint as mobile, or call the API's auth logic
directly (since web and api can share the same process or the web can call the API).

Store the `accessToken` in the NextAuth JWT so it is available to tRPC calls made from client
components.

### tRPC client setup

Create a singleton tRPC client in `apps/web/src/lib/trpc.ts`:
```ts
import { createClient } from '@barberlab/trpc'
// getToken reads from session/cookie
export const trpc = createClient(process.env.NEXT_PUBLIC_API_URL!, getToken)
```

For Server Components that need data, use the tRPC server-side caller (no HTTP hop):
```ts
import { createCallerFactory } from '@barberlab/trpc'
const caller = createCallerFactory(appRouter)({ user: serverUser })
const barbershops = await caller.barbershop.getAll()
```

### Folder structure (mirrors source)
```
apps/web/app/
├── page.tsx                  ← Home (search + barbershop list)
├── barbershops/
│   ├── page.tsx              ← Barbershop search results
│   └── [id]/
│       └── page.tsx          ← Barbershop detail + booking sheet
├── bookings/
│   └── page.tsx              ← User bookings
├── admin/
│   ├── layout.tsx
│   ├── page.tsx              ← Admin calendar
│   ├── clients/
│   ├── settings/
│   └── stats/
├── api/
│   └── auth/[...nextauth]/   ← NextAuth route
└── layout.tsx
```

### Environment variables (`apps/web/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_AUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

---

## 11. App: `apps/mobile`

Expo 53 with Expo Router v4. Target: iOS and Android.

```bash
cd apps/mobile
pnpm create expo-app . --template blank-typescript
pnpm add @barberlab/ui @barberlab/trpc
pnpm add tamagui @tamagui/core expo-auth-session expo-secure-store
pnpm add expo-image-picker expo-constants
pnpm add @react-navigation/native react-native-safe-area-context react-native-screens
pnpm add date-fns zod
```

### Auth

```ts
// apps/mobile/src/lib/auth.ts
import * as Google from 'expo-auth-session/providers/google'
import * as SecureStore from 'expo-secure-store'

// 1. useAuthRequest from expo-auth-session/providers/google
// 2. On success, get idToken from the response
// 3. POST to api/auth/google with idToken
// 4. Store returned accessToken in SecureStore under key 'access_token'
```

### tRPC client

```ts
// apps/mobile/src/lib/trpc.ts
import { createClient } from '@barberlab/trpc'
import * as SecureStore from 'expo-secure-store'

export const trpc = createClient(
  process.env.EXPO_PUBLIC_API_URL!,
  () => SecureStore.getItemAsync('access_token') // sync wrapper or use state
)
```

### Folder structure (Expo Router)
```
apps/mobile/app/
├── (auth)/
│   └── login.tsx             ← Google sign-in screen
├── (tabs)/
│   ├── _layout.tsx           ← Bottom tab bar
│   ├── index.tsx             ← Home / search
│   ├── bookings.tsx          ← User bookings
│   └── profile.tsx           ← Profile + sign out
├── barbershops/
│   ├── index.tsx             ← Search results
│   └── [id].tsx              ← Barbershop detail
├── booking/
│   └── new.tsx               ← Booking flow (calendar → slots → confirm)
├── admin/
│   ├── _layout.tsx
│   ├── index.tsx             ← Admin calendar
│   ├── clients/
│   └── settings/
└── _layout.tsx               ← Root layout + providers
```

### Platform-specific notes

- The booking flow (calendar + slot grid + service picker) is the most complex screen. Build it
  as a stack of native screens instead of sheets, since mobile sheets behave differently.
- Use `react-native-calendars` or a custom calendar built with Tamagui for the date picker.
- Images: use `expo-image` for display, `expo-image-picker` + upload to API for admin image changes.
- Notifications: use `expo-notifications` if push notifications are added in the future.
  For now the email notification logic stays in `apps/api`.

### Environment variables (`apps/mobile/.env`)
```
EXPO_PUBLIC_API_URL=http://192.168.x.x:4000   # local server IP on the network
EXPO_PUBLIC_GOOGLE_CLIENT_ID=...              # the iOS/Android client IDs from Google Console
```

---

## 12. Feature Parity Checklist

Port every feature from the source. Tick them off as you go.

### Customer-facing (web + mobile)
- [ ] Browse barbershop list with search
- [ ] Barbershop detail page (info, services, reviews, amenities, phones)
- [ ] Multi-service booking flow (calendar → slot grid → service picker → confirmation)
- [ ] View user bookings (confirmed + concluded)
- [ ] Cancel booking
- [ ] Leave / update / delete review with star rating
- [ ] Google Sign-In / Sign-Out
- [ ] Legal pages (cookies, privacy, terms) — web only

### Admin (web only, can be mobile later)
- [ ] Calendar view with day bookings
- [ ] Create booking for a client (registered or walk-in)
- [ ] Edit / cancel / complete a booking
- [ ] Client list and search
- [ ] New client creation
- [ ] Client detail (history)
- [ ] Time blocks (lunch, holidays)
- [ ] Service management (create, edit, delete, set image)
- [ ] Company settings (name, address, phones, description, logo, image)
- [ ] Business hours per day
- [ ] Booking stats

---

## 13. Data & Business Logic to Preserve

These are non-obvious business rules to preserve exactly:

### Slot generation
Read `[SOURCE]/app/api/slots/route.ts` in full. Key rules:
- Slots are generated in 15-minute intervals from business hours
- Existing bookings block intervals (using `startTime`/`endTime` strings "HH:MM")
- Time blocks (admin-created) also block slots
- `after` param: only return slots >= the end time of a previous service (for multi-service booking)
- For today: filter out past slots + 15-minute buffer

### Multi-service booking
Read `[SOURCE]/app/_components/booking-sheet.tsx` in full. Key rules:
- Multiple services are booked sequentially
- Each service gets its own time slot picked in order
- Gaps between services > 30 minutes show a warning
- `totalDuration` = end of last service − start of first service
- Booking is one DB record with multiple `BookingService` child records

### Currency formatting
- Always use `Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" })`

### Date locale
- Always use `pt` from `date-fns/locale` for date formatting (pt-PT, not `ptBR`)

### Booking status transitions
- `CONFIRMED` → `COMPLETED` (admin only, via `complete-admin-booking`)
- `CONFIRMED` → `CANCELLED` (user or admin)
- Concluded bookings = status `COMPLETED` or date < today

---

## 14. Build & Dev Commands

After setup, root-level commands via Turborepo:

```bash
# Start all three apps in dev mode
pnpm dev

# Build everything
pnpm build

# Run only the API
pnpm dev --filter=@barberlab/api

# Run only the web app
pnpm dev --filter=@barberlab/web

# Run only the mobile app
pnpm dev --filter=@barberlab/mobile

# Database
pnpm db:migrate
pnpm db:seed
pnpm db:studio
```

---

## 15. Implementation Order

Do this in order to avoid dependency issues:

1. Scaffold monorepo root (Turborepo, pnpm workspace)
2. `packages/config` — tsconfig base + eslint
3. `packages/db` — copy schema, port prisma client, copy seed
4. `packages/trpc` — context, init, all routers (port from source actions)
5. `apps/api` — Fastify server, auth endpoint, mount tRPC
6. `packages/ui` — Tamagui config + all shared components
7. `apps/web` — Next.js app, wire NextAuth, port all pages using `@barberlab/ui`
8. `apps/mobile` — Expo app, wire auth, port all screens using `@barberlab/ui`

Test the API standalone (with a REST client) before touching the frontends.
Test the web app fully before starting mobile.
