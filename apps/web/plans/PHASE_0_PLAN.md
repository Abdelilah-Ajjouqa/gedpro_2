# Phase 0 — Frontend platform and contract foundation implementation plan

## Objective

Establish a typed, role-aware, testable frontend platform on which Phases 1–12 can add product workflows without inventing new conventions for transport, authorization, session handling, page composition, forms, tables, feedback, or tests.

This phase is complete when a small reference route and its tests prove the shared foundations, not when any later-phase business workflow is delivered. The existing dashboard and authentication pages remain functional throughout the work.

Current-state findings that the implementation must account for:

- The web app is Next.js 16/React 19 with strict TypeScript, Tailwind, Radix primitives, TanStack Query, and no frontend test runner, form library, schema validator, toast system, or generated API types.
- `apiRequest` assumes JSON success bodies, models errors as only message/status, stores both tokens in `localStorage`, and performs single-flight refresh. Logout is best-effort, but its `204` response is incompatible with unconditional `response.json()`.
- `AuthProvider` loads `GET /users/profile` but clears the session for every profile error; protected routing is client-only; QueryClient is dashboard-local; cached private data is not explicitly cleared when identity changes.
- The backend rotates refresh tokens, defaults access-token lifetime to 15 minutes and refresh-token lifetime to 7 days, revokes one refresh session on logout, and revokes all sessions after password reset.
- Backend roles are `admin`, `rh`, `manager`, and `candidate`; no `interviewer` role exists. Named permissions are currently used only by user-management endpoints, and effective capabilities are not yet returned to the client.
- The committed OpenAPI document is drift-checked against backend generation, but the frontend does not consume it. Its token-pair schema omits runtime `expiresIn`, `ApiError` omits runtime `requestId`, and reflected `User` includes sensitive/internal fields that runtime public responses remove.
- Page collections use `{ data, total, page, limit }`, timelines use `{ data, nextCursor }`, and the global validation pipe rejects unknown request fields.

## User roles and permissions

Define a closed `UserRole` from the OpenAPI enum and consume server-computed effective capabilities through a centralized, fail-closed frontend policy. Frontend checks improve presentation; the API remains the security boundary.

| Backend role | Product label | Shell access | Foundation policy |
|---|---|---|---|
| `admin` | Administrator | Recruitment workspace | capabilities returned by the server, including future administration access |
| `rh` | Recruiter | Recruitment workspace | server-returned operational capabilities and user-directory read |
| `manager` | Hiring manager | Recruitment workspace | server-returned capabilities constrained to owned-job data |
| `candidate` | Candidate | Candidate-only experience | own profile/session; no recruitment dashboard |

- Treat “interviewer” as an assignment-constrained internal-user persona, not a role. Eligible assignees are active `admin`, `rh`, or `manager` users. Assignment permits access to and submission of only that interview/scorecard feedback and never grants general recruiter capabilities. Phase 5 must tighten backend assignee validation and assignment authorization; candidates must never be eligible interviewers.
- Add typed capabilities grouped by domain/action, including narrow capabilities such as `interviews:submit-assigned-scorecard`. Return the effective list in current-user/session responses.
- Do not maintain an independent frontend role-to-capability matrix. Move the backend's hard-coded map toward a shared authorization service that computes effective capabilities; the client consumes that output and treats missing/unknown values as denied.
- Provide pure `hasCapability`, `hasAnyCapability`, and `accessibleNavigation` helpers. Remove scattered role-string checks as touched.
- Use job ownership as the authoritative manager scope: managers may access jobs whose `job.owner.id` equals the current user, plus applications and related candidates, interviews, scorecards, forms, communications, timelines, and reports reached through those jobs. Application/candidate owners support assignment or filtering but do not independently grant access. Implement consistent backend query and record guards before manager-facing phases; capability visibility alone is insufficient.
- Test every known role and ensure unknown roles fail closed.

### Navigation policy

- Drive desktop and mobile navigation from one registry containing href, label, icon, placement, required capabilities, and availability.
- Dashboard, Candidates, Jobs, Interviews, and Documents are the intended primary recruitment destinations. Until a later phase supplies the route, omit its dead link via the availability flag.
- Keep profile/account actions in the user menu. Put administration in a gated administration section, but do not link it until Phase 10 creates the route.
- Define `/candidate` as the candidate landing route. Phase 0 supplies the protected route and temporary “workspace not yet available” state; later phases add the candidate's profile/application status, assigned forms, documents, communication preferences, and candidate-visible timeline. The recruiter dashboard must no longer be the candidate fallback.

