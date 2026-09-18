# GEDPro Product Roadmap

## Goal

Evolve the working backend MVP into a secure, usable applicant tracking system. The roadmap prioritizes a coherent hiring workflow before reporting, integrations, and AI.

## Product model direction

The most important domain change is to separate people from their applications:

- A `Candidate` represents a person.
- A `Job` represents an opening.
- An `Application` links one candidate to one job.
- Pipeline state and state history belong to the application, not the candidate.
- Interviews, scorecards, documents, notes, and communications can reference an application.

This allows one candidate to apply for several jobs without mixing their progress.

## Phase 0 — Production foundations

### Scope

- Add TypeORM migrations and disable schema synchronization by default.
- Add an idempotent admin bootstrap CLI using environment-provided credentials.
- Add refresh-token rotation, logout/revocation, password reset, and email verification.
- Hash passwords for every trusted user-creation path.
- Add centralized configuration validation at startup.
- Add structured logs, request correlation IDs, health/readiness endpoints, and audit events.
- Review dependency audit results and upgrade vulnerable direct dependencies safely.
- Add integration tests with isolated PostgreSQL and MongoDB databases.

### Acceptance criteria

- A clean database can be created entirely through migrations.
- No public endpoint can assign a privileged role.
- Passwords and tokens never appear in API responses or logs.
- CI runs build, unit tests, integration tests, and migration checks.
- Health endpoints distinguish process health from database readiness.

## Phase 1 — Jobs and applications

### Data model

Add:

- `Job`: title, description, department, location, employment type, owner, status, opened/closed dates.
- `Pipeline`: reusable ordered stages per organization or job.
- `PipelineStage`: name, order, category, terminal outcome.
- `Application`: candidate, job, current stage, source, owner, timestamps, rejection reason.
- `ApplicationHistory`: previous/new stage, actor, comment, timestamp.

Migrate existing candidate state/history into a default job/application where practical.

### API

- Job CRUD, publish, close, archive, search, filtering, sorting, and pagination.
- Apply an existing or new candidate to a job.
- List applications by job, candidate, owner, stage, and date.
- Move an application between valid stages transactionally.
- Reject, withdraw, reopen, and hire with explicit outcome metadata.
- Detect duplicate candidate emails and duplicate candidate/job applications.

### Acceptance criteria

- One candidate can have independent applications for multiple jobs.
- Invalid stage transitions return a clear validation error.
- Every transition creates an immutable history entry.
- List endpoints use consistent pagination and never return passwords.

## Phase 2 — Recruiter workflow and collaboration

### Scope

- Candidate update, archive, merge, tags, skills, source, and recruiter ownership.
- A unified application timeline for transitions, notes, documents, forms, interviews, and messages.
- Internal notes with mentions and visibility controls.
- Saved filters and assignment queues.
- Optimistic concurrency or version checks for competing edits.

### Acceptance criteria

- Recruiters can find and update records without direct database access.
- Duplicate candidates can be merged without losing application history.
- Audit-sensitive actions record actor, time, target, and relevant changes.

## Phase 3 — Interviews and scorecards

### Scope

- Reschedule interviews and mark them completed, cancelled, or no-show.
- Validate candidate/interviewer existence and detect scheduling conflicts.
- Support multiple rounds and interview panels.
- Add scorecard templates linked to job stages.
- Collect structured interviewer ratings, recommendations, and private notes.
- Prevent feedback visibility until reviewers submit when configured.
- Add calendar provider abstraction; integrate Google/Microsoft calendars later.

### Acceptance criteria

- Overlapping interviewer appointments are rejected or explicitly overridden with permission.
- Interview lifecycle changes are audited.
- Hiring decisions can show completed scorecards and missing feedback.

## Phase 4 — Document management

### Scope

