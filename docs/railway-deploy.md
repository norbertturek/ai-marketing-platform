# Railway deploy (API + Web)

This repo has two deployable apps: **api** (NestJS) and **web** (Angular + nginx). The root `railway.toml` is set up for the **api** service. For the **web** service you must point Railway at the web Dockerfile.

## Why the web app returns 502

If both services use the same build config, the **web** service will build and run the **api** image (because `railway.toml` has `dockerfilePath = "apps/api/Dockerfile"`). The API listens on Railway’s `PORT` (e.g. 8080). Your web domain targets port **4000**, so nothing is listening there → **502 Bad Gateway**.

## Fix: set Dockerfile path for the web service

1. In [Railway](https://railway.app) open your project.
2. Select the **web** service (the one with domain `ai-marketing-platform-web-production.up.railway.app`).
3. Go to **Variables**.
4. Add a variable:
   - **Name:** `RAILWAY_DOCKERFILE_PATH`
   - **Value:** `apps/web/Dockerfile`
5. **Redeploy** the web service (e.g. trigger a new deploy from the **Deployments** tab).

After that, the web service will build and run the nginx image that listens on port 4000 (or whatever `PORT` Railway sets). Keep the service **Target port** at **4000** in **Settings → Public networking**.

## Summary

| Service | Variable (optional) | Dockerfile | Port |
|---------|---------------------|------------|------|
| **api** | (uses root `railway.toml`) | `apps/api/Dockerfile` | 8080 |
| **web** | `RAILWAY_DOCKERFILE_PATH=apps/web/Dockerfile` | `apps/web/Dockerfile` | 4000 |
