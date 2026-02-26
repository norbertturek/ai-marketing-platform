#!/bin/sh
set -e

echo "Running database migrations..."
pnpm --filter api prisma:deploy

echo "Starting API..."
exec pnpm --filter api start:prod
