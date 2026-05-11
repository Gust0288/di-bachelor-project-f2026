#!/bin/sh
set -e

DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+)[:/].*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*@[^:]+:([0-9]+)/.*|\1|')
DB_USER=$(echo "$DATABASE_URL" | sed -E 's|.*//([^:]+):.*|\1|')
if ! echo "$DB_PORT" | grep -qE '^[0-9]+$'; then
  DB_PORT=5432
fi

echo "Venter paa PostgreSQL..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL er klar."

echo "Koerer database schema..."
psql "$DATABASE_URL" -f /app/schema.sql

echo "Koerer migrationer..."
psql "$DATABASE_URL" -f /app/migrations/001_wizard_additions.sql
psql "$DATABASE_URL" -f /app/migrations/002_email_verification.sql
psql "$DATABASE_URL" -f /app/migrations/003_cvr_unique_constraint.sql

echo "Starter gunicorn..."
exec gunicorn --workers 2 --bind 0.0.0.0:8000 --timeout 120 "app.main:app"
