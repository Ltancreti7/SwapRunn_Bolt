```md
# SwapRunn — AI coding agent quick guide

This repo is a hybrid React + TypeScript app that targets web and native through Capacitor. Web and native share the same bundle and routing (see `src/App.tsx`).

Quick, actionable notes for an AI coder:

- Architecture: routes in `src/pages`, shared UI under `src/components`, integrations under `src/integrations` and `src/services`. Supabase client: `src/integrations/supabase/client.ts`.
- Auth: `src/hooks/useAuth.tsx` (AuthProvider) uses a Supabase RPC (`get_user_profile`), caches and deduplicates profile fetches, and exposes `loading` + `profileLoading`. Gate routes with `ProtectedRoute` and check `requiredUserType`.
- Realtime & writes: prefer Supabase channels (`supabase.channel`) and `supabaseService` helpers for write flows to avoid concurrency conflicts (watch for `JOB_ALREADY_TAKEN`).
- Native vs web: add platform-specific implementations under `src/services/*` and provide web fallbacks (see VIN scanner & `useMobileCapacitor()` hook).
- Forms: React Hook Form + Zod patterns are used throughout (see `DealerRequest` and form components in `src/components`).

Developer workflows (exact commands)

- Start dev server: `npm run dev` (Vite). Build: `npm run build` or `npm run build:dev` for development-mode build. Lint: `npm run lint`. Preview: `npm run preview`.
- iOS quick: after building web assets run `npx cap sync ios` then `npx cap open ios`.

Conventions & gotchas

- Multi-tenant roles: `dealer`, `driver`, `swap_coordinator`. Routes and UI assume these role names; changing them requires updates in `ProtectedRoute` and any role checks in `src/pages`.
- Mock data flags: check `store/mockStore.ts` and `driver-data.ts` for `USE_MOCK_DATA` toggles before assuming live APIs.
- RPCs and edge functions: several flows call Supabase RPCs (e.g., `get_user_profile`) and edge functions under `supabase/functions/*` (distance, sms, billing). If you change those shapes, update callers and tests.
- Notifications: both web (`notificationService`, `smsService`) and native (`mobileNotificationService`) must be updated together.

Files to inspect first

- `src/hooks/useAuth.tsx` — auth, caching, retries, and how profileLoading is used.
- `src/integrations/supabase/client.ts` — how the supabase client is created and used.
- `src/components/ProtectedRoute.tsx` and `src/pages/*` — routing and role-guard patterns.
- `src/services/*` — examples of platform abstractions (VIN, distance, sms, billing).

If a behavior or integration is unclear, ask which platform (web or native) the change targets and whether to prefer mock data. After edits, run `npm run dev` and watch browser console logs — the app logs auth and supabase steps heavily which helps debugging.

Would you like a 10-line micro quick-start or expanded file-level examples? Reply with preference and I'll iterate.

```# SwapRunn AI Guide

## Orientation

- SwapRunn is a hybrid React + TypeScript + Capacitor app for dealers, drivers, swap coordinators; web + native share the same bundle via `src/App.tsx` router.
- Routes live in `src/pages`; guard everything behind `<ProtectedRoute>` with `requiredUserType` using `useAuth` profile (RPC `get_user_profile`). Always wait for `profileLoading` to clear before gating features.
- Multi-tenant system with three user types: `dealer`, `driver`, `swap_coordinator`—each has distinct dashboards and workflows.

## Auth & State

- `AuthProvider` in `src/hooks/useAuth.tsx` caches profiles, dedups fetches, retries; call `useAuth()` and respect `profileLoading` and `loading`.
- Wrap Supabase writes with `supabaseService` when possible; it handles assignments, tracking tokens, and throws `JOB_ALREADY_TAKEN` when concurrency is violated.
- Auth includes biometric support (`useBiometricAuth`) and remember-me functionality; save/restore credentials carefully in mobile builds.

## Data Access

- Real-time updates go through `useEnhancedRealTime` (presence + toast) and `useDriverNotifications` (channels + SMS fallback). Subscribe via `supabase.channel` instead of manual polling.
- For distance + VIN, use services: `distanceService.calculateDistance()` invokes the `calculate-distance` edge function then falls back to heuristics; `vinScannerService` picks native scanner vs `WebVINScanner` as a web fallback.
- `driver-data.ts` and `mockStore.ts` ship with `USE_MOCK_DATA = true`; flip only when backing APIs exist so UI placeholders stay functional.
- Query patterns use `@tanstack/react-query` for caching; implement hooks like `useProfessionalJob` for complex data dependencies.

## Mobile vs Web

- Feature-gate with `useMobileCapacitor()`; `MobileApp` kicks off push registration + haptics for native builds while browser paths fall back to `notificationService`.
- When adding camera/geo features, provide a Capacitor path in `src/services/*` and a matching web component fallback (pattern used by VIN scanner, notifications, geolocation).
- Mobile skeletons: use `MobileSkeleton` and `MobileCardSkeleton` from `@/components/ui/mobile-skeleton` for loading states that adapt to mobile vs desktop.

## UI Patterns

- Layout uses global `<Header />` + `<MobileApp>` wrapper; shared shells live in `src/components`, with shadcn primitives under `src/components/ui`.
- Forms mix React Hook Form + Zod and controlled state; keep UI chrome like `openSections` separate from submission payloads, as in `DealerRequest`.
- Addresses should pass through `AddressInput`/`AddressData`; it loads Google Places via the `google-maps-config` edge function and normalizes state/zip.
- Use responsive `useIsMobile()` hook to conditionally render mobile-optimized components; prefer mobile-first design.

## Supabase & Edge

- Public client sits in `src/integrations/supabase/client.ts`; select helpers use `.single()`/`.maybeSingle()` with console logging—match that style for new queries.
- Edge functions under `supabase/functions/*` cover notifications, SMS, distance, billing, payouts. Call them with `supabase.functions.invoke(...)` (see `DealerRequest`, `smsService`, `distanceService`).
- Job workflows expect `jobs` + `assignments` rows; prefer `supabaseService` helpers for create/accept/clock-in flows to keep statuses in sync.
- Billing integration uses Stripe via `stripe-billing` and `stripe-webhook` edge functions; usage tracking in `swap_usage_records` table.

## Build & Tooling

- `npm run dev` (Vite dev server on port 8080), `npm run build` for production, `npm run lint` before commits; mobile builds require `npx cap sync ios` followed by `npx cap open ios`.
- Path alias `@/` resolves to `src/`; Tailwind config in `tailwind.config.ts` backs the design system alongside shadcn UI tokens.
- Development uses `lovable-tagger` component attribution in dev mode; ESLint config allows unused vars for rapid iteration.
- Cypress is installed but unused; manual QA via the dev server + native build is the current expectation.

## Gotchas

- `ProtectedRoute` sends users without profiles to setup; ensure dealer/driver onboarding writes profile rows to avoid dead loops.
- Supabase RPCs (`get_user_profile`, `get_open_jobs_for_drivers`, `get_job_by_tracking_token`) power most data; update RPCs and client code together when changing shape.
- Notifications span web (`notificationService` + `smsService`) and native (`mobileNotificationService`); update both when altering alert payloads.
- Mock data services help UI development; always check `USE_MOCK_DATA` flags before assuming real API integration.
