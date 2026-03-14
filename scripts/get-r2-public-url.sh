#!/usr/bin/env bash
# Get R2 public URL and optionally update .env
# Prerequisite: wrangler login (or set CLOUDFLARE_API_TOKEN)
set -e
BUCKET="${R2_BUCKET_NAME:-ai-marketing-content-platform}"
ENV_FILE="apps/api/.env"

echo "Getting public URL for bucket: $BUCKET"
URL=$(pnpm exec wrangler r2 bucket dev-url get "$BUCKET" 2>/dev/null | grep -E '^https://' || true)

if [ -z "$URL" ]; then
  echo "Failed to get URL. Ensure public access is enabled:"
  echo "  1. Cloudflare R2 → $BUCKET → Settings → Public Development URL → Enable"
  echo "  2. Run: wrangler login"
  echo "  3. Run this script again"
  exit 1
fi

echo "R2_PUBLIC_URL=$URL"
echo ""
echo "Add to $ENV_FILE:"
echo "R2_PUBLIC_URL=$URL"
