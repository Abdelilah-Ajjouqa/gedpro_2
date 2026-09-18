# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy the workspace manifests and lockfile
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json

# Install API dependencies from the monorepo lockfile
RUN npm ci --workspace @gedpro/api --include-workspace-root=false

# Copy API source code
COPY apps/api ./apps/api

# Build the application
RUN npm run build --workspace @gedpro/api

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy the workspace manifests and lockfile
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json

# Install only API production dependencies
RUN npm ci --omit=dev --workspace @gedpro/api --include-workspace-root=false

# Copy built application from builder stage
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Create uploads directory
RUN mkdir -p uploads

# Expose the application port
EXPOSE 3001

# Start the application
CMD ["node", "apps/api/dist/main"]
