# ====================
# STAGE: Base
# ====================
# Shared foundation for all stages
FROM node:24-alpine AS base

WORKDIR /app

COPY package*.json ./

# ====================
# STAGE: Development
# ====================
FROM base AS development

ENV NODE_ENV=development

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ====================
# STAGE: Production
# ====================
FROM base AS production

ENV NODE_ENV=production

RUN npm ci

COPY . .

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

CMD ["npm", "start"]
