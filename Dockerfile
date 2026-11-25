# ---- builder ----
FROM node:26-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --fetch-timeout=600000 --fetch-retries=10 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# ---- runtime ----
FROM node:26-alpine AS runtime
WORKDIR /app
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY ebird_world_life_list.csv ./
RUN mkdir -p /logs && chown node:node /logs

ENV NODE_ENV=production
USER node