- Associate documents with candidates and applications.
- Add authorized download, preview metadata, replacement, and deletion endpoints.
- Introduce a storage interface supporting local disk in development and S3-compatible storage in production.
- Use generated object keys rather than user filenames.
- Add malware scanning, checksums, retention rules, and expiring download URLs.

### Acceptance criteria

- Authorization is checked for every document operation.
- Failed metadata writes do not leave permanent orphaned files.
- Production instances do not depend on container-local storage.

## Phase 5 — Communication and automation

### Scope

- Reusable, versioned email templates.
- Interview invitation, reminder, rejection, and offer events.
- Delivery status and communication history.
- Notification preferences and retry/dead-letter handling.
- A background job queue for email, parsing, exports, and webhook delivery.
- Idempotency keys for externally triggered actions.

### Acceptance criteria

- API requests do not wait for email delivery.
- Retried jobs cannot send duplicate candidate communications.
- Recruiters can see message status and retry failed deliveries safely.

## Phase 6 — Reporting and exports

### Scope

- Hiring funnel and conversion by job, stage, source, and time period.
- Time-to-first-review, time-in-stage, and time-to-hire.
- Rejection reasons and source effectiveness.
- Recruiter/interviewer workload.
- CSV/XLSX exports with role-aware field selection.
- Privacy retention and deletion reports.

### Acceptance criteria

- Metrics have documented definitions and stable date boundaries.
- Reports exclude unauthorized candidate data.
- Large exports run asynchronously and expire after a configured period.

## Phase 7 — Search, parsing, and responsible AI

### Scope

- Extract structured CV data while retaining the original document.
- Full-text and semantic search for candidates and applications.
- Explainable candidate-to-job match suggestions.
- Draft interview questions and summarize application timelines.
- Track model, prompt version, inputs, output, latency, and cost for each generation.
- Add consent, retention, human-review, and bias-monitoring controls.

### Guardrails

- AI output is advisory and never makes an automatic hiring decision.
- Users can inspect the evidence behind matching suggestions.
- Protected characteristics are excluded from ranking inputs.
- Human overrides and feedback are recorded for evaluation.

## Cross-cutting engineering work

- Version the API or establish a backward-compatibility policy.
- Standardize error responses, pagination, filtering, and OpenAPI examples.
- Add database indexes based on measured query patterns.
- Add rate limits, request-size limits, secure headers, and explicit CORS origins.
- Define RBAC permissions as capabilities rather than controller-only role lists.
- Add observability dashboards, backup/restore tests, and incident runbooks.
- Establish retention, consent, data export, and erasure workflows for candidate privacy.

## Recommended delivery sequence

1. Complete Phase 0 before exposing the service outside local development.
2. Deliver Phase 1 as the first product milestone.
3. Add the recruiter workflow, interviews, and documents in vertical slices.
4. Add asynchronous communication before calendar and external integrations.
5. Build reporting only after application-stage data is reliable.
6. Add AI after search quality, permissions, auditability, and data governance are established.

## First milestone: end-to-end application pipeline

The next implementation should demonstrate this complete story:

1. An admin bootstraps the first trusted account.
2. A recruiter creates and publishes a job with a pipeline.
3. The recruiter creates or reuses a candidate and opens an application.
4. The application moves through configurable stages with immutable history.
5. The recruiter schedules an interview and assigns a scorecard.
6. Interviewers submit feedback.
7. The recruiter records a hired or rejected outcome.
8. The system exposes the full timeline and basic funnel metrics.

### Suggested implementation slices

1. Migrations, configuration validation, admin bootstrap, and CI database tests.
2. Job and pipeline entities plus CRUD APIs.
3. Application entity, duplicate protection, transition service, and history.
4. Candidate search/update/archive and unified application queries.
5. Interview validation, rescheduling, completion, and scorecards.
6. Timeline endpoint and end-to-end tests for the complete milestone.

Each slice should include DTO validation, RBAC rules, OpenAPI examples, unit tests, integration tests, and a migration.
