# GEDPro

GEDPro is a NestJS backend MVP for applicant tracking and recruitment document management. It uses PostgreSQL for users, candidates, documents, and interviews, plus MongoDB for dynamic forms and responses.

## Features

- JWT authentication and role-based access (`admin`, `rh`, `manager`, `candidate`)
- Candidate lifecycle with transactional history entries
- Candidate search, tags/skills, ownership, duplicate merge, archiving, and privacy workflows
- Versioned PDF/JPG/PNG document management with content-signature validation, checksums, retention, local development storage, and S3-compatible production storage
- Versioned forms and evaluations with stable field IDs, conditional validation, pipeline-stage assignment, review, and CSV export
- Versioned email templates, notification preferences, communication history, signed delivery webhooks, and a durable retrying background-job queue
- Interview scheduling and cancellation
- Job lifecycle and searchable, paginated job listings
- Per-job applications with transactional stage history
- Reusable hiring pipelines with ordered custom stages and transition rules
- OpenAPI documentation through Swagger

## Quick start with Docker

Prerequisites: Docker with Compose.

```bash
docker compose up --build -d
docker compose ps
```

The API is available at `http://localhost:3000` and Swagger at `http://localhost:3000/api`.
The machine-readable OpenAPI document is available at `http://localhost:3000/api-json`. Swagger preserves the bearer token entered through its Authorize button while the page remains open.

A version-controlled API contract is stored at [`docs/openapi.json`](docs/openapi.json). Frontend clients should target the `/v1` server from that document. Regenerate and verify it with:

```bash
npm run openapi:generate
npm run openapi:check
```

The check fails when the committed contract is stale, an operation lacks a successful response, or a non-empty successful response lacks a content schema. Inferred entity schemas are used where possible; composite responses that do not yet have a dedicated DTO are deliberately represented as free-form JSON instead of an inaccurate generated type.

The Compose stack starts the application, PostgreSQL 16, MongoDB 7, and MinIO for production-style S3-compatible document storage. PostgreSQL is exposed on `5432`, MongoDB on `27018`, and MinIO on `9000` (console `9001`). Local non-production runs default to `./uploads`.

Stop the stack with `docker compose down`. Add `-v` only when you intentionally want to delete database data.

## Run the app locally

Prerequisites: Node.js 20+, PostgreSQL, and MongoDB.

1. Copy `.env.example` to `.env` and adjust credentials.
2. Start PostgreSQL and MongoDB (you can start only those services with `docker compose up -d postgres mongodb`).
3. Install and run the app:

```bash
npm ci
npm run build
npm run start:dev
```

Database schema changes are managed by TypeORM migrations. `DB_SYNCHRONIZE` must remain `false` in production; `DB_MIGRATIONS_RUN=true` applies pending migrations during application startup. Replace `JWT_SECRET` with a long random value in every non-local environment.

The upload directory is created automatically. Change it with `UPLOAD_DIR` if needed.

### Database migrations

```bash
# Generate a migration after changing entities
npm run migration:generate -- src/database/migrations/DescribeChange

# Apply or revert migrations
npm run migration:run
npm run migration:revert
```

### Bootstrap the first administrator

Set `ADMIN_EMAIL` and an `ADMIN_PASSWORD` of at least 12 characters, then run:

```bash
npm run admin:bootstrap
```

The command is idempotent: it will not replace an existing account or its password.

### Health checks

- `GET /health` confirms the HTTP process is running.
- `GET /health/ready` verifies both PostgreSQL and MongoDB connectivity.

API errors use one predictable shape containing `statusCode`, `error`, `message`, `path`, and `timestamp`. Validation failures return `message` as a list of field-level problems.

## API smoke test

Use [requests.http](requests.http) with the VS Code REST Client. Public registration always assigns the `candidate` role. After login, pass `Authorization: Bearer <token>` to protected routes. Administrative roles must be provisioned through a trusted process rather than public registration.

