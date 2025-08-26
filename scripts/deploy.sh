#!/usr/bin/env bash
set -euo pipefail

# Bring up core services
docker compose up -d postgres redis minio

# Wait for MinIO to be healthy
until curl -fsS http://localhost:9000/minio/health/ready >/dev/null; do
  echo "Waiting for MinIO to be ready..."
  sleep 2
done

echo "Creating bucket cop-files if not exists"
mc alias set cop-local http://localhost:9000 cop_minio_user cop_minio_password || true
mc mb -p cop-local/cop-files || true

# Build and start frontend
docker compose up -d --build cop-frontend
