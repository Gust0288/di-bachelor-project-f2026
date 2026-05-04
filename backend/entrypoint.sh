#!/bin/sh
set -e

echo "Venter på PostgreSQL..."
until pg_isready -h "${DB_HOST:-db}" -p "${DB_PORT:-5432}" -U "${DB_USER:-user}" 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL er klar."

echo "Kører database schema..."
psql "$DATABASE_URL" -f /app/schema.sql

echo "Kører migrationer..."
psql "$DATABASE_URL" -f /app/migrations/001_wizard_additions.sql

echo "Starter Flask..."
exec flask --app app.main:app run --host 0.0.0.0 --port 8000
