# GEDPro

GEDPro is a NestJS backend MVP for applicant tracking and recruitment document management. It uses PostgreSQL for users, candidates, documents, and interviews, plus MongoDB for dynamic forms and responses.

## Features

- JWT authentication and role-based access (`admin`, `rh`, `manager`, `candidate`)
- Candidate lifecycle with transactional history entries
- Local PDF/JPG/PNG uploads with PostgreSQL metadata
- Dynamic form creation and submission in MongoDB
- Interview scheduling and cancellation
- Job lifecycle and searchable, paginated job listings
- Per-job applications with transactional stage history
- OpenAPI documentation through Swagger

## Quick start with Docker

Prerequisites: Docker with Compose.

```bash
docker compose up --build -d
docker compose ps
```

The API is available at `http://localhost:3000` and Swagger at `http://localhost:3000/api`.
The machine-readable OpenAPI document is available at `http://localhost:3000/api-json`. Swagger preserves the bearer token entered through its Authorize button while the page remains open.

The Compose stack starts the application, PostgreSQL 16, and MongoDB 7. PostgreSQL is exposed on `5432` and MongoDB on `27018` (to avoid common local MongoDB conflicts). Uploaded files are stored in `./uploads`; MinIO is not required because this MVP uses local disk storage.

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

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login` |
| Users | `GET /users/profile`, `/users` CRUD (role-restricted) |
| Candidates | `GET/POST /candidates`, `PATCH /candidates/:id/state` |
| Documents | `GET /documents`, `POST /documents/upload` |
| Forms | `GET/POST /forms`, `POST /forms/:id/submit` |
| Interviews | `GET/POST /interviews`, `PATCH /interviews/:id/cancel` |
| Jobs | `GET/POST /jobs`, `PATCH /jobs/:id`, publish/close/archive actions |
| Applications | `GET/POST /applications`, `PATCH /applications/:id/stage` |

Uploaded files accept PDF, JPG, or PNG up to 5 MiB.

## Verification

```bash
npm ci
npm run build
npm test -- --runInBand
docker compose config
```

For a live check, start the stack and open `http://localhost:3000/api`.
