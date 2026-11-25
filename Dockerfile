# ---- deps (native build platform — fast) ----
FROM --platform=$BUILDPLATFORM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --fetch-timeout=600000 --fetch-retries=10 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

# ---- builder (native build platform — fast) ----
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --fetch-timeout=600000 --fetch-retries=10 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000
COPY . .
RUN npm run build

# ---- runtime (target platform: arm/v6) ----
FROM node:22-alpine AS runtime
WORKDIR /app
COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY ebird_world_life_list.csv ./
RUN mkdir -p /logs && chown node:node /logs

ENV NODE_ENV=production
USER node
