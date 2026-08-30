# 🌟 Momentum (Himma) — Learning Insight Engine

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google_Gemini_AI-8E75C2?style=for-the-badge&logo=google&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PWA](https://img.shields.io/badge/PWA_Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

**An intelligent, offline-capable learning insight platform that turns self-directed study, reading, and exploration into structured skill trajectories and AI-powered momentum.**

[Features](#-key-features) • [Architecture](#-architecture--tech-stack) • [Quickstart](#-quickstart--local-setup) • [API Reference](#-api-endpoints-reference) • [Monorepo Scripts](#-available-scripts) • [Deployment](#-deployment)

</div>

---

## 📖 Overview

In modern self-directed learning, knowledge workers, researchers, and engineers consume vast amounts of articles, videos, repositories, and documentation across disconnected platforms. It is easy to lose track of what was learned, whether study habits align with long-term career goals, or where conceptual blindspots exist.

**Momentum (Himma)** solves this by providing:
1. **Effortless Capture**: Ingest learning activities via browser history imports, pasted URLs, manual logs, or Chrome extension integrations.
2. **Controlled Staging**: Never pollute your profile with unverified noise; review and confirm candidates before persistence.
3. **AI Learning Synthesis**: Leverage Google Gemini to analyze study patterns, compute goal alignment scores, generate skill summaries, and suggest candidate focus paths.
4. **Offline-First Experience**: Progressive Web App (PWA) with background sync and offline drafting so tracking never interrupts deep work.
5. **Radical Privacy**: Export your entire dataset anytime or purge all records with a single click.

---

## ✨ Key Features

### 📊 1. Intelligent Dashboard & Activity Feed
- **Today's Momentum**: Real-time snapshot of recent activities, active learning streaks, and quick-action capture modals.
- **AI Synthesis Card**: Dynamic hero block displaying current skill trajectories, alignment ratings (`on track`, `drifting`, `no stated goal yet`), and recent synthesis timestamps.

### 🧠 2. Gemini-Powered AI Insight Engine
- **Skill Trajectory Mapping**: Extracts implicit concepts learned across articles, videos, courses, and repositories.
- **Goal Alignment Analysis**: Compares current consumption against user-defined target paths and interests.
- **Rolling Profile Digest**: Summarizes historical activity outside the 30-day active window to maintain bounded context token usage without losing long-term context.
- **Heuristic Fallback Engine**: Deterministic fallback mechanism ensures insights are generated even if LLM rate limits or network issues occur.

### 📥 3. Multi-Channel Activity Ingestion
- **Browser History Import**: Upload JSON export files (up to 5MB) with automatic noise filtering and domain normalization.
- **URL Staging & Metadata Scraping**: Paste URL batches; the backend infers titles, resource types (`article`, `video`, `course`, `repository`), and tags.
- **Staging Candidate Workflow**: Review candidate items in a staging queue with `pending`, `approved`, or `rejected` states.
- **Chrome Extension API**: Dedicated endpoints (`/api/v1/extension/*`) for frictionless background domain tracking.

### 📝 4. Notes & Reflection Links
- Rich reflection notes linked directly to specific learning activities or saved as standalone thoughts.
- Tagging system for flexible filtering and thematic search across notes and timeline entries.

### ⚡ 5. Offline-First PWA & Background Sync
- Powered by `@serwist/next` with custom Service Worker caching strategies.
- IndexedDB fallback queue automatically saves study drafts when offline and synchronizes with the server upon reconnection.
- Installable on iOS, Android, macOS, and Windows with Web Push notification hooks.

### 🛡️ 6. Privacy, Security & Data Ownership
- **Complete Data Export**: One-click download of the user's entire dataset as a structured JSON bundle (`/api/v1/user/export`).
- **Right-to-Be-Forgotten**: Complete account deletion cascading across database records (`DELETE /api/v1/user/account`).
- **Security-First Backend**: Enforces `helmet`, parameterized queries via Prisma, strict Zod validation schemas, bcrypt password hashing, and rate limiting.

---

## 🏛️ Architecture & Tech Stack

See [docs/architecture.md](docs/architecture.md) for dependency rules and the
feature-module conventions.

```
himma/
├── docker-compose.yml    # Local PostgreSQL database container
├── frontend/             # Next.js 14 App Router client (PWA)
│   ├── app/              # Thin route files grouped by public/authenticated shell
│   ├── features/         # Domain UI, API functions, and view models
│   ├── components/       # Shared UI and application shells
│   ├── hooks/            # Custom hooks (offline sync, push notifications, intersection observer)
│   ├── lib/              # API clients, local auth client, and utilities
│   └── public/           # PWA manifests, icons, service worker assets
├── backend/              # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/       # Environment parsing, Prisma client, database connection pool
│   │   ├── modules/      # Domain routes, controllers, services, and local schemas
│   │   ├── jobs/         # Background schedulers and batch orchestration
│   │   ├── infrastructure/ # Replaceable storage adapters
│   │   ├── middleware/   # JWT authentication, rate limiters, validation
│   │   └── routes/       # Top-level API router composition
│   ├── uploads/          # Local storage for avatars and media uploads
│   └── prisma/           # Database schema definition, migrations, and seeds
├── packages/contracts/   # Shared Zod HTTP schemas and inferred TypeScript types
└── package.json          # Monorepo root orchestration with concurrently
```

### Technology Breakdown

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router) | React Server & Client Components, modern layouts |
| **UI & Animations** | Tailwind CSS + Framer Motion | Smooth transitions, rich dark/light design system |
| **Component Primitives** | Radix UI (`@radix-ui/*`) | Accessible dialogs, popovers, and hover cards |
| **PWA & Offline** | Serwist (`@serwist/next`) | Service worker caching, background sync, install prompts |
| **Backend Runtime** | Node.js 20+ & Express.js | High-throughput REST API with TypeScript |
| **Database & ORM** | PostgreSQL + Prisma ORM | Strongly typed relational models with automated migrations |
| **Authentication** | Local JWT + Bcrypt | Self-contained user registration, credential verification, and JWT session handling |
| **File Storage** | Local Multer Storage | Static local asset serving under `/uploads/avatars` |
| **AI Insights** | Google Gemini (`@google/genai`) | `gemini-2.0-flash` with prompt optimization and rolling digests |
| **Validation** | Zod | Type-safe runtime schema validation across all inputs |

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **Docker** (optional for local PostgreSQL) or a local PostgreSQL instance
- **Google Gemini API Key**: API key from Google AI Studio

---

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/himma.git
cd himma

# Install every workspace from the root lockfile
npm run install:all
```

---

### 2. Start Local PostgreSQL Database

Using Docker Compose:
```bash
docker compose up -d
```
This spins up PostgreSQL 16 on port `5432` with database `momentum_db`.

---

### 3. Configure Environment Variables

#### Backend Configuration (`backend/.env`)
```env
# Server
PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database (Local PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/momentum_db"

# JWT Authentication
JWT_SECRET="momentum-dev-jwt-secret-key-32chars!"
JWT_EXPIRES_IN="7d"

# AI Insight Engine (Google Gemini)
GEMINI_API_KEY="your-google-gemini-api-key"
GEMINI_MODEL="gemini-2.0-flash"

# Batch Scheduler & Safeguards
INSIGHT_BATCH_CRON="0 0 * * 0"
MIN_INSIGHT_ACTIVITIES=3
MIN_INSIGHT_NOTES=1
MAX_MONTHLY_INSIGHT_RUNS_PER_USER=10
MAX_TOKENS_PER_RUN=8000
```

#### Frontend Configuration (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"
```

---

### 4. Database Migration & Prisma Setup

```bash
# Generate Prisma Client
npm run db:generate

# Deploy committed migrations to PostgreSQL
npm run db:deploy
```

---

### 5. Run the Monorepo

Start both frontend and backend concurrently in development mode:

```bash
npm run dev
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000/api/v1`
- **Health Check**: `http://localhost:8000/health`

---

## 📡 API Endpoints Reference

`/api/v1` is the canonical API prefix. The legacy `/api` prefix remains available
temporarily and returns an `X-API-Deprecated: true` response header.

All protected endpoints require an `Authorization: Bearer <token>` header obtained from `/api/v1/auth/login` or `/api/v1/auth/signup`.

### Authentication
- `POST /api/v1/auth/signup` — Create a new user account with hashed password
- `POST /api/v1/auth/login` — Authenticate credentials and receive JWT access token
- `GET /api/v1/auth/me` — Retrieve current authenticated user & profile
- `POST /api/v1/auth/logout` — Terminate session

### Activities & Staging
- `GET /api/v1/activities` — Paginated activity journal
- `POST /api/v1/activities` — Log a new learning entry
- `POST /api/v1/import/urls` — Batch URL ingestion & metadata extraction
- `POST /api/v1/import/upload` — Upload browser history JSON

### File Uploads
- `POST /api/v1/upload/avatar` — Upload profile avatar image (stores in `backend/uploads/avatars/`)

### AI Insights
- `POST /api/v1/insights/generate` — Trigger on-demand Gemini trajectory synthesis
- `GET /api/v1/insights?limit=1` — Fetch the latest generated insight run

### User Data & GDPR
- `GET /api/v1/user/export` — Download complete GDPR data bundle (JSON)
- `DELETE /api/v1/user/account` — Permanently delete user account and all data

---

## 📦 Available Scripts

From the repository root:

| Command | Description |
| :--- | :--- |
| `npm ci` | Reproducibly installs all workspaces from the root lockfile |
| `npm run dev` | Runs backend and frontend concurrently |
| `npm test` | Runs the backend test suite |
| `npm run typecheck` | Type-checks every workspace |
| `npm run build` | Builds both backend (tsc) and frontend (Next.js) |
| `npm run verify` | Runs tests, typechecks, and production builds |
| `npm run db:generate` | Generates Prisma client bindings |
| `npm run db:deploy` | Applies committed Prisma migrations to PostgreSQL |
| `npm run db:studio` | Opens Prisma Studio GUI on `localhost:5555` |

## Container Build

Build the backend image from the repository root so Docker can access the root
workspace lockfile and the Prisma schema:

```bash
docker build -f backend/Dockerfile -t momentum-backend .
```

Railway deployments must also use the repository root (`/`) as their Root
Directory because the backend workspace depends on files at that level.
