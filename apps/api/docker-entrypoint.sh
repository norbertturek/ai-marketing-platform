#!/bin/sh
set -e

MIGRATION_MAX_ATTEMPTS="${MIGRATION_MAX_ATTEMPTS:-10}"
MIGRATION_RETRY_DELAY_SECONDS="${MIGRATION_RETRY_DELAY_SECONDS:-3}"

echo "Running database migrations..."
attempt=1
while [ "$attempt" -le "$MIGRATION_MAX_ATTEMPTS" ]; do
  echo "Migration attempt $attempt/$MIGRATION_MAX_ATTEMPTS..."
  if pnpm --filter api prisma:deploy; then
    echo "Database migrations completed."
    break
  fi

  if [ "$attempt" -eq "$MIGRATION_MAX_ATTEMPTS" ]; then
    echo "WARNING: Failed to run migrations after $MIGRATION_MAX_ATTEMPTS attempts. Continuing startup."
    break
  fi

  echo "Migration failed. Retrying in $MIGRATION_RETRY_DELAY_SECONDS seconds..."
  sleep "$MIGRATION_RETRY_DELAY_SECONDS"
  attempt=$((attempt + 1))
done

echo "Starting API..."
exec pnpm --filter api start:prod
