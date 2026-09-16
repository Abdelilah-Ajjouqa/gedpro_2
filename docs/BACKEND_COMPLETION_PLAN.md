# GEDPro Backend Completion Plan

## Purpose

Use this document to complete the GEDPro backend one phase at a time. Each phase is intentionally scoped so it can be implemented in a separate conversation without mixing unrelated changes.

At the beginning of each conversation, ask the agent to:

1. Read this document and `docs/ROADMAP.md`.
2. Inspect the current repository and recent Git history.
3. Implement only the selected phase.
4. Preserve existing behavior unless the phase explicitly requires a migration.
5. Add migrations, authorization, validation, Swagger documentation, and tests.
6. Run build, unit tests, E2E tests, and a live Docker smoke test.
7. Create one or more focused Git commits.
8. Update this document with the completed work and any follow-up decisions.

## Definition of done for every phase

A phase is complete only when:

- Database changes have reversible TypeORM migrations.
- DTO input is validated and unexpected fields are rejected.
- Authorization is applied to every new endpoint.
- Swagger documents requests, responses, authentication, and expected errors.
- Unit tests cover important service rules and failure cases.
- Integration or E2E tests cover the main successful workflow.
- `npm run build`, unit tests, and E2E tests pass.
- The running Docker stack passes a live smoke test.
- Documentation and REST examples are updated.
- Changes are saved in focused Git commits.

## Phase 1 — Authentication and security

### Scope

- Refresh-token rotation with hashed token storage.
- Secure logout and token revocation.
- Password-reset requests using short-lived, single-use tokens.
- Email verification using short-lived, single-use tokens.
- Login attempt throttling and temporary account lockout.
- Global and authentication-specific rate limits.
- Configurable CORS origins and secure HTTP headers.
- Capability-based permissions in addition to broad roles.
- Security audit events for login and account changes.
- Review and remediate vulnerable direct dependencies safely.

### Important rules

- Do not store refresh, reset, or verification tokens in plaintext.
- Password-reset requests must not reveal whether an email exists.
- Revoked refresh tokens must never be reusable.
- Public registration must always create a candidate account.
- Existing access tokens should continue working during the migration where practical.

### Completion criteria

- Login returns short-lived access and rotating refresh tokens.
- Logout invalidates the relevant session.
- Password reset, email verification, lockout, and token reuse have tests.
- Sensitive values never appear in responses or logs.

## Phase 2 — Configurable hiring pipelines

### Scope

- Reusable pipeline templates.
- Ordered custom stages.
- Pipeline assignment to each job.
- Stage categories such as applied, screening, interview, offer, hired, rejected, and withdrawn.
- Allowed-transition rules.
- Stage reordering and archiving.
- Reopen rejected or withdrawn applications.
- Bulk application movement with per-item results.
- Migration from the current fixed application-stage enum.

### Important rules

- Store the active stage as a relation rather than a fixed enum.
- Do not delete stages referenced by history; archive them instead.
- Every transition must remain transactional and create immutable history.
- Terminal outcomes must require explicit reopen behavior.

### Completion criteria

- Different jobs can use different pipelines.
- Invalid transitions produce clear validation errors.
- Existing applications remain accessible after migration.
- Concurrent transitions cannot silently overwrite one another.

## Phase 3 — Complete candidate management

### Scope

- Update candidate details.
- Archive and restore candidates.
- Search, filters, sorting, and consistent pagination.
- Candidate tags and skills.
- Recruitment source and recruiter ownership.
- Duplicate detection using normalized email and phone values.
- Controlled candidate merge workflow.
- Privacy consent, retention, export, and deletion fields/workflows.

### Important rules

- Prefer archiving over destructive deletion.
- A merge must preserve applications, documents, interviews, responses, and history.
- Normalize email and phone data before duplicate comparisons.
- Personal-data export and deletion operations must be audited.

### Completion criteria

- Recruiters can manage candidates without direct database access.
- Duplicate records can be reviewed and safely merged.
- Archived records are excluded by default but remain recoverable.

## Phase 4 — Unified activity timeline

### Scope

Create a chronological timeline containing:

- Application-stage changes.
- Candidate profile changes.
- Internal notes.
- Documents.
- Forms and responses.
- Interviews and scorecards.
- Emails and notifications.
- Relevant audit events.

### Important rules

- Each event includes type, actor, timestamp, visibility, target, and structured metadata.
- Do not copy large source objects into timeline records unnecessarily.
- Timeline pagination must be stable when new events are added.

### Completion criteria

- One endpoint explains the complete candidate or application journey.
- Permissions prevent candidates from reading private recruiter events.

## Phase 5 — Interviews and scorecards

### Scope

