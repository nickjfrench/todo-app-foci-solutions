# ====================
# STAGE: Builder
# ====================
# Builder to install all dependencies including devDependencies
# Image cleaned for prod at end of builder stage.
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package and package-lock
COPY package*.json ./

# Install using lock as source of truth
# devDependencies included so things like TS can compile
RUN npm ci

# Copy remaining source code
COPY . .

# Build and compile to JS
RUN npm run build:ts

# Remove devDependencies after build - keep image lean
RUN npm prune --production

# ====================
# STAGE: Runner
# ====================
# Use built files
FROM node:24-alpine AS runner

WORKDIR /app

# Enforce production
ENV NODE_ENV=production

# Copy from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["node", "dist/server.js"]