## User journeys

1. An anonymous user follows a protected deep link, goes to `/login?next=<safe-relative-path>`, signs in, and returns without an open redirect. A default login sends internal users to `/` and candidates to `/candidate`.
2. A valid returning session shows a bounded loading state while `GET /users/profile` establishes the current user before protected content renders.
3. Concurrent same-origin browser requests with an expired server-side session cause the BFF to perform one refresh against NestJS; rotated credentials remain in secure cookies and requests retry at most once.
4. An invalid, expired, revoked, or reused refresh session causes the BFF to clear cookies, the browser to clear identity-scoped cache, and one safe redirect to login with an expiry notice.
5. Logout asks the BFF to revoke the backend refresh session, clears secure cookies and client cache, and reaches login even if remote revocation fails.
6. A user outside a route/action capability sees a stable forbidden state; a backend `403` never destroys a valid session.
7. A developer can build a reference query/form/table from generated operation types and shared foundations without feature-specific infrastructure.

## Routes and navigation

- Preserve `/login`, `/register`, `/forgot-password`, `/reset-password`, and protected dashboard `/`.
- Add `/candidate` as a protected role-aware landing route containing only the temporary unavailable state in Phase 0. Do not implement candidate product features yet.
- Add `/check-email` (or an equivalently named public confirmation route) for post-registration email-verification guidance and enumeration-safe resend.
- Move provider placement/route guarding only as required to give authenticated routes one session and query-cache boundary.
- Add no business-feature routes. Exercise shared components in tests rather than a production showcase route.
- Extract and test one `safeNextPath` utility. Accept only same-origin paths beginning with one `/`; reject protocol-relative/absolute URLs, backslash variants, and auth-loop destinations where appropriate.
- Add shared not-found, forbidden, and route-error presentations only as platform states.

## Backend operations and schemas

Phase 0 directly integrates only:

| Operation | Purpose | Required behavior |
|---|---|---|
| `POST /auth/login` | establish session | reject unverified accounts; BFF stores tokens only in secure cookies; preserve `401`, `429`, and validation errors |
| `POST /auth/register` | candidate registration | create an unverified account without a usable session; frontend redirects to check-email guidance |
| `POST /auth/refresh` | rotate session | BFF-only token access; single-flight; replace both secure cookies atomically |
| `POST /auth/logout` | revoke session | BFF sends refresh token to NestJS, supports `204`, then always clears cookies locally |
| password-reset request/confirm | recovery | preserve enumeration-safe message; clear local session after reset |
| email-verification request/confirm | verification | typed message responses; no new screen required |
| `GET /users/profile` | bootstrap user | distinguish unauthenticated, forbidden/deactivated, retryable, and unexpected failures |

Browser code calls same-origin Next.js BFF endpoints. The BFF is the only web tier that calls the NestJS API or reads access/refresh cookies. Store both tokens in `HttpOnly`, `Secure`, `SameSite=Lax` cookies with restrictive paths where practical and explicit expiry aligned to backend TTLs; document the localhost-only development accommodation for `Secure`. State-changing BFF routes require CSRF validation in addition to SameSite cookies; define origin checks plus a server-issued CSRF token/header convention and test missing, invalid, and cross-origin cases.

Backend foundation work in this phase includes: preventing login/session issuance for unverified accounts; changing registration so its response cannot bootstrap an authenticated session; raising every password-creation/reset minimum to 12; returning effective capabilities with session/current-user data; introducing the reusable authorization/scoping service; and applying owner-rooted manager scope to existing manager-readable queries before later manager-facing phases. Interviewer eligibility is recorded as a release blocker here but implemented with the interview assignment workflow in Phase 5.

### OpenAPI contract workflow

