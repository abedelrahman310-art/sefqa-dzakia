#!/bin/sh
set -e

echo "=== [Safaqat Production Entrypoint] Starting backend service ==="

# Wait for PostgreSQL
if [ -n "$POSTGRES_HOST" ]; then
    echo "Waiting for PostgreSQL at $POSTGRES_HOST:${POSTGRES_PORT:-5432}..."
    max_retries=30
    counter=0
    until nc -z "$POSTGRES_HOST" "${POSTGRES_PORT:-5432}" > /dev/null 2>&1; do
        counter=$((counter + 1))
        if [ $counter -gt $max_retries ]; then
            echo "Error: Timed out waiting for PostgreSQL to become available."
            exit 1
        fi
        sleep 1
    done
    echo "PostgreSQL is ready!"
fi

# Run Database Migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

# Collect Static Files
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear || true

echo "=== Starting Gunicorn WSGI Server ==="
exec gunicorn safaqat_core.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers "${GUNICORN_WORKERS:-3}" \
    --threads "${GUNICORN_THREADS:-2}" \
    --timeout "${GUNICORN_TIMEOUT:-120}" \
    --access-logfile - \
    --error-logfile -
