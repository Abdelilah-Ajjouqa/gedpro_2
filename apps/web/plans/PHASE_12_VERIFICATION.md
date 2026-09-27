# Phase 12 verification record

Status: **In progress — release blocked**

This record is intentionally not a release sign-off. It records the implemented
integration slice and preserves the Phase 12 rule that missing evidence cannot
be inferred from the presence of routes.

## Implemented in this slice

- The production `/communications` build blocker is resolved with a route-level
  Suspense boundary.
- Desktop and mobile navigation share one capability-filtered registry in the
  approved product order. The unsupported global-search affordance is removed.
- Every internal shell has one skip link; active-route matching does not confuse
  similarly prefixed paths.
- Public candidate registration and the candidate placeholder are removed from
  the released UI. Candidate sessions are immediately logged out instead of
  entering the internal shell.
- Private query state revalidates on focus and reconnect. Logout, expiry, and
  identity-change events clear private cache across tabs using BroadcastChannel
  plus a storage-event fallback.
- Terminal API 401 responses trigger local private-cache clearing and a safe
  login redirect. API 403 responses remain authorization failures.

## Automated evidence

Run on Windows from `D:\Projects\gedpro_2` on 2026-09-27:

| Gate | Result |
| --- | --- |
| `npm run lint --workspace @gedpro/web` | Pass |
| `npm run typecheck --workspace @gedpro/web` | Pass |
| `npm run test --workspace @gedpro/web` | Pass — 6 files, 19 tests |
| `npm run test:a11y --workspace @gedpro/web` | Pass — 1 file, 1 axe test |
| `npm run build --workspace @gedpro/web` | Pass — 32 static pages generated |

The tests include route order/uniqueness, capability denial, exact active-route
matching, and strict parsing of non-sensitive cross-tab session events.

## Release blockers retained from the plan

- Phase 0–10 completion records and the connected live-stack role journey are
  not yet available. Phase 11 remains optional and disabled by default.
- Live multi-context browser evidence, the full mutation invalidation matrix,
  fault-state coverage, and the Firefox/WebKit/mobile/accessibility matrices are
  outstanding.
- Monitoring procurement/destination, alert ownership, redaction validation,
  performance budgets, security/privacy scans, staging soak, canary, backup
  restore, and rollback rehearsal require environment and organizational
  evidence not present in this repository.
- Owning-phase domain blockers listed in `PHASE_12_PLAN.md` remain release
  blockers unless completed or explicitly excluded by an approved manifest.

No release-ready claim should be made until every retained blocker has durable
evidence tied to the candidate commit and artifacts.