- Use `apps/api/docs/openapi.json` as the sole machine-readable contract and `/v1` as the frontend base.
- Pin `openapi-typescript`, generate type-only output to `apps/web/src/generated/api-schema.ts`, and commit the artifact; never hand-edit it.
- Keep a handwritten transport layer for auth refresh, cancellation, response modes, and domain adapters.
- Add web `api:types:generate` and `api:types:check` scripts. The check regenerates to a temporary location and fails on diff. Root/CI checks run backend `openapi:check` before frontend drift checking.
- Prefer operation/path-derived aliases. Handwritten view models begin beyond the transport boundary and use explicit mappers.
- First correct auth/profile OpenAPI schemas so public `User` omits password/lockout fields, session/current-user responses include effective capabilities, token pairs include `expiresIn`, `ApiError` includes optional `requestId`, and success bodies are explicit. Add backend contract tests for these invariants.
- Treat deliberately free-form later-phase schemas as `unknown`, not `any`; their owning phases must tighten them.
- Generation must be deterministic on Windows/Linux and not require a separately running server.

## Data model and frontend types

Use this target organization, migrating incrementally rather than cosmetically moving the dashboard:

```text
src/
  app/                         # routes and route boundaries
  features/auth/               # auth adapters, session policy, UI
  shared/api/                  # transport, generated helpers, errors
  shared/auth/                 # roles, capabilities, route policy
  shared/components/           # cross-feature compositions
  shared/forms/                # validation/error mapping
  shared/query/                # client factory, keys, cache reset
  generated/api-schema.ts      # generated; never manually edited
```

- Separate wire types, domain/view models, and form values; do not use server entities directly as editable form state.
- Define `ApiErrorPayload`, discriminated `AppError`, `Page<T>`, `CursorPage<T>`, `SortDirection`, and URL codecs.
- Keep numeric IDs at API boundaries and timestamps as ISO strings until centralized presentation formatting.
- Remove `gedpro.tenantId` and do not accept client-supplied tenant identity. The inspected system is not multi-tenant; scope cache by authenticated user/session identity and relevant filters. Any future multi-tenancy work requires a separate cross-stack architecture plan.

## Query keys and cache policy

- Mount one QueryClient for the authenticated application lifecycle, not only the dashboard.
- Feature key factories use: domain, authenticated scope, resource/list identifier, then a canonical object containing every result-changing filter.
- Use `['session', 'current-user']` as the sole server-state source for identity; avoid unrelated duplicate user state.
- Cancel and remove identity-scoped queries on logout, terminal refresh failure, or user change; do not only invalidate them while anonymous.
- Pass abort signals. Do not retry validation, unauthorized, forbidden, not-found, or conflict errors; conservatively retry transient network/5xx reads.
- Preserve dashboard stale times unless regression testing justifies changes; migrate literal keys without broad invalidation.

## Mutations and invalidation

- Standardize typed mutation wrappers and normalized errors while leaving contextual success copy to components.
- Login writes the server-returned current user/capabilities into cache after the BFF establishes cookies. Registration never populates authenticated state; logout/terminal expiry cancels in-flight work before removing private data.
- Provide field/conflict error access and signals where meaningful.
- Keep optimistic updates opt-in, requiring snapshot, deterministic rollback, and explicitly affected keys.
- Notifications are not the only evidence of a state change; update or invalidate visible state.

## Screens and component boundaries

Create narrow shared compositions using existing Radix/shadcn-style primitives:

- `PageShell`, `PageHeader`, `PageActions`, and accessible `Breadcrumbs`.
- `AsyncState` variants for initial loading, background refresh, empty, recoverable error, forbidden, and not found; unexpected route failures use Next error boundaries.
- A semantic, server-controlled `DataTable` with sortable columns, selection hooks, responsive overflow, and loading/empty/error slots. It neither fetches nor owns URL state.
- `Pagination` based on server total/page/limit and URL codec helpers.
- `FilterBar`/`SearchField` that write URL state, reset page on filter changes, and support clear-all.
- `Dialog`/`ConfirmDialog` with labelled content, focus trap/restore, pending state, destructive tone, and named target.
- `FormField` with associated label/help/error/required/pending states; migrate existing auth fields without altering journeys.
- One notification viewport for transient feedback and screen-reader announcements; never expose sensitive details.
- A status-definition convention with label/icon/tone; feature vocabularies remain feature-owned.

Keep unopinionated primitives in `components/ui`, cross-feature compositions in `shared/components`, and domain components in their feature.

## Forms and validation

