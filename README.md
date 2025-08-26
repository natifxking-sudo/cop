# COP Intelligence Collaboration Platform

A Common Operational Picture (COP) intelligence collaboration platform that fuses SOCMINT, SIGINT, and HUMINT into a single operational view with role-based dashboards for HQ, Analysts, and Observers.

## Monorepo Layout

- `backend/` Java Spring Boot service (single service skeleton with entities/repositories; Dockerfile provided)
- Frontend (Next.js/TypeScript) at repo root with API routes under `app/api/*`
- Infra: `docker-compose.yml`, SQL init scripts in `scripts/`

## Core Capabilities

- Role-based login and protected routes (JWT in Next.js)
- Intelligence ingestion (SOCMINT, SIGINT, HUMINT) via `POST /api/reports`
- Fusion service to correlate reports into events with confidence scoring
- COP Map with MapLibre layers, timeline control, and event markers
- HQ decisions: approve/reject events and request information from analysts
- Observer view: HQ-approved events and decision summaries
- Evidence management: file uploads, metadata, and access based on clearance
- Notifications and basic chat channels

## Architecture Overview

- Frontend: Next.js 15 + TypeScript + Tailwind. API routes implement auth, reports, fusion, decisions, files, notifications.
- Database: PostgreSQL + PostGIS with schema for users, reports, events, fusion provenance, decisions, files, audit logs.
- Storage: File metadata in DB, binary stored via `@vercel/blob` in this build (can be swapped for MinIO).
- Realtime: WebSocket service abstraction for feeds (reports, events, decisions).
- Backend (Java): Spring Boot 3 skeleton with entities/repositories; Dockerfile builds a service (not required to run the app in this build as Next API provides endpoints).

## Prerequisites

- Node.js 18+ (Node 20 LTS recommended)
- PostgreSQL 15 with PostGIS extension
- Redis (optional; referenced in docker-compose)
- Docker (optional; if you want to run via compose)

## Environment Variables

Frontend (Next.js):
- `DATABASE_URL` (e.g. `postgres://cop_user:cop_password@localhost:5432/cop_platform`)
- `JWT_SECRET` (default: `cop-platform-secret-key`)
- `JWT_EXPIRES_IN` (default: `24h`)
- `NEXT_PUBLIC_API_URL` (default: `http://localhost:3000`)
- `NEXT_PUBLIC_WS_URL` (default: `ws://localhost:3000`)
- `BLOB_READ_WRITE_TOKEN` (if using @vercel/blob in production)

Backend (Spring): see `backend/src/main/resources/application.yml` and `application-docker.yml`.

## Database Setup

Run the SQL scripts in order against your database:

```sql
\i scripts/001-setup-database.sql
\i scripts/002-create-indexes.sql
\i scripts/003-seed-test-data.sql
\i scripts/004-create-files-table.sql
\i scripts/005-create-notifications-table.sql
```

Ensure PostGIS is enabled:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Running Locally (without Docker)

1) Install dependencies (use legacy peer deps to avoid React 19 peer warnings):

```bash
npm install --no-audit --no-fund --legacy-peer-deps
```

Note: `pg-native` may try to compile; ensure PostgreSQL client is installed or remove `pg-native` from package.json if unnecessary.

2) Set environment variables (example for bash):

```bash
export DATABASE_URL=postgres://cop_user:cop_password@localhost:5432/cop_platform
export JWT_SECRET="your-dev-secret"
export NEXT_PUBLIC_API_URL=http://localhost:3000
export NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

3) Start dev server:

```bash
npm run dev
```

4) Open `http://localhost:3000`.

## Running via Docker Compose (optional)

Docker is not required for this build since Next.js implements the APIs. If you want infrastructure via compose:

- Postgres (with PostGIS) and Redis/MinIO are defined in `docker-compose.yml`.
- Frontend container builds using `Dockerfile.frontend`.

Bring up infra only:

```bash
docker compose up -d postgres redis minio
```

Bring up frontend (after infra is ready):

```bash
docker compose up --build cop-frontend
```

## Frontend APIs (Next.js)

- `POST /api/auth/login` – JWT issuance
- `GET /api/auth/me` – current user
- `POST /api/reports` – create report
- `GET /api/reports` – list reports
- `POST /api/fusion` – fuse reports into event
- `GET /api/events` – list events
- `POST /api/decisions` – create/approve/reject decisions
- `GET /api/decisions` – list decisions
- `POST /api/files/upload` – upload evidence
- `GET /api/files/:fileId` – retrieve evidence
- `GET /api/websocket` – WebSocket endpoint

See `app/api/*` for full details.

## Data Model (Key Tables)

- `users` (id, username, email, role, clearance_level, is_active)
- `reports` (id, type, title, content JSONB, location GEOMETRY(Point,4326), classification, reliability, credibility, status)
- `events` (id, type, title, description, start_time, end_time, location, area_of_interest, confidence_score, status)
- `fusion_provenance` (id, event_id, source_report_id, fusion_algorithm, weight)
- `decisions` (id, decision_type, title, description, decision_maker, related_event_id, status, classification)
- `files` (id, filename, blob_url, classification, report_id, event_id, checksum, tags)
- `audit_logs`, `qa_threads`

## Roles & Access Control

- Roles: HQ, ANALYST_SOCMINT, ANALYST_SIGINT, ANALYST_HUMINT, OBSERVER
- Field-level access: evidence download checks `clearanceLevel` vs file classification
- Route protection via `lib/auth/middleware` and JWT in requests

## Fusion & Confidence Scoring

The fusion service aggregates reports by AOI/time and computes a weighted confidence score using:
- Source reliability and information credibility
- Report recency
- Source diversity bonus

See `lib/services/fusion-service.ts` for details.

## Map & Timeline

- MapLibre for layers and markers (`components/map/*`)
- Timeline controls to filter visible events

## Notifications & Chat

- Notifications persisted in `notifications` table
- Chat channels persisted in `chat_messages` (basic)

## Testing

- Frontend uses Next API routes; add unit tests as needed
- SQL scripts include seed data for manual verification

## Limitations & Notes

- Spring Boot backend is provided as a scaffold and not wired into the running stack (Next.js APIs are primary API layer here). If you prefer Java microservices, extend `backend/` with controllers/security/DTOs and point the frontend to `NEXT_PUBLIC_API_URL` of the Java gateway.
- File storage currently uses `@vercel/blob`. For MinIO, replace upload/get logic in `app/api/files/*` to use MinIO SDK and configure `MINIO_*` envs.
- To avoid native build issues (`pg-native`, `libpq`), prefer pure JS `pg` driver only.

## Next Steps

- Replace `@vercel/blob` with MinIO integration for on-prem storage
- Harden authentication via Keycloak and enforce RBAC/ABAC at API level
- Add CI pipelines and test suites
- Containerize the Next API + DB with health checks for production