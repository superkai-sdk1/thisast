#!/bin/bash
# PostgreSQL backup to MinIO
# Run as: ./infra/scripts/backup.sh
# Recommended: add to cron inside api container or a dedicated backup container

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/tmp/crm_backup_${TIMESTAMP}.sql.gz"

echo "[backup] Starting PostgreSQL dump at ${TIMESTAMP}..."

PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h postgres \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  --no-owner \
  --no-acl \
  | gzip > "${BACKUP_FILE}"

echo "[backup] Dump complete. Uploading to MinIO..."

mc alias set backup_store "http://minio:9000" \
  "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}" --quiet

mc mb --ignore-existing "backup_store/crm-backups"

mc cp "${BACKUP_FILE}" "backup_store/crm-backups/$(basename ${BACKUP_FILE})"

# Retain last 30 backups
mc ls backup_store/crm-backups | sort -k4 | head -n -30 | \
  awk '{print $NF}' | xargs -I{} mc rm "backup_store/crm-backups/{}" 2>/dev/null || true

rm -f "${BACKUP_FILE}"
echo "[backup] Done. File uploaded: crm-backups/$(basename ${BACKUP_FILE})"
