# GEDPro

GEDPro is a full-stack applicant tracking system that brings the recruitment
lifecycle into one workspace. Recruiters can configure hiring pipelines,
manage candidates and applications, coordinate interviews and evaluations,
handle recruitment documents and communications, and review operational
reports. Administrators control users and can monitor the application's
human-reviewed AI assistance.

This project was built as a production-minded portfolio application. It
includes typed API contracts, role-aware interfaces, optimistic concurrency,
privacy workflows, background jobs, accessible UI checks, and end-to-end
browser coverage—not only CRUD screens.

## Highlights

- Configurable jobs, hiring pipelines, ordered stages, and transition rules
- Candidate search, ownership, tags, skills, duplicate merging, and archival
- Privacy export, deletion-request, retention, and personal-data erasure flows
- Application tracking with guarded transitions, history, bulk actions, and
  stale-update conflict handling
- Interview scheduling, reusable scorecards, structured feedback, and decision
  summaries
- Versioned documents with validation, checksums, replacement, secure download,
  archival, and S3-compatible storage
- Dynamic evaluation forms with assignments, conditional validation, review,
  and CSV export
- Template-based candidate communications, delivery history, preferences,
  retries, and background processing
- Scoped recruitment reporting with asynchronous CSV/XLSX exports
- Role-based administration for administrators, recruiters, managers, and
  candidates
- Advisory AI features for CV extraction, candidate search and matching,
  interview questions, and application summaries, with evidence, feedback,
  overrides, and administrative monitoring

## Architecture

GEDPro is an npm-workspaces monorepo with independently deployable applications.

| Area | Technology | Responsibility |
| --- | --- | --- |
| Web | Next.js 16, React 19, TypeScript, Tailwind CSS | App Router UI, server-side BFF, secure cookie sessions, and role-aware navigation |
| Client data | TanStack Query, React Hook Form, Zod | Server-state caching, mutations, validation, and conflict/error states |
| API | NestJS 11, TypeORM, Mongoose | REST API, authentication, authorization, workflows, audit history, and background jobs |
| Relational data | PostgreSQL 16 | Users, candidates, jobs, applications, interviews, documents, and reporting data |
| Dynamic data | MongoDB 7 | Versioned forms and response documents |
| File storage | Local storage or MinIO/S3 | Recruitment documents and generated report exports |
| API contract | Swagger/OpenAPI and `openapi-typescript` | Versioned API specification and generated frontend types |
| Testing | Jest, Vitest, Testing Library, axe, Playwright | Unit, integration, accessibility, and authenticated browser verification |

The frontend communicates with the API through a same-origin backend-for-
frontend layer. Access and refresh tokens remain in secure HTTP-only cookies,
while the API remains the final authorization boundary.

## Repository structure

```text
apps/
  api/    NestJS API, migrations, workers, OpenAPI contract, and tests
  web/    Next.js application, BFF routes, generated API types, and tests
docker-compose.yml
package.json
```

More detailed backend and operational documentation is available in
[`apps/api/README.md`](apps/api/README.md). The completed frontend roadmap and
verification record are in
[`apps/web/FRONTEND_COMPLETION_PLAN.md`](apps/web/FRONTEND_COMPLETION_PLAN.md)
and
[`apps/web/plans/PHASE_12_VERIFICATION.md`](apps/web/plans/PHASE_12_VERIFICATION.md).

## Run locally

### Prerequisites

- Node.js 20.9 or newer
- npm
- Docker with Docker Compose

### 1. Install dependencies

```bash
npm ci
```

### 2. Configure the applications

Copy the example environment files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

On PowerShell, use `Copy-Item` instead of `cp` if aliases are disabled.

For a local portfolio demo, update these values in `apps/api/.env`:

```dotenv
JWT_SECRET=use-a-long-random-local-secret
JWT_REFRESH_SECRET=use-a-different-long-random-local-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=choose-at-least-12-characters
```

Do not commit the populated `.env` files.

### 3. Start the data services

```bash
docker compose up -d postgres mongodb minio
```

The default ports are PostgreSQL `5432`, MongoDB `27018`, MinIO API `9000`,
and MinIO Console `9001`.

### 4. Create the administrator

The API applies pending migrations at startup, so start it once before running
the bootstrap command:

```bash
npm run dev:api
```

In another terminal:

```bash
npm run admin:bootstrap
```

The bootstrap operation is idempotent and uses `ADMIN_EMAIL` and
`ADMIN_PASSWORD` from `apps/api/.env`.

### 5. Start GEDPro

If the API is already running, start the web workspace separately:

```bash
npm run dev:web
```

Alternatively, stop the standalone API process and start both applications:

```bash
npm run dev
```

Open the following URLs:

- Web application: <http://localhost:3000>
- API: <http://localhost:3001>
- Swagger documentation: <http://localhost:3001/api>
- OpenAPI JSON: <http://localhost:3001/api-json>

Sign in with the administrator credentials configured above.

## Suggested demo journey

For a quick portfolio walkthrough:

1. Create a reusable pipeline and configure its allowed stage transitions.
2. Create and publish a job using that pipeline.
3. Add a candidate and open an application for the published job.
4. Move the application through the pipeline and inspect its timeline.
5. Upload a document, assign an evaluation form, and schedule an interview.
6. Submit structured feedback and review the decision summary.
7. Open reporting and request an export.
8. Show the AI matching evidence and the human feedback/override controls.

## Quality and verification

Core repository checks:

```bash
npm run lint
npm run build
npm run test --workspace @gedpro/api
npm run test:a11y --workspace @gedpro/web
npm run api:types:check
```

With the local services and applications running:

```bash
npm run test:e2e --workspace @gedpro/api
npm run test:e2e --workspace @gedpro/web
```

The verified release-candidate baseline includes:

- 21 API unit-test suites with 57 tests
- 6 frontend unit/component files with 19 tests
- API integration coverage against PostgreSQL, MongoDB, and object storage
- Accessibility checks using axe
- Authenticated Playwright coverage across every released workspace route
- Strict frontend TypeScript checks and production builds
- OpenAPI drift detection and generated frontend contract checks

## Security and engineering decisions

- Short-lived access tokens and rotating refresh sessions
- Hashed action and refresh secrets with revocation support
- Login rate limiting, lockout controls, and non-enumerating recovery flows
- Role and capability checks in both the UI and API
- Optimistic concurrency for mutable recruitment records
- Content-signature validation and checksums for uploaded files
- Auditable candidate privacy and data-retention operations
- Human control over all AI output; AI never makes automatic hiring decisions
- Protected-characteristic fields excluded from AI matching inputs

## Project status

All planned product phases are implemented and the repository passes its
release-candidate verification gates. GEDPro is complete for portfolio use.
Production deployment would additionally require environment-specific secrets,
monitoring, backup policies, and rollout procedures.

## License

This repository is currently unlicensed and intended as a portfolio project.
