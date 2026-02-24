# News Platform Backend

Production-ready NestJS backend baseline for a news platform.

## Stack

- NestJS 11
- Prisma + PostgreSQL
- Redis (for queue/cache/session-ready infrastructure)
- Swagger/OpenAPI

## Prisma Client Strategy

- Uses Prisma v7 `prisma-client` generator (instead of legacy `prisma-client-js`).
- Generates client code to `src/generated/prisma`.
- Uses `engineType = "client"` with `@prisma/adapter-pg` and `moduleFormat = "cjs"` for compatibility with the current Jest/Nest toolchain.

## Main Dependencies

| Library                      | Purpose                                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| **@nestjs/core**             | Core NestJS framework providing dependency injection, module system, and application lifecycle |
| **@nestjs/common**           | Common NestJS utilities such as decorators, guards, interceptors, and exception filters        |
| **@nestjs/platform-fastify** | Fastify HTTP adapter for improved performance and lower overhead                               |
| **@nestjs/config**           | Centralized configuration management and environment variable loading                          |
| **class-validator**          | Declarative validation for DTOs and environment configuration                                  |
| **class-transformer**        | Transforms plain objects into typed classes for validation and safety                          |
| **prisma**                   | Database schema management and migrations                                                      |
| **@prisma/adapter-pg + pg**  | PostgreSQL driver adapter stack used by Prisma                                                 |
| **bullmq**                   | Distributed job queue for asynchronous and background processing                               |
| **ioredis**                  | Redis client used by BullMQ for queue and worker communication                                 |
| **@nestjs/swagger**          | Automatic OpenAPI (Swagger) documentation generation                                           |
| **swagger-ui-express**       | Interactive Swagger UI for API exploration                                                     |
| **nest-winston + winston**   | Structured system/application logging with redaction and file transport support                |
---------------------------------------------------------------------------------------------------------------------------------

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create local environment file:

```bash
cp .env.example .env
```

3. Ensure PostgreSQL and Redis are running (or use Docker Compose from the repo root).

4. Generate Prisma client:

```bash
npm run prisma:generate
```

5. Start backend in dev mode:

```bash
npm run start:dev
```

## Git Hooks

Husky hooks are configured for local quality gates:

- `pre-commit`: runs `npm run format` and re-stages formatted backend files.
- `pre-push`: runs `npm run test -- --runInBand`.

They install automatically when you run `npm install` in `backend` via the `prepare` script.

## Environment Validation

Configuration is loaded through `@nestjs/config` and validated before the app boots using `class-validator` + `class-transformer`.

- Startup fails fast if required variables are missing or invalid.
- Validation errors log variable names and constraint failures only (no secret values).
- Config values are mapped into a typed runtime object (`RuntimeConfig`) and are available app-wide via the global `ConfigModule`.

Required production environment variables include:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/news_platform?schema=public
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT_MS=30000
DB_POOL_CONNECTION_TIMEOUT_MS=10000
REDIS_URL=redis://redis:6379
JWT_SECRET=replace-with-a-secret-at-least-32-characters
```

## Production Logging (Winston)

The backend uses `nest-winston` + `winston` as the Nest system logger and application logger.

- Console logs are structured JSON in production by default (better for aggregators).
- Sensitive metadata fields (for example `password`, `token`, `secret`, `authorization`) are redacted before emission.
- File logging is enabled by default and writes `application.log`, `error.log`, `exceptions.log`, and `rejections.log`.
- File logs are recycled automatically by size (`LOG_FILE_MAX_SIZE_MB`) and retention count (`LOG_FILE_MAX_FILES`).
- Unhandled exceptions and promise rejections are captured by Winston handlers.

Example production logging configuration:

```env
LOG_LEVEL=log
LOG_PRETTY=false
LOG_FILE_ENABLED=true
LOG_FILE_LEVEL=log
LOG_FILE_DIR=logs
LOG_FILE_MAX_SIZE_MB=20
LOG_FILE_MAX_FILES=30
```

When running with Docker Compose, the backend log directory is mounted to the `backend_logs` volume for persistence across container restarts.

## Docker Compose (repo root)

From `news-platform` root:

```bash
docker compose up --build
```

Services:

- `migrate`: runs `prisma migrate deploy` before backend startup
- `backend`: http://localhost:3000 (Swagger UI at `/docs`)
- `postgres`: localhost:5432
- `redis`: localhost:6379

## API Baseline Endpoints

- `GET /api/v1` service metadata
- `GET /api/v1/health/live` liveness probe
- `GET /api/v1/health/ready` readiness probe (database + redis checks)
- `GET /docs` Swagger UI

## Prisma Commands

```bash
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:migrate:deploy
npm run prisma:studio
```

## Quality Gates

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
```