- Interview rescheduling.
- Completed, cancelled, and no-show outcomes.
- Multiple rounds and interview panels.
- Interviewer availability and scheduling-conflict detection.
- Scorecard templates linked to jobs or pipeline stages.
- Structured ratings, recommendations, and private notes.
- Feedback deadlines and missing-feedback tracking.
- Optional hidden feedback until all assigned reviewers submit.
- Calendar-provider abstraction.
- Google and Microsoft Calendar integrations after the core lifecycle is stable.

### Important rules

- Validate candidates, applications, interviewers, and attendees before saving.
- Calendar failures must not corrupt internal interview state.
- Conflict overrides require an explicit permission and audit event.

### Completion criteria

- Interview state changes and feedback are fully audited.
- Conflicting appointments are rejected or explicitly overridden.
- Hiring decisions expose completed and missing scorecards.

## Phase 6 — Document management

### Scope

- Associate documents with candidates and applications.
- Authorized download and preview endpoints.
- Replace, archive, and delete operations.
- Document categories and versions.
- Storage-provider interface.
- Local disk storage for development.
- S3-compatible object storage for production.
- Generated object keys, file checksums, and duplicate detection.
- Malware scanning.
- Expiring download URLs.
- Retention and orphan-cleanup jobs.

### Important rules

- Check permissions for every document operation.
- Never trust a filename, extension, or browser-provided MIME type alone.
- Coordinate storage and metadata failures to avoid orphaned files.
- Production must not depend on container-local storage.

### Completion criteria

- Authorized users can complete the full document lifecycle.
- Unauthorized access and unsafe files are rejected.
- Cleanup jobs are idempotent and observable.

## Phase 7 — Forms and evaluations

### Scope

- Edit, duplicate, archive, and delete forms.
- Stable field identifiers.
- Form versioning.
- Required and conditional fields.
- Answer validation against field definitions.
- Link forms to jobs, applications, and pipeline stages.
- Response review, filtering, and export.

### Important rules

- Published form versions must be immutable.
- Updating a form must not corrupt historical responses.
- Validate answer types, required fields, selections, dates, and referenced files.

### Completion criteria

- Invalid submissions return field-level errors.
- Historical responses remain readable after later form changes.
- Forms can be assigned automatically during pipeline stages.

## Phase 8 — Communication and background jobs

### Scope

- Versioned email templates.
- Application acknowledgements.
- Interview invitations and reminders.
- Rejection and offer messages.
- Communication history.
- Notification preferences.
- Background job queue.
- Retry and dead-letter handling.
- Idempotency keys.
- Provider delivery-status webhooks.

### Important rules

- API requests must not wait for email delivery.
- Retries must not create duplicate messages.
- Template rendering must escape untrusted content.
- Webhook signatures must be verified.

### Completion criteria

- Recruiters can inspect delivery status and retry failures safely.
- Jobs survive process restarts and record their attempts.

## Phase 9 — Reporting and exports

### Scope

- Hiring funnel and stage conversion.
- Time-to-first-review, time-in-stage, and time-to-hire.
- Rejection reasons.
- Candidate-source effectiveness.
- Recruiter and interviewer workload.
- Job performance.
- CSV and Excel exports.
- Asynchronous generation for large reports.

### Important rules

- Document every metric definition and date boundary.
- Apply permissions before aggregation and export.
- Generated exports must expire after a configurable period.

### Completion criteria

- Reports produce stable results from known fixtures.
- Large reports do not block normal API traffic.
- Exported fields match the requesting user's permissions.

## Phase 10 — Production readiness

### Scope

- Consistent pagination and filtering across modules.
- API versioning and backward-compatibility policy.
- Database indexes based on real query patterns.
- Structured logging and request correlation IDs.
- Metrics, tracing, dashboards, and alerts.
- Automated backups and restore drills.
- CI/CD pipeline.
- Migration checks in CI.
- Comprehensive integration and E2E tests.
- Load, failure-recovery, and security testing.
- Deployment, rollback, and incident runbooks.

### Completion criteria

- A clean environment can be deployed automatically.
- Migrations can be applied and rolled back safely.
- Backups have been restored successfully in a test environment.
- Critical recruitment workflows have full E2E coverage.
- Production failures are visible and actionable.

## Phase 11 — Optional responsible AI

### Scope

- Structured CV extraction.
- Full-text and semantic candidate search.
- Candidate-to-job matching suggestions.
- Interview-question suggestions.
- Candidate and application summaries.
- Model, prompt, latency, token, and cost tracking.
- Human feedback and override recording.
- Quality and bias monitoring.

### Mandatory guardrails

- AI output remains advisory.
- AI must never make an automatic hiring decision.
- Matching suggestions must expose supporting evidence.
- Protected characteristics must be excluded from ranking inputs.
- Users must be able to correct extracted information.

## Recommended implementation order