| Area           | Endpoints                                                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth           | Register, login, refresh rotation, logout, password reset, and email verification under `/auth`                                                                                             |
| Users          | `GET /users/profile`, `/users` CRUD (role-restricted)                                                                                                                                       |
| Candidates     | `GET/POST /candidates`, `PATCH /candidates/:id/state`                                                                                                                                       |
| Documents      | `GET /documents`, `POST /documents/upload`, `GET /documents/:id/download`, `GET /documents/:id/url`, `POST /documents/:id/replace`, `PATCH /documents/:id/archive`, `DELETE /documents/:id` |
| Forms          | Create/edit/publish/duplicate/archive under `/forms`; assignments, validated submissions, response review/filtering, and CSV export                                                         |
| Interviews     | `GET/POST /interviews`, `PATCH /interviews/:id/cancel`                                                                                                                                      |
| Jobs           | `GET/POST /jobs`, `PATCH /jobs/:id`, publish/close/archive actions                                                                                                                          |
| Applications   | `GET/POST /applications`, `PATCH /applications/:id/stage`                                                                                                                                   |
| Pipelines      | Pipeline CRUD, stage ordering/archiving, and allowed transitions under `/pipelines`                                                                                                         |
| Responsible AI | CV extraction/correction, candidate search, explainable matching, interview questions, application summaries, feedback, and monitoring under `/ai`                                          |

Uploaded files accept PDF, JPG, or PNG up to 5 MiB.

## Quality gates

Run the same core checks used by CI before opening a pull request:

```bash
npm run lint
npm run build
npm run test:cov
npm run test:e2e -- --runInBand
npm run openapi:check
```

Coverage has an initial repository-wide floor of 30% for statements, branches, and lines, and 15% for functions. Raise these thresholds as coverage is added; do not lower them to accommodate new untested code. Type-aware unsafe-value findings in application code remain visible as warnings while request and ORM boundary types are tightened incrementally.

### Authentication security

Login and registration return a short-lived `accessToken`, a rotating `refreshToken`, and the backward-compatible `token` access-token alias. Refresh, reset, and verification secrets are stored only as hashes. Reset requests do not reveal whether an email exists, and logout or password reset revokes applicable sessions.

Configure distinct random `JWT_SECRET` and `JWT_REFRESH_SECRET` values, explicit `CORS_ORIGINS`, and the token TTL, lockout, and rate-limit settings documented in `.env.example`. Email delivery is part of Phase 8; action tokens are ready for a delivery worker and are never returned or logged.

### Configurable hiring pipelines

Create a reusable pipeline before creating a job, then provide its `pipelineId` in the job request. Applications start in the first active stage and move using a `stageId`; moves outside the configured transition graph are rejected. Rejected and withdrawn applications require `POST /applications/:id/reopen`. Stages are archived rather than deleted, and `POST /applications/bulk-move` returns a result for every item.

### Candidate management and privacy

`GET /candidates` supports search, tag, skill, source, owner, archive, sorting, and pagination parameters. Candidate email and phone identifiers are normalized for duplicate review. Merge transfers applications, interviews, legacy history, and form responses; same-job application conflicts must be resolved first. Archive/restore and audited privacy export, deletion-request, and retention-aware erasure endpoints preserve recruitment history.

### Forms and evaluations

Forms begin as drafts. Publishing freezes the current version; editing a published form creates a new draft while the published version remains available. Field IDs remain stable and responses retain the exact title and field snapshot used at submission. Published forms can be assigned to a job, application, or pipeline stage. Responses validate required and conditional fields, types, selections, dates, and active document references. Recruiters can filter, review, and export responses as CSV.

### Responsible AI

AI endpoints are restricted to administrators, recruiters, and managers and always return advisory output. The bundled local provider supports deterministic CV extraction, token-based semantic similarity, evidence-backed job matching, interview-question drafts, and application summaries without an external model dependency. Matching uses an explicit allow-list and excludes identity and protected-characteristic fields. Every generation records its model, prompt version, sanitized inputs, output, latency, token estimate, zero local-provider cost, and requesting user. Human corrections, ratings, and overrides are retained for quality review; administrator monitoring reports guardrail violations. See [Responsible AI operations](docs/RESPONSIBLE_AI.md).

## Verification

```bash
npm ci
npm run build
npm test -- --runInBand
docker compose config
```

For a live check, start the stack and open `http://localhost:3000/api`.
