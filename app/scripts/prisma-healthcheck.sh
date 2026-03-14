#!/usr/bin/env bash
set -Eeuo pipefail

echo "=== PRISMA HEALTHCHECK ==="

echo "1) DATABASE_URL"
if [ -z "${DATABASE_URL:-}" ]; then
  echo "FAIL: DATABASE_URL not set"
  exit 1
fi
echo "OK"

echo "2) prisma.config.ts"
npx prisma validate 2>&1 | grep -q "is valid" && echo "OK" || { echo "FAIL"; exit 1; }

echo "3) migration status"
STATUS=$(npx prisma migrate status 2>&1)
echo "$STATUS" | grep -q "up to date" && echo "OK" || {
  echo "$STATUS" | grep -q "pending" && { echo "WARN: pending migrations"; } || { echo "FAIL"; echo "$STATUS"; exit 1; }
}

echo "4) database connection"
npx prisma db execute --stdin <<'SQL'
SELECT 1;
SQL
echo "OK"

echo "=== HEALTHCHECK PASSED ==="
