# R2 Setup for Post Media

Post images and videos are stored in Cloudflare R2. If you don't see files in your bucket, check the steps below.

## 1. Create bucket (if needed)

```bash
npx wrangler r2 bucket create ai-marketing-platform
```

Or create via [Cloudflare Dashboard](https://dash.cloudflare.com) → R2 → Create bucket.

## 2. Enable public dev URL

The app needs a public base URL to return shareable links. **Without this, saved media URLs won't be publicly accessible.**

**Via Wrangler CLI:** (requires `wrangler login` or `CLOUDFLARE_API_TOKEN`)
```bash
pnpm r2:public-url:enable
```

**Via Dashboard:**
1. R2 → your bucket (`ai-marketing-platform`) → **Settings**
2. **Public Development URL** → **Enable**
3. Confirm by typing `allow`

## 3. Get the public URL

**Via Wrangler:**
```bash
pnpm r2:public-url
```
Output: `https://pub-xxxxx.r2.dev` — add to `apps/api/.env` as `R2_PUBLIC_URL`

**Via Dashboard:** After enabling, the URL appears under **Public Bucket URL** (format: `https://pub-xxxxx.r2.dev`).

## 4. Add to .env

```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET_NAME=ai-marketing-platform
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

**Critical:** `R2_PUBLIC_URL` must be set. Without it, uploads succeed but the app stores original URLs (Runware links may expire).

- **Account ID:** Dashboard → R2 → Overview (right sidebar)
- **API tokens:** R2 → Manage R2 API Tokens → Create API token (Object Read & Write)

## 5. Verify uploads

If the bucket stays empty:

- Ensure all 5 R2 env vars are set in `apps/api/.env` (including `R2_PUBLIC_URL`)
- **Local dev:** `.env` is loaded from `apps/api/`. Run API from repo root: `pnpm dev` or `pnpm dev:api`
- **Docker:** `docker-compose` loads `apps/api/.env` via `env_file`. Ensure the file exists.
- Restart the API after changing .env
- Save a post with image/video from the playground — upload runs only when saving
- Check API logs: `R2 not configured` (credentials missing); `R2 upload failed` (see error for NoSuchBucket, AccessDenied, etc.)

## Cloudflare MCP

Cloudflare does not provide a public MCP for dashboard/R2 management. Use the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) for automation.
