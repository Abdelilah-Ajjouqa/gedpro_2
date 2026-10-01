# Phase 12 verification record

Status: **Complete for the repository release candidate**

This record captures the automated and connected-stack evidence used to close
Phase 12. Production rollout remains an operational activity: environment
configuration, monitoring ownership, backups, canary rollout, and rollback
rehearsal must be completed in the target deployment environment.

## Integration and hardening completed

- Navigation and released routes are capability-filtered and free of dead
  placeholders.
- Private query state revalidates on focus and reconnect, and session changes
  clear private cache across tabs.
- Session-expiry handling is tied to requests that began with a session marker,
  preventing stale anonymous requests from expiring a newly established login.
- Login submission is held until hydration and uses POST semantics as a
  defense-in-depth measure, preventing credentials from appearing in a URL.
- Client-only interview timezone state is no longer sent as an unsupported API
  query parameter.
- PostgreSQL application transitions lock only the application row, avoiding an
  invalid `FOR UPDATE` lock on nullable outer-join records.
- API end-to-end fixtures and concurrency headers match the current contract.
- OpenAPI artifacts and generated frontend types are synchronized.

## Automated evidence

Run on Windows from `D:\Projects\gedpro_2` on 2026-09-28:

| Gate | Result |
| --- | --- |
| API lint | Pass (91 warnings, within the configured budget of 107) |
| API unit tests | Pass - 21 suites, 57 tests |
| API build | Pass |
| API end-to-end tests | Pass - 4 tests against PostgreSQL, MongoDB, and MinIO |
| OpenAPI drift check | Pass |
| Generated frontend API type check | Pass |
| Frontend lint | Pass |
| Frontend strict TypeScript check | Pass |
| Frontend unit/component tests | Pass - 6 files, 19 tests |
| Frontend accessibility test | Pass - 1 axe test |
| Frontend production build | Pass - 32 pages |
| Playwright browser suite | Pass - 4 tests |

## Connected browser evidence

The browser suite signs in as an administrator against the live API and opens
every released navigation route. The run completed without post-login browser
console errors or HTTP 4xx/5xx responses. It also covers anonymous route
protection, authentication navigation, theme persistence, and mobile
navigation.

## Release boundary

The repository is a verified release candidate. A public production release
still requires target-environment evidence for secrets and integrations,
monitoring and alert routing, backup/restore, security and privacy review,
staging soak, canary rollout, and rollback rehearsal. Those checks cannot be
proven solely from repository code and are not represented as incomplete
product phases.
