# Frontend API integration

The browser calls same-origin `/api/bff/*` route handlers. The Next.js BFF reads server-only `API_URL` (default `http://localhost:3001/v1`) and forwards requests to NestJS. Access and rotating refresh tokens use `HttpOnly`, `Secure`, `SameSite=Lax` cookies in production and are never exposed to browser JavaScript. State-changing requests require an origin match and server-issued CSRF token/header.

Authentication lives under `/login`, `/register`, `/check-email`, `/forgot-password`, and `/reset-password`. Registration creates an unverified candidate and normal login is blocked until verification. Internal users land on `/`; candidates land on `/candidate`. Refresh is single-flight inside the BFF. Logout attempts backend revocation and always clears cookies and private query data. Legacy browser token and tenant keys are removed during migration.

Effective capabilities arrive with the current user/session. Navigation and action visibility fail closed for missing capabilities; the API remains the authorization boundary. Manager record scope is rooted in jobs owned by the current user.

## Contract workflow

`apps/api/docs/openapi.json` is authoritative. Generated frontend types are committed at `src/generated/api-schema.ts`.

```text
npm run openapi:generate
npm run api:types:generate --workspace @gedpro/web
npm run api:types:check
```

Never manually edit the generated artifact. CI fails when the backend document or generated TypeScript is stale.

## Errors and response modes

`apiRequest` normalizes validation, unauthenticated, forbidden, not-found, conflict, rate-limit, server, and network failures while retaining message arrays and request IDs. It supports JSON, empty `204`, text, blob, and multipart semantics. A `403` does not clear a valid session.

## Cache policy

- Current user: query key `['session', 'current-user']`; removed with all private cache data at logout or terminal expiry.
- Pipeline and recent activity: 20 seconds stale, 5 minutes retained.
- Metrics and interviews: 45 seconds stale, 5 minutes retained.
- Candidate search: 60 seconds stale, 5 minutes retained.
- Candidate detail: intended 1–2 minute stale time when its route is added.

Query keys include authenticated user scope and every result-changing filter. There is no tenant scope in the current product. Filters (`jobId`, `search`, `sortBy`, `sortOrder`, `page`, `limit`) remain URL-backed. TanStack Query passes abort signals to requests.

Stage changes retain their snapshot/rollback behavior and invalidate only pipeline, metrics, affected candidate, and activity keys.

## Feature organization

- `src/generated`: generated contract only.
- `src/server/bff`: server-only credentials, refresh, CSRF, and NestJS proxy behavior.
- `src/shared/api`, `auth`, `components`, `forms`, and `query`: cross-feature foundations.
- `src/features/<domain>`: domain API adapters, query keys, mutations, forms, and route-owned components.
- `src/app`: route composition and route-level boundaries.

Server state belongs in TanStack Query; shareable filters belong in the URL; transient presentation state remains local. New forms use React Hook Form and Zod, and new server collections use the shared table/filter/pagination conventions.
