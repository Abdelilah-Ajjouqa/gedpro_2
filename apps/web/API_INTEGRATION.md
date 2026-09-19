# Frontend API integration

The dashboard reads `NEXT_PUBLIC_API_URL` (default: `http://localhost:3001/v1`) and uses TanStack Query for request state and caching.

On a `401` response the dashboard presents a sign-in form and stores the returned access token in `localStorage['gedpro.accessToken']`. A tenant or authorization scope can be stored in `localStorage['gedpro.tenantId']`; it is included in every query key to prevent cache reuse across scopes.

## Cache policy

- Pipeline and recent activity: 20 seconds stale, 5 minutes retained.
- Metrics and interviews: 45 seconds stale, 5 minutes retained.
- Candidate search: 60 seconds stale, 5 minutes retained.
- Candidate detail keys are invalidated after a stage mutation and are intended for a 1–2 minute stale time when the detail view is added.

Stage changes optimistically move a candidate in every active pipeline cache. Failed requests restore captured snapshots. Settling the mutation invalidates only pipeline, metrics, affected candidate, and activity queries.

Filters (`jobId`, `search`, `sortBy`, `sortOrder`, `page`, and `limit`) are represented in the URL and query keys. TanStack Query passes its abort signal to every fetch, so superseded filter requests are cancelled.
