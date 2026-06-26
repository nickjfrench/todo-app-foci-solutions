# ====================
# STAGE: Base
# ====================
# Shared foundation for all stages
FROM node:24-alpine AS base

WORKDIR /app

COPY package*.json ./

# ====================
# STAGE: Builder
# ====================
# Installs all deps (including dev) and compiles TS
FROM base AS builder

RUN npm ci

COPY . .

RUN npm run build:ts

# Prune devDeps so we can copy clean node_modules into prod
RUN npm prune --production

# ====================
# STAGE: Development
# ====================
FROM base AS development

ENV NODE_ENV=development

# Install all deps (including devDependencies) for hot reload etc.
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ====================
# STAGE: Production
# ====================
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy only the built artifacts and pruned deps from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

CMD ["node", "dist/server.js"]
