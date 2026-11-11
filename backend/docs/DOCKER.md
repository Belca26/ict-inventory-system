# Docker

## Local development (hot reload, local Postgres — no Supabase needed)

```bash
docker compose up
```

This starts:
- **postgres** — local Postgres 16, seeded with nothing by default (run the seed command below)
- **backend** — runs `npm run dev` inside the container, with `src/` mounted as a volume so code changes hot-reload without rebuilding the image
- **adminer** — a DB browser at http://localhost:8080 (server: `postgres`, user/pass/db: `ict_inventory` / `dev_password_change_me` / `ict_inventory`)

Seed the local database once it's up:
```bash
docker compose exec backend npx prisma db seed
```

The API is then available at `http://localhost:4000`.

## Building the production image

```bash
docker build -t ict-inventory-backend .
```

The production image (`runtime` stage) is intentionally minimal — no devDependencies,
no source TypeScript, only compiled `dist/`. On container start it runs
`prisma migrate deploy` (applies existing migrations, does **not** create new
ones — safe for production) before starting the server.

Run it against a real database (e.g. your Supabase project):
```bash
docker run -p 4000:4000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_ACCESS_SECRET="..." \
  -e JWT_REFRESH_SECRET="..." \
  -e CORS_ORIGIN="https://your-frontend.vercel.app" \
  -v ict_uploads:/app/uploads \
  ict-inventory-backend
```

## Notes

- **Railway deployment does not require Docker at all** — Railway can build
  directly from `package.json` via Nixpacks. The Dockerfile here exists for
  (a) local dev parity via docker-compose, and (b) as a portable fallback if
  you ever need to deploy somewhere that isn't Nixpacks-aware. If Railway's
  build works fine without it, there's no need to force Docker there.
- The `uploads/` volume is **not** attached to persistent storage by default
  on Railway — see the note already in `upload.config.ts` about swapping to
  object storage before relying on attachments surviving a redeploy.
- Compose's dev JWT secrets are placeholder values — fine for local dev,
  never reuse them anywhere real.
