# GEDPro

GEDPro is an applicant-tracking system organized as an npm-workspaces monorepo.

## Applications

- `apps/api` — NestJS REST API, background workers, migrations, and API documentation.
- `apps/web` — Next.js App Router frontend.

The applications share a repository and development workflow, but remain independently deployable.

## Local development

Install all workspace dependencies:

```bash
npm install
```

Start PostgreSQL, MongoDB, and MinIO:

```bash
docker compose up -d postgres mongodb minio
```

Copy `apps/api/.env.example` to `apps/api/.env`, then start both applications:

```bash
npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:3001
- Swagger: http://localhost:3001/api

See [`apps/api/README.md`](apps/api/README.md) for backend features, migrations, operations, and API details.

## Verification

```bash
npm run lint
npm run build
npm run test:cov
npm run openapi:check
```