```text
Authentication and security
  -> Configurable pipelines
  -> Candidate management
  -> Unified timeline
  -> Interviews and scorecards
  -> Documents
  -> Forms and evaluations
  -> Communication and background jobs
  -> Reporting
  -> Production readiness
  -> Optional AI
```

## Suggested prompt for each new conversation

```text
Read docs/BACKEND_COMPLETION_PLAN.md and docs/ROADMAP.md, then implement Phase <number> only.

Inspect the existing implementation and Git history before changing anything. Complete every item in that phase that is practical within the repository, including reversible database migrations, DTO validation, authorization, Swagger documentation, unit tests, E2E tests, Docker smoke testing, documentation updates, and focused Git commits.

Do not begin the next phase. Report completed items, verification evidence, remaining risks, and commit hashes.
```

## Progress tracking

| Phase                            | Status   | Completion commit(s) | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | -------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Authentication and security   | Complete | `dc3e68d`            | Rotating hashed refresh sessions, logout/revocation, hashed single-use action tokens, lockout, rate limits, CORS/headers, capabilities, audit events, and security tests. Email delivery is deferred to Phase 8; tokens are persisted for a delivery worker and never returned or logged.                                                                                                                                                                                                                                                          |
| 2. Configurable hiring pipelines | Complete | `c8251c8`            | Relational reusable pipelines, ordered/archivable stages, transition graphs, job assignment, preserved enum migration, explicit reopen, bulk results, row locking/versioning, and E2E workflow coverage.                                                                                                                                                                                                                                                                                                                                           |
| 3. Candidate management          | Complete | `4c71b5e`            | Normalized duplicate detection, update/search/filter/sort/pagination, tags/skills/source/owner, archive/restore, controlled merge, consent/retention/export/erasure workflows, auditing, and E2E coverage.                                                                                                                                                                                                                                                                                                                                         |
| 4. Unified activity timeline     | Complete | `d11236e`            | Stable cursor-paginated candidate/application timelines, internal and candidate-visible notes, compact source references, candidate self-access controls, event writers for current recruitment modules, and relational-history backfills. Email/notification events will use the same writer when Phase 8 introduces those records.                                                                                                                                                                                                               |
| 5. Interviews and scorecards     | Complete | `a2f2a61`            | Application-linked multi-round panels, conflict detection and privileged overrides, rescheduling/outcomes, structured scorecards and missing-feedback summaries, hidden feedback, timeline audits, and failure-isolated calendar-provider abstraction. Google/Microsoft adapters remain deferred until credentials and Phase 8 delivery infrastructure exist.                                                                                                                                                                                      |
| 6. Document management           | Complete | `14ca358`            | Candidate/application associations, role and ownership checks, authorized preview/download, signed expiring URLs, replace/archive/delete lifecycle, categories and versions, SHA-256 duplicate detection, content-signature validation and malware-test rejection, local/S3-compatible providers, retention cleanup, immediate orphan compensation, reversible migration, tests, and a healthy MinIO-backed Docker smoke test. A dedicated external antivirus engine can replace the built-in scanner when production infrastructure provides one. |
| 7. Forms and evaluations         | Complete | `c7dbddf`            | Stable field identifiers, immutable published versions and response snapshots, conditional/type/file validation with field-level errors, job/application/stage assignments, lifecycle operations, review filtering, CSV export, and E2E coverage. MongoDB is schema-flexible, so this phase requires no TypeORM schema migration.                                                                                                                                                                                                                  |
| 8. Communication and jobs        | Complete | `9f24de8`            | Versioned immutable templates, asynchronous PostgreSQL-backed jobs, escaped rendering, application/interview/outcome messages, preferences, history, idempotency, retries/dead letters, timeline events, and signed delivery webhooks. The built-in log provider is for development; production should bind a provider that honors idempotency keys.                                                                                                                                                                                               |
| 9. Reporting and exports         | Complete | `88ba2f8`            | UTC boundary-defined funnel/conversion and velocity metrics, rejection/source/workload/job reporting, role-scoped CSV/XLSX background exports, expiry enforcement, migration, unit tests, and E2E workflow coverage. Aggregate exports intentionally exclude candidate PII.                                                                                                                                                                                                                                                                        |
| 10. Production readiness         | Complete | `5eb5e00`            | Version-compatible `/v1` API with legacy deprecation headers, standardized collection policy, query indexes, correlation-aware structured logs and metrics, CI migration rollback/E2E/image checks, backup and isolated restore-drill automation, full critical-workflow E2E coverage, and deployment/rollback/incident/testing runbooks. Dashboard and alert resources remain deployment-platform responsibilities; required signals and alerts are documented.                                                                                   |
| 11. Responsible AI               | Optional | —                    | Begin only after governance foundations exist.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
