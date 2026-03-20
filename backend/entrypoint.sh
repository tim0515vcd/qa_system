#!/usr/bin/env bash
set -e

echo "==> Waiting for database..."

until python - <<'PY'
import os
import psycopg2

conn = psycopg2.connect(
    host=os.getenv("POSTGRES_HOST", "db"),
    port=os.getenv("POSTGRES_PORT", "5432"),
    dbname=os.getenv("POSTGRES_DB"),
    user=os.getenv("POSTGRES_USER"),
    password=os.getenv("POSTGRES_PASSWORD"),
)
conn.close()
PY
do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "==> Ensuring pgvector extension exists..."
python - <<'PY'
import os
import psycopg2

conn = psycopg2.connect(
    host=os.getenv("POSTGRES_HOST", "db"),
    port=os.getenv("POSTGRES_PORT", "5432"),
    dbname=os.getenv("POSTGRES_DB"),
    user=os.getenv("POSTGRES_USER"),
    password=os.getenv("POSTGRES_PASSWORD"),
)
conn.autocommit = True
cur = conn.cursor()
cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
cur.close()
conn.close()
PY

echo "==> Running Alembic migrations..."
alembic upgrade head

echo "==> Starting FastAPI..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload