#!/bin/sh
set -e

echo "Venter paa PostgreSQL..."
until pg_isready -h "${DB_HOST:-db}" -p "${DB_PORT:-5432}" -U "${DB_USER:-user}" 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL er klar."

echo "Koerer database schema..."
psql "$DATABASE_URL" -f /app/schema.sql

echo "Koerer migrationer..."
psql "$DATABASE_URL" -f /app/migrations/001_wizard_additions.sql
psql "$DATABASE_URL" -f /app/migrations/002_email_verification.sql
psql "$DATABASE_URL" -f /app/migrations/003_cvr_unique_constraint.sql

echo "Starter Flask..."
exec flask --app app.main:app run --host 0.0.0.0 --port 8000
