# Railway deploy (API + Web)

One repo, two services. The **root** `railway.toml` is for the **API**. The **web** service must use the web Dockerfile and the **web** healthcheck path, or you get "Application failed to respond".

## Why the web shows "Application failed to respond"

1. **Wrong image**  
   If the web service uses the root config, it builds and runs the **API** image. The API listens on 8080; your web domain uses port 4000 → nothing listens on 4000 → 502 / "Application failed to respond".

2. **Wrong healthcheck**  
   The root `railway.toml` has `healthcheckPath = "/api/health"`. If that is used for the **web** service, Railway calls `/api/health` on the **web** container. The web app only has `/health`, so it returns 404 → healthcheck fails → Railway reports "Application failed to respond".

3. **Wrong root directory**  
   If the web service has **Root Directory** = `apps/web`, the build context is only `apps/web`. The web Dockerfile expects the **monorepo root** (it copies `package.json`, `apps/web`, `packages/`). The build can fail or produce a broken image.

## Fix: web service settings

Do this for the **web** service (the one with `ai-marketing-platform-web-production.up.railway.app`):

### 1. Root Directory

- **Settings → General → Root Directory:** leave **empty** (repo root).  
  Do **not** set it to `apps/web`.

### 2. Use the web Dockerfile

- **Variables** → add:
  - **Name:** `RAILWAY_DOCKERFILE_PATH`
  - **Value:** `apps/web/Dockerfile`
- Redeploy after saving.

### 3. Use the web healthcheck path

- **Settings → Deploy** (or **Networking** / **Health Check**, depending on UI).
- Set **Healthcheck Path** to **`/health`** (not `/api/health`).  
  `/api/health` is for the API only.

### 4. Port

- **Settings → Public networking** → **Target port:** **4000** (or leave default if it already matches).

## Optional: config file for the web service

If your Railway project lets you set a **config path** per service, you can point the web service to `apps/web/railway.toml`. That file sets:

- `dockerfilePath = "apps/web/Dockerfile"`
- `healthcheckPath = "/health"`

You still need **Root Directory** = empty for the web service so the build context is the repo root.

## Summary

| Service | Root Directory | Variable | Healthcheck Path | Port |
|--------|-----------------|----------|------------------|------|
| **api** | (default) | — | `/api/health` (root toml) | 8080 |
| **web** | **empty** | `RAILWAY_DOCKERFILE_PATH=apps/web/Dockerfile` | **`/health`** | 4000 |

After changing these, **redeploy** the web service.
