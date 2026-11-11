# ---------------------------------------------------------------------------
# Stage 1: install deps + generate Prisma Client + compile TypeScript
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (separate layer so `npm install` is cached unless
# package.json actually changes)
COPY package.json package-lock.json* ./
RUN npm install

# Prisma needs the schema present before `npm install`'s postinstall runs
# `prisma generate` — copy it explicitly in case .dockerignore excludes prisma/migrations
COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: production runtime — only what's needed to run, not build
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Local file storage for maintenance attachments — mount this as a volume
# in docker-compose / Railway if attachments need to survive redeploys.
RUN mkdir -p /app/uploads/maintenance

EXPOSE 4000

# Run migrations then start the server. `prisma migrate deploy` (not `dev`)
# is the production-safe command — it applies existing migrations without
# prompting or generating new ones.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
