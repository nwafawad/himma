# Momentum Backend Service

Standalone, versioned REST API backend for **Momentum** — a learning-insight web application.

---

## 🏗️ Architecture & Technology Stack

- **Runtime & Framework**: Node.js (v20+) + Express (TypeScript)
- **Architecture**: Decoupled, stateless REST API (`/api/v1`)
- **Database**: PostgreSQL (provisioned via Supabase)
- **Database Client**: `pg` (node-postgres) with connection pooling (`pg.Pool`)
- **Security**: `helmet` security headers, strict CORS, body size parsing limits (1MB), and production HTTPS enforcement
- **Containerization**: Multi-stage `Dockerfile` compatible with Render and Railway

### 💡 Database Client Justification
We selected `pg` (`pg.Pool`) over heavy ORMs for initial infrastructure:
1. **Lightweight & High Performance**: Minimal runtime overhead and zero code generation build steps.
2. **Supabase Compatibility**: Directly connects to Supabase Transaction and Session poolers (PgBouncer) via standard connection strings.
3. **Explicit Connection Pooling**: Granular control over connection pool sizing, connection timeouts, and health checks (`SELECT 1`).
4. **Clean Abstraction**: Simple migration path to query builders (Kysely/Knex) or ORMs (Prisma) when domain models (`NoteEntry`, `ActivityEntry`, `InsightRun`) are defined.

---

## 📁 Directory Structure

```
.
├── src/
│   ├── config/
│   │   └── env.ts               # Environment variable loading & Zod schema validation
│   ├── controllers/
│   │   └── health.controller.ts # Service + Database health check controller
│   ├── db/
│   │   └── index.ts             # PostgreSQL connection pool (pg.Pool) & health queries
│   ├── middleware/
│   │   ├── auth.ts              # Provider-agnostic Auth middleware & strategy stub
│   │   ├── enforceHttps.ts      # Production HTTPS enforcement & edge header check
│   │   ├── errorHandler.ts      # Global centralized error handler
│   │   └── security.ts          # Helmet, CORS, and request body size limit config
│   ├── routes/
│   │   ├── health.routes.ts     # Health check routes (/health)
│   │   └── index.ts             # Primary API v1 router (/api/v1)
│   ├── app.ts                   # Express application setup & middleware assembly
│   └── index.ts                 # Server entrypoint & graceful shutdown handlers
├── .env.example                 # Template for required environment variables
├── Dockerfile                   # Multi-stage production container build
├── railway.json                 # Railway service deployment configuration
├── render.yaml                  # Render web service deployment configuration
└── tsconfig.json                # TypeScript compiler configuration
```

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` for local development:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | HTTP server listening port | `8000` |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` |
| `CORS_ORIGIN` | Allowed CORS origin(s), comma-separated | `http://localhost:3000` |
| `DATABASE_URL` | Supabase Postgres connection string | `postgresql://postgres:[PASS]@db.[REF].supabase.co:5432/postgres` |
| `SUPABASE_URL` | Supabase project API URL | `https://[REF].supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous API key | `your_anon_key` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `your_service_role_key` |

---

## 🔒 HTTPS & Edge TLS Termination

In production (`NODE_ENV=production`), client-server traffic MUST use HTTPS. Plain HTTP requests are redirected via HTTP 301.

**Cloud Provider Edge Note:**
On platforms like **Render** and **Railway**, TLS termination occurs at the edge proxy. The edge proxy receives HTTPS requests from clients, terminates TLS, and forwards HTTP traffic to the backend container while injecting the header:
```http
x-forwarded-proto: https
```
The application enables `app.set('trust proxy', 1)` to accurately detect `req.secure` and `x-forwarded-proto` headers behind these reverse proxies.

---

## 🔒 Auth Integration Point

Authentication is scaffolded via a provider-agnostic interface (`AuthProvider`) in `src/middleware/auth.ts`:
- Route controllers rely solely on `req.user` (`AuthUser` interface).
- Supabase Auth (`@supabase/supabase-js`) or Clerk (`@clerk/clerk-sdk-node`) can be plugged in by creating a class implementing `AuthProvider` and calling `setAuthProvider(new Provider())`.

---

## 🏥 Health Check Endpoint

- **Endpoint**: `GET /health` (also mounted at `GET /api/v1/health`)
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-08-02T22:00:00.000Z",
    "uptimeSeconds": 124.5,
    "environment": "development",
    "database": {
      "status": "connected",
      "latencyMs": 18
    }
  }
  ```
- **Error Response (HTTP 503 Service Unavailable)**:
  ```json
  {
    "status": "unhealthy",
    "timestamp": "2026-08-02T22:00:00.000Z",
    "uptimeSeconds": 124.5,
    "environment": "development",
    "database": {
      "status": "disconnected",
      "error": "connect ECONNREFUSED"
    }
  }
  ```

---

## 🛠️ Local Development & Setup

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL database (or Supabase project instance)

### Setup Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env and supply your Supabase DATABASE_URL connection string
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Build & Test Production Mode Locally**:
   ```bash
   npm run build
   npm start
   ```

---

## 🐳 Containerization & Cloud Deployment

### Local Docker Testing
```bash
# Build the Docker image
docker build -t momentum-backend .

# Run the container locally
docker run -p 8000:8000 --env-file .env momentum-backend
```

### Deploying to Render
1. Connect repository to **Render**.
2. Select **Web Service** using Docker runtime (or use `render.yaml`).
3. Set environment variables (`DATABASE_URL`, `SUPABASE_URL`, etc.).
4. Render automatically runs the `HEALTHCHECK` on `/health`.

### Deploying to Railway
1. Create a new service on **Railway** from GitHub.
2. Railway detects `Dockerfile` and `railway.json`.
3. Set service variables in the Railway project dashboard.