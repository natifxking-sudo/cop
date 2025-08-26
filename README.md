# COP Intelligence Collaboration Platform

A Common Operational Picture (COP) intelligence collaboration platform that fuses SOCMINT, SIGINT, and HUMINT into a single operational view with role-based dashboards for HQ, Analysts, and Observers.

## Monorepo Layout

- `backend/` Java Spring Boot service (Liquibase migrations; Keycloak resource server ready)
- Frontend (Next.js/TypeScript) at repo root with API routes under `app/api/*`
- Infra: `docker-compose.yml`, SQL/Liquibase under `backend/src/main/resources/db/changelog` and helper scripts in `scripts/`

## Core Capabilities

- Role-based login and protected routes (Keycloak-ready; temporary JWT still supported in Next API)
- Intelligence ingestion (SOCMINT, SIGINT, HUMINT) via `POST /api/reports`
- Fusion service to correlate reports into events with confidence scoring
- COP Map with MapLibre layers, timeline control, and event markers
- HQ decisions: approve/reject events and request information from analysts
- Observer view: HQ-approved events and decision summaries
- Evidence management: file uploads to MinIO, metadata, and access based on clearance
- Notifications and basic chat channels

## Architecture Overview

- Frontend: Next.js 15 + TypeScript + Tailwind.
- Database: PostgreSQL + PostGIS (DB name `cop_prod`).
- Storage: MinIO (S3-compatible) for binary; metadata in Postgres (`files.s3_url`).
- Realtime: WebSocket feed.
- Backend (Java): Spring Boot 3 with Liquibase and OAuth2 Resource Server for Keycloak.

## Prerequisites

- Node.js 18+ (Node 20 LTS recommended)
- Docker + Docker Compose

## Environment Variables

Frontend (Next.js):
- `DATABASE_URL` (e.g. `postgres://cop_user:cop_password@localhost:5432/cop_prod`)
- `JWT_SECRET` (temporary for Next API):
- `JWT_EXPIRES_IN` (default: `24h`)
- `NEXT_PUBLIC_API_URL` (default: `http://localhost:3000`)
- `NEXT_PUBLIC_WS_URL` (default: `ws://localhost:3000`)
- `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`
- `NEXT_PUBLIC_KEYCLOAK_URL`, `NEXT_PUBLIC_KEYCLOAK_REALM`, `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID`

Backend (Spring): see `backend/src/main/resources/application.yml`.

## Running via Docker Compose

Bring up core services (Postgres, Redis, MinIO, Keycloak) and frontend/backend:

```bash
docker compose up -d --build postgres redis minio keycloak cop-backend cop-frontend
```

Bootstrap an admin user in the DB for Next.js API login (optional):

```bash
docker compose run --rm bootstrap-admin
```

Open:
- Frontend: http://localhost:3000
- Keycloak: http://localhost:8085 (realm `cop`)

## Data Model (Key Tables)

- `users` (id, username, email, role, clearance_level, password_hash, is_active)
- `reports` (id, type, title, content JSONB, location GEOMETRY(Point,4326), classification, reliability, credibility, status)
- `events` (id, type, title, description, start_time, end_time, location, area_of_interest, confidence_score, status)
- `fusion_provenance` (id, event_id, source_report_id, fusion_algorithm, weight)
- `files` (id, filename, s3_url, classification, report_id, event_id, checksum, tags)
- `audit_logs`, `qa_threads`, `notifications`, `chat_messages`

## Roles & Access Control

- Roles: HQ, ANALYST_SOCMINT, ANALYST_SIGINT, ANALYST_HUMINT, OBSERVER (Keycloak realm roles)
- Field-level access: evidence download checks `clearanceLevel` vs file classification
- Spring Security Resource Server for Keycloak (`issuer-uri` configurable)

## Fusion & Confidence Scoring

Fusion aggregates reports by AOI/time and computes a weighted confidence score using recency, reliability/credibility, and source diversity. See `lib/services/fusion-service.ts`.

## Notes

- Next.js API layer is currently primary for app features. Java backend has Liquibase and Keycloak security configured and can be extended into microservices.
- MinIO is used instead of @vercel/blob.
- Database name is `cop_prod`.