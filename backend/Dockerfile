# Build with the repository root as context:
#   docker build -f backend/Dockerfile .

FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests first to maximize dependency-layer caching.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY backend/prisma ./backend/prisma

# Install the backend workspace and its build dependencies. The Prisma schema
# is already present for the backend postinstall hook.
RUN npm ci --workspace backend

COPY backend/tsconfig.json ./backend/tsconfig.json
COPY backend/src ./backend/src
COPY packages/contracts/tsconfig.json ./packages/contracts/tsconfig.json
COPY packages/contracts/src ./packages/contracts/src

# Compile TypeScript and regenerate Prisma Client from the committed schema.
RUN npm run build:contracts && npm run build --workspace backend

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000
ENV UPLOAD_DIR=/app/backend/uploads

# Recreate only the backend production dependency tree from the root lockfile.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY backend/prisma ./backend/prisma

# Skip lifecycle scripts because the Prisma CLI is a development dependency.
RUN npm ci --workspace backend --omit=dev --ignore-scripts

# Reuse the client generated in the build stage.
COPY --from=builder /app/backend/node_modules/.prisma ./backend/node_modules/.prisma
COPY --from=builder /app/packages/contracts/dist ./packages/contracts/dist

# Copy compiled JavaScript output from builder stage
COPY --from=builder /app/backend/dist ./backend/dist

# Create the local development upload path. Production deployments should
# mount persistent storage or replace this with an object-storage adapter.
RUN mkdir -p backend/uploads/avatars

WORKDIR /app/backend

# Expose port
EXPOSE 8000

# Health check directive for Docker / hosting orchestrators
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Start production server
CMD ["npm", "start"]
