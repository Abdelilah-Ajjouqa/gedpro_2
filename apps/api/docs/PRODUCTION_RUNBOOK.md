# GEDPro production runbook

## Deployment and rollback

CI builds and tests the application, applies every migration, rolls the newest migration back, reapplies it, runs the E2E recruitment workflow, and builds the production image. Deploy immutable image digests. Before rollout, take database backups and record the current image digest. Apply migrations once as a release job, then start application instances and require `GET /v1/health/ready` to succeed before receiving traffic.

For application rollback, redeploy the preceding image digest. Revert a migration only after confirming that the preceding application version cannot operate on the forward-compatible schema; run `npm run migration:revert` once per release migration. Never roll back a destructive schema change without a verified backup.

## Backups and restore drills

Run `scripts/backup.ps1` on a schedule outside the application container and copy encrypted artifacts to access-controlled, off-site storage. Retention, encryption keys, and the schedule belong to the deployment platform. At least quarterly, create empty `gedpro_restore` databases and run:

```powershell
./scripts/restore-drill.ps1 backups/postgres-<timestamp>.dump backups/mongodb-<timestamp>.archive
```

Record the artifact IDs, duration, row/collection checks, operator, and result. The drill deliberately targets isolated restore databases and never the live names.

## Observability and alerts

Every response carries `X-Request-Id`; a valid inbound ID is preserved. JSON request logs contain the same ID and W3C `traceparent` when supplied. Scrape `GET /v1/metrics` and graph request rate, error rate, and duration. Protect the metrics route at the ingress/network layer.

Alert on readiness failure, sustained 5xx responses, p95 latency regression, background jobs in `dead_letter`, old pending jobs, disk/object-store errors, database saturation, and backup failures. Page immediately for readiness or sustained error-budget burn; create a ticket for capacity trends.

## Incident response

1. Declare an incident, assign an incident lead, and record UTC timestamps.
2. Use the request ID to correlate ingress and application logs; check readiness, metrics, databases, object storage, and background workers.
3. Stop the blast radius by disabling the affected integration, scaling workers down, or rolling back the image. Preserve logs and audit evidence.
4. Communicate impact and recovery status. Do not expose candidate data in incident channels.
5. Verify the critical workflow after recovery and write a blameless follow-up with owners and deadlines.

## Failure and security exercises

Before a production launch and after major infrastructure changes, test database and object-store loss, worker restarts during jobs, duplicate webhook delivery, rate limits, expired/revoked tokens, authorization boundaries, upload signature/malware rejection, and recovery from backup. Run load tests against a non-production environment using representative list, timeline, and report queries; establish latency and capacity baselines rather than committing environment-specific thresholds here.