- Adopt React Hook Form and Zod. Generated OpenAPI types are compile-time contracts; explicit form schemas provide runtime validation.
- Enforce a 12-character minimum for registration, administrator-created users, reset, and future password change. The backend is authoritative and the frontend mirrors it; add no invented composition requirements. Compromised-password screening is deferred.
- Normalize server message arrays into a form summary. Map fields only from stable identifiers or a tested parser; do not silently infer from prose.
- Retain input after failure except where secrets should be cleared; focus the summary or first invalid field.
- Prevent duplicate pending submissions and announce progress. Unsaved-change protection remains for later edit workflows.

## Loading, empty, error, forbidden, and conflict states

Normalize errors while retaining status, backend error, message array, path, timestamp, optional request ID, and safe cause:

- `validation` (`400`, and `422` if added): field/form feedback.
- `unauthenticated` (`401`): one eligible refresh; terminal failure expires session.
- `forbidden` (`403`): retain session and show access state.
- `notFound` (`404`): route/resource state, except the existing development API-base diagnostic.
- `conflict` (`409`): retain current data and offer safe refetch/retry.
- `rateLimited` (`429`): retain session and honor `Retry-After` if exposed.
- `server`/`network`: retry only safe reads and expose retry.
- `aborted`: silent control flow.

Transport supports JSON, empty/`204`, text, blob/download, and multipart requests without forcing JSON content type. Never display raw stacks or unknown bodies.

## Responsive and accessibility requirements

- Shared page, filter, table, pagination, form, dialog, and notification patterns work at mobile/tablet/desktop sizes without page overflow. Tables may use a labelled scroll region; card conversion is feature-owned.
- Preserve semantic landmarks/headings, skip link, visible focus, keyboard operation, and logical order.
- Dialogs trap/restore focus. Destructive confirmation names its object and does not rely on color.
- Use `aria-busy`/status without repeatedly announcing background refetches.
- Link form errors via `aria-describedby`/`aria-invalid`; make summaries link to fields.
- Set `aria-sort`; name icon-only controls; never communicate status only by color.
- Respect reduced motion and existing light/dark themes.

## Security and privacy considerations

- Add adversarial safe-redirect tests; never accept external/protocol-relative `next` values.
- Adopt a Next.js BFF and migrate both tokens out of browser storage into `HttpOnly`, `Secure`, `SameSite=Lax` cookies. Browser code calls same-origin BFF endpoints and cannot read raw credentials after migration.
- Apply CSRF protection to every state-changing same-origin endpoint. SameSite is defense in depth, not the sole control. Validate allowed origin and a server-issued token/header; reject absent, invalid, or cross-origin requests before forwarding.
- Centralize credentials in server-only BFF modules. Redact cookies, tokens, authorization headers, passwords, reset tokens, CSRF secrets, and sensitive bodies from logs/errors. Prevent server-only modules from entering client bundles.
- Remove token and tenant keys from browser storage after a one-time migration cleanup. Use only a non-sensitive event for multi-tab logout via `storage`/`BroadcastChannel`.
- Local logout clears cookies/cache even if NestJS revocation fails; report the remote failure non-blockingly.
- Make unexpected-error request IDs copyable support metadata without exposing internals.
- Contract tests must prevent sensitive `User` fields from reappearing.
- The backend remains the authorization boundary.

## Delivery slices

Every slice is independently reviewable, keeps `npm run check --workspace @gedpro/web` green, and preserves login/dashboard behavior.

### Slice 0.1 — Contract accuracy and generated types

- Correct auth/profile/error OpenAPI schemas; test public-user redaction, capability fields, token fields, request ID, and logout `204`.
- Change registration/login verification behavior, align all password DTOs to 12 characters, and add backend tests proving unverified users receive no normal session.
- Add pinned generation, committed output, drift scripts, and CI/root integration.
- Add operation aliases only for Phase 0 auth/profile calls.
- Review proof: a deliberate contract change fails drift checking; generated user types contain no internal fields.

### Slice 0.2 — Transport and normalized errors

- Add response-mode-aware typed transport, full error parsing/classification, abort behavior, retry metadata, and development API-base diagnostics.
- Keep the dashboard adapter working.
- Review proof: unit tests cover JSON, `204`, malformed/non-JSON error, message arrays, expected HTTP categories, network failure, and abort.

### Slice 0.3 — Session lifecycle and cache isolation

