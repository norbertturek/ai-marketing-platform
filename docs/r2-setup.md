# R2 Setup for Post Media

Post images and videos are stored in Cloudflare R2. If you don't see files in your bucket, check the steps below.

## 1. Create bucket (if needed)

```bash
npx wrangler r2 bucket create posts-media
```

Or create via [Cloudflare Dashboard](https://dash.cloudflare.com) → R2 → Create bucket.

## 2. Enable public dev URL

The app needs a public base URL to return shareable links. Enable the r2.dev subdomain:

**Via Wrangler CLI:**
```bash
npx wrangler r2 bucket dev-url enable posts-media
```

**Via Dashboard:**
1. R2 → your bucket (`posts-media`) → **Settings**
2. **Public Development URL** → **Enable**
3. Confirm by typing `allow`

## 3. Get the public URL

**Via Wrangler:**
```bash
npx wrangler r2 bucket dev-url get posts-media
```

**Via Dashboard:** After enabling, the URL appears under **Public Bucket URL** (format: `https://pub-xxxxx.r2.dev`).

## 4. Add to .env

```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET_NAME=posts-media
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

- **Account ID:** Dashboard → R2 → Overview (right sidebar)
- **API tokens:** R2 → Manage R2 API Tokens → Create API token (Object Read & Write)

## 5. Verify uploads

If the bucket stays empty:

- Ensure all 5 R2 env vars are set (including `R2_PUBLIC_URL`)
- Restart the API after changing .env
- Save a post with image/video from the playground — upload runs only when saving
- Check API logs for `R2 not configured, skipping upload` (means credentials missing)

## Cloudflare MCP

Cloudflare does not provide a public MCP for dashboard/R2 management. Use the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) for automation.
