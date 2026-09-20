# Phase 0 verification record

## Implemented

- Corrected auth/profile/error OpenAPI schemas and committed generated TypeScript contract.
- Verification-gated registration/login and 12-character backend/frontend password minimum.
- Server-computed effective capabilities and capability-driven navigation.
- Next.js BFF with HttpOnly cookie sessions, single-flight rotation, CSRF origin/token validation, logout revocation, and legacy browser-storage cleanup.
- Query-backed current user, identity-scoped cache keys, private-cache cleanup, multi-tab logout, safe redirects, `/candidate`, and `/check-email`.
- Shared page, breadcrumb, async-state, form/error, dialog/confirmation, notification, table, filter, pagination, and query-key foundations.
- Vitest/Testing Library/jest-axe and Chromium Playwright infrastructure with CI integration.
- Job-owner manager scope for jobs, applications, candidates, timelines, interviews, and existing reporting behavior. Interviewer eligibility now rejects candidate accounts.

## Verified

- API unit tests: 57 passed across 21 suites.
- Frontend unit/component tests: 11 passed across 3 files.
- Accessibility test: 1 passed.
- Chromium E2E: 3 foundation tests (login surface, CSRF issue, missing-CSRF rejection).
- API and web lint pass within their configured warning policies.
- API build, strict web typecheck, OpenAPI freshness, generated-type drift check, and production web build pass.

## Remaining before Complete

- Audit and enforce job-owner manager record scope in every manager-readable forms, documents, and communications operation; add cross-manager integration coverage.
- Expand authenticated BFF E2E coverage against a deterministic backend fixture for login, refresh rotation, terminal expiry, and logout cookie clearing.
- Add focused BFF tests for cookie flags and successful CSRF forwarding, not only rejection behavior.

Phase 0 must remain `In progress` until these items and the plan's acceptance criteria have verification evidence.
