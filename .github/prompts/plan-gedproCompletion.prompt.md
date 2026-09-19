## Plan: Complete GEDPro backend

TL;DR: the project already has the right ATS domain and NestJS architecture, but it is not complete because the runtime configuration and infrastructure are not aligned. The path to completion is to fix environment setup, bring up PostgreSQL/MongoDB reliably, validate the core hiring flows, and finish with a clean smoke-test and documentation pass.

### Steps

1. Fix the runtime configuration
   - Create a working .env file based on the exact names the code expects in [src/config/postgres.config.ts](src/config/postgres.config.ts) and [src/config/mongodb.config.ts](src/config/mongodb.config.ts).
   - Align the sample config in [.env.example](.env.example) with the real app config.
   - Add any missing runtime requirements like the uploads directory and a valid JWT secret.

2. Bring up the required infrastructure
   - Correct the Docker setup in [docker-compose.yml](docker-compose.yml) so it matches the app’s expected DB names, ports, and credentials.
   - Start PostgreSQL, MongoDB, and any needed file-storage service reliably.
   - Validate the app can connect to both databases without auth or host mismatches.

3. Get the app booting cleanly
   - Run the real verification flow:
     - `npm install`
     - `npm run build`
     - `npm run start`
   - Resolve any startup errors in the actual boot sequence before moving to feature validation.

4. Validate the core ATS business flows
   - Authentication: register/login and JWT auth from [src/auth/auth.service.ts](src/auth/auth.service.ts)
   - Users and access control from [src/users/users.controller.ts](src/users/users.controller.ts)
   - Candidate lifecycle and history from [src/candidates/candidates.service.ts](src/candidates/candidates.service.ts)
   - Document upload flow from [src/documents/documents.controller.ts](src/documents/documents.controller.ts)
   - Dynamic form creation/submission from [src/forms/forms.service.ts](src/forms/forms.service.ts)
   - Interview scheduling/cancellation from [src/interviews/interviews.service.ts](src/interviews/interviews.service.ts)

5. Polish the project for usability
   - Update [README.md](README.md) so the setup is accurate and reproducible.
   - Add or improve quick-start instructions and environment examples.
   - Check if a dev seed user or sample data is needed for easier testing.

6. Final verification
   - Re-run the build and startup after fixes.
   - Confirm Swagger is available at /api from [src/main.ts](src/main.ts).
   - Smoke-test the main endpoints to confirm the app starts and the core ATS flows work in a clean environment.

### Relevant files
- [src/app.module.ts](src/app.module.ts) — app-level wiring
- [src/config/postgres.config.ts](src/config/postgres.config.ts) — PostgreSQL connection config
- [src/config/mongodb.config.ts](src/config/mongodb.config.ts) — MongoDB connection config
- [src/main.ts](src/main.ts) — startup and Swagger
- [docker-compose.yml](docker-compose.yml) — infrastructure setup
- [.env.example](.env.example) — config template to fix
- [README.md](README.md) — setup documentation to correct
- [src/auth/auth.service.ts](src/auth/auth.service.ts) — authentication logic
- [src/candidates/candidates.service.ts](src/candidates/candidates.service.ts) — candidate workflow
- [src/interviews/interviews.service.ts](src/interviews/interviews.service.ts) — interview operations

### Verification
1. `npm install`
2. `npm run build`
3. `docker compose up -d` or equivalent DB startup
4. `npm run start`
5. Confirm Swagger loads at http://localhost:3000/api
6. Smoke-test auth and one candidate-related route

### Decisions
- Keep the current ATS architecture and business scope.
- Treat completion as a runtime/configuration and validation project rather than a product rewrite.
- The goal is a working backend MVP, not a large enterprise platform from day one.

### Further considerations
1. Decide whether the team wants Docker-based local development or local database services only.
2. Confirm whether MinIO is required in this phase or whether local disk uploads are enough for the MVP.
3. Decide whether seed data should be added to simplify validation and demos.