- Add the Next.js BFF, secure cookie issuance/rotation, CSRF protection, and server-only NestJS transport; migrate browser API calls to same-origin endpoints and remove direct token access.
- Make current user query-backed, move QueryClient to the app boundary, and remove legacy token/tenant storage.
- Preserve single-flight rotation/one retry in the BFF; add terminal-expiry signaling, safe role-aware redirects, multi-tab logout, cancellation/cache removal, and best-effort revoke/guaranteed cookie cleanup.
- Route verified internal users to `/`, candidates to `/candidate`, and new registrants to check-email guidance; ensure `403` retains session.
- Review proof: tests cover cookie flags, CSRF rejection/acceptance, client-bundle isolation, restore, concurrent refresh, unverified login denial, refresh failure, logout `204`/offline, identity change, redirect safety, and candidate landing.

### Slice 0.4 — Roles, capabilities, and navigation

- Add backend effective-capability computation/current-user output and frontend consuming helpers/boundaries, route registry, and forbidden presentation. Unknown/missing capabilities deny access.
- Introduce reusable backend authorization scope and enforce job-owner-rooted manager filtering across existing manager-readable jobs/applications and dependent reads; add cross-manager isolation tests.
- Render desktop/mobile navigation from the registry and suppress placeholder routes.
- Document controller/capability traceability and the Phase 5 interviewer assignment gate.
- Review proof: table-driven role tests and identical authorized destinations across nav variants.

### Slice 0.5 — Page, feedback, dialog, and form patterns

- Add page/breadcrumb, async-state, dialog/confirmation, notification, and form/error-summary compositions.
- Add React Hook Form/Zod and migrate one auth form as the reference without behavioral change.
- Review proof: keyboard/focus, accessible association, pending, server-validation, and announcement tests.

### Slice 0.6 — Table/filter/pagination foundation

- Add presentational DataTable, FilterBar/SearchField, Pagination, URL codecs, and query-key conventions.
- Exercise with fixtures/MSW only; do not create a later-phase list route.
- Document page versus cursor collection use.
- Review proof: sorting, bounds, filter reset, selection, async slots, and narrow overflow tests.

### Slice 0.7 — Test harness, CI, and documentation

- Finish shared render/network/auth fixtures, accessibility checks, Playwright, and CI commands.
- Add mocked authenticated smoke tests and separately document live-stack execution.
- Update `API_INTEGRATION.md` with generation, errors, sessions, capabilities, keys, forms, and feature-folder conventions.
- Review proof: a clean install passes the full verification set in CI.

## Test strategy

### Unit and component

- Use Vitest/jsdom, React Testing Library, user-event, and jest-dom.
- Use MSW at the network boundary; handlers use generated aliases and unhandled requests fail tests.
- Add `renderWithProviders` with a fresh QueryClient, router/search adapters, theme/auth defaults, and cleanup.
- Provide role/session factories with fake tokens and no realistic personal data.
- Unit-test URL codecs, query keys, capabilities, redirects, error normalization, and field mapping.
- Component/integration-test session lifecycle, dialogs/forms/tables/navigation, and dashboard compatibility.
- Run `jest-axe` on representative shared states and retain explicit keyboard tests.

### End-to-end

- Use Playwright with Chromium as the required Phase 0 CI gate. Firefox and WebKit become required before Phase 12 release acceptance; run them earlier for cookies/authentication, downloads, uploads, and complex forms as those workflows arrive.
- Start production-like Next through `webServer`; intercept the API for deterministic foundation tests.
- Cover deep-link login/return, restore/refresh, terminal expiry, logout, forbidden access, keyboard nav, and mobile smoke.
- Keep a separately documented live-API smoke profile; do not create later-feature records.
- Retain trace/screenshots only on failure and ensure credentials are absent.

### Contract

- Retain backend `openapi:check`, add generated-type drift checking, and compile-time auth/profile fixtures.
- Add backend assertions for sensitive-field exclusion and exact auth success/error schemas.

## Verification commands

Implementation must make these green:

```text
npm ci
npm run openapi:check
npm run api:types:check --workspace @gedpro/web
npm run lint --workspace @gedpro/web
npm run typecheck --workspace @gedpro/web
npm run test --workspace @gedpro/web
npm run test:a11y --workspace @gedpro/web
npm run build --workspace @gedpro/web
npm run test:e2e --workspace @gedpro/web
```

