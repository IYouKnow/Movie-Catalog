FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN mkdir -p src/generated
ENV DATABASE_URL=file:./prisma-template.db
RUN npm ci

FROM deps AS builder
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/docker/entrypoint.sh ./entrypoint.sh
COPY --from=builder /app/docker/init-db.js ./init-db.js
COPY prisma ./prisma

RUN chmod +x /app/entrypoint.sh && mkdir -p /app/data

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
