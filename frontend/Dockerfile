FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/contracts/tsconfig.json ./packages/contracts/tsconfig.json
COPY packages/contracts/src ./packages/contracts/src
RUN npm ci
RUN npm run build:contracts

COPY frontend ./frontend
ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build --workspace frontend

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/frontend/package.json ./frontend/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
WORKDIR /app/frontend
EXPOSE 3000
CMD ["npm", "start"]