Also run affected backend/OpenAPI tests plus root lint/build. Record Node/browser versions and whether E2E used mocked API or the live stack.

Manual matrix: all four roles plus unknown role; no/valid/expired/revoked sessions; online/offline logout; second tab; 375px/tablet/desktop; light/dark/reduced-motion/keyboard; and slow, empty, validation, forbidden, not-found, conflict, rate-limit, server, offline, and recovery states.

## Acceptance criteria

- Auth/profile types come from a corrected committed OpenAPI contract; generation is deterministic and CI detects both backend-document and document-type drift.
- The generated artifact is committed, never manually edited, regenerated in CI, and fails CI on a diff.
- Public user types exclude password/lockout fields; session/current-user types include server-computed effective capabilities; token and error schemas match runtime.
- Transport supports JSON/empty/text/blob/multipart, cancellation, the complete error envelope, and expected HTTP categories.
- Browser requests use same-origin BFF endpoints; access/refresh credentials exist only in secure HttpOnly cookies and no application token remains in browser storage or client bundles.
- Every state-changing BFF request is CSRF-protected and cross-origin/missing/invalid-token cases are tested.
- Refresh is server-side, single-flight, and retries at most once. Terminal expiry, logout, password reset, and identity changes clear cookies and private cache.
- Logout works locally for backend `204` and network failure while attempting backend refresh-session revocation.
- Public registration creates an unverified candidate without a usable session; unverified login is rejected; verification leads to sign-in; enumeration-safe resend is preserved.
- All password creation/reset DTOs and forms enforce a minimum of 12 characters without invented composition rules.
- Redirects remain same-origin, preserve legitimate deep links, and default internal users to `/` and candidates to `/candidate`.
- Missing/unknown capabilities deny access, the client has no independent role-capability matrix, and no interviewer role is fabricated.
- Manager reads are consistently rooted in owned jobs, with automated proof that one manager cannot read another manager's jobs or dependent recruitment records merely through application/candidate ownership.
- Interviewer eligibility/assignment enforcement is an explicit Phase 5 entry gate: only active internal users may be assigned, and assignment grants only assigned-feedback access.
- Desktop/mobile navigation share a capability registry and expose no dead feature links.
- Page, breadcrumb, async/forbidden, form, notification, dialog/confirmation, table, filter, and pagination patterns are documented, accessible, responsive, and tested.
- Query keys include identity scope and all result-changing filters; cache is not shared between users.
- Repeatable frontend unit/component/accessibility/E2E infrastructure and authenticated fixtures run in CI.
- Existing auth/theme/dashboard/search/stage-movement behavior remains buildable and regression-tested.
- No workflow assigned to Phases 1–12 is introduced.

## Explicit exclusions

- All business screens/workflows for jobs, candidates, applications, timelines, interviews, documents, forms, communications, reports, user administration, or AI.
- Candidate product features beyond the `/candidate` Phase 0 placeholder, and any interviewer portal.
- Client-invented record scope/ownership/assignment rules unsupported by the API.
- Replacing backend authorization with UI checks.
- CRUD generators, new global state, offline queues, virtualization, global search, command palette, or production design-system showcase.
- Infrastructure/maintenance/webhook screens.
- Broad dashboard visual refactoring unrelated to foundation adoption.

## Open decisions

The ten architecture questions raised during initial planning are resolved above. Implementation still needs these narrower design choices approved within their owning slices:

1. **BFF naming and routing:** finalize the same-origin route namespace and access/refresh cookie names and restrictive paths. Both tokens remain in HttpOnly cookies and inaccessible to browser JavaScript.
2. **CSRF mechanism:** choose and document the server-issued token/header format and rotation rules in Slice 0.3. Origin validation plus the token is required; `SameSite=Lax` alone is insufficient.
3. **Capability vocabulary/versioning:** finalize canonical capability names and whether the response carries a policy/version marker. Unknown capabilities must remain harmless and missing capabilities denied.
4. **Verification delivery dependency:** identify the email delivery/development capture mechanism used by the check-email and verification E2E test. Enumeration-safe responses remain mandatory.
5. **Manager scope edge cases:** decide how unowned legacy jobs, administrator reassignment, and deleted/deactivated owners behave. None may silently broaden manager access.
