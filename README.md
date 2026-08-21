# 🌟 Momentum (Himma) — Learning Insight Engine

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
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
- **Chrome Extension API**: Dedicated endpoints (`/api/extension/*`) for frictionless background domain tracking.

### 📝 4. Notes & Reflection Links
- Rich reflection notes linked directly to specific learning activities or saved as standalone thoughts.
- Tagging system for flexible filtering and thematic search across notes and timeline entries.

### ⚡ 5. Offline-First PWA & Background Sync
- Powered by `@serwist/next` with custom Service Worker caching strategies.
- IndexedDB fallback queue automatically saves study drafts when offline and synchronizes with the server upon reconnection.
- Installable on iOS, Android, macOS, and Windows with Web Push notification hooks.

### 🛡️ 6. Privacy, Security & Data Ownership
- **Complete Data Export**: One-click download of the user's entire dataset as a structured JSON bundle (`/api/user/export`).
- **Right-to-Be-Forgotten**: Complete account deletion cascading across PostgreSQL tables and Supabase Auth (`DELETE /api/user/account`).
- **Security-First Backend**: Enforces `helmet`, parameterized queries via Prisma, strict Zod validation schemas, and rate limiting.

---

## 🏛️ Architecture & Tech Stack

```
himma/
├── frontend/             # Next.js 14 App Router client (PWA)
│   ├── app/              # Routes (dashboard, timeline, insights, profile, settings, etc.)
│   ├── components/       # Radix UI + Framer Motion components
│   ├── hooks/            # Custom hooks (offline sync, push notifications, intersection observer)
│   ├── lib/              # API clients, Supabase browser client, and utilities
│   └── public/           # PWA manifests, icons, service worker assets
├── backend/              # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/       # Environment parsing, Prisma client, Supabase admin
│   │   ├── controllers/  # REST controllers (activities, notes, insights, import, user)
│   │   ├── middleware/   # Supabase JWT authentication, rate limiters, validation
│   │   ├── routes/       # Express route definitions
│   │   ├── schemas/      # Zod validation schemas
│   │   └── services/     # Business logic, AI engine, batch scheduler, digest service
│   └── prisma/           # Database schema definition, migrations, and seeds
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
| **Database & ORM** | Supabase PostgreSQL + Prisma | Strongly typed relational models with automated migrations |
| **Authentication** | Supabase Auth | JWT-based auth with auto-provisioning middleware |
| **AI Insights** | Google Gemini (`@google/genai`) | `gemini-2.0-flash` with prompt optimization and rolling digests |
| **Validation** | Zod | Type-safe runtime schema validation across all inputs |

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **npm** or **pnpm**
- **Supabase Project**: Active project with PostgreSQL database & Auth enabled
- **Google Gemini API Key**: API key from Google AI Studio

---

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/himma.git
cd himma

# Install dependencies across root, backend, and frontend
npm run install:all
```

---

### 2. Configure Environment Variables

#### Backend Configuration (`backend/.env`)
Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase Auth & Admin
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

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
Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

---

### 3. Database Migration & Prisma Setup

```bash
# Generate Prisma Client
npm run db:generate

# Push database schema to Supabase PostgreSQL
npm run db:push

# (Optional) Open Prisma Studio visual database editor
npm run db:studio
```

> **Optional Database Trigger**: To automatically create a profile record when a user registers through Supabase Auth, run the following SQL script in your Supabase SQL Editor:
> ```sql
> create or replace function public.handle_new_user()
> returns trigger as $$
> begin
>   insert into public.users (id, email)
>   values (new.id, new.email)
>   on conflict (id) do update set email = excluded.email;
>   return new;
> end;
> $$ language plpgsql security definer;
> 
> create trigger on_auth_user_created
>   after insert on auth.users
>   for each row execute procedure public.handle_new_user();
> ```

---

### 4. Run the Development Server

Start both the backend and frontend concurrently with live reloading:

```bash
npm run dev
```

- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 📡 API Endpoints Reference

All protected endpoints require an `Authorization: Bearer <token>` header obtained from Supabase Auth.

| Category | Method | Endpoint | Auth | Description |
| :--- | :---: | :--- | :---: | :--- |
| **System** | `GET` | `/health` | Public | Healthcheck for API & database connectivity |
| **Profile** | `GET` | `/api/profile` | Required | Fetch current user's profile, skills, and target goals |
| | `PUT` | `/api/profile` | Required | Upsert profile skills, interests, and target path |
| **Activities** | `GET` | `/api/activities` | Required | List user activities (supports pagination & filtering) |
| | `POST` | `/api/activities` | Required | Create a new manual learning activity entry |
| | `GET` | `/api/activities/:id` | Required | Get specific activity by ID |
| | `PUT` | `/api/activities/:id` | Required | Update activity title, URL, tags, or type |
| | `DELETE` | `/api/activities/:id` | Required | Delete activity entry |
| **Notes** | `GET` | `/api/notes` | Required | List user notes (with optional linked activity details) |
| | `POST` | `/api/notes` | Required | Create a new note / reflection |
| | `GET` | `/api/notes/:id` | Required | Get specific note by ID |
| | `PUT` | `/api/notes/:id` | Required | Update note content and tags |
| | `DELETE` | `/api/notes/:id` | Required | Delete note entry |
| **Import** | `POST` | `/api/import/upload` | Required | Upload browser history JSON (multipart up to 5MB) |
| | `POST` | `/api/import/urls` | Required | Paste raw URL array for metadata resolution & staging |
| | `GET` | `/api/import/candidates` | Required | Fetch pending import candidate items |
| | `POST` | `/api/import/confirm` | Required | Approve candidates into permanent activities or reject |
| **Insights** | `POST` | `/api/insights/generate` | Required | Trigger on-demand Gemini AI synthesis pipeline |
| | `GET` | `/api/insights` | Required | List past insight runs and trajectory histories |
| | `GET` | `/api/insights/:id` | Required | Retrieve full details of a specific insight run |
| | `POST` | `/api/insights/feedback` | Required | Submit user feedback on AI insights |
| **Extension** | `GET` | `/api/extension/allowlist` | Required | Fetch domain allowlist for browser extension |
| | `POST` | `/api/extension/track-domain` | Required | Track domain activity from Chrome extension |
| **Account** | `GET` | `/api/user/export` | Required | Download full GDPR JSON export bundle |
| | `DELETE` | `/api/user/account` | Required | Permanently purge account & all associated data |

---

## 💻 Available Scripts

### Root Workspace
| Command | Description |
| :--- | :--- |
| `npm run install:all` | Installs dependencies across root, `backend/`, and `frontend/` |
| `npm run dev` | Runs backend (`localhost:8000`) and frontend (`localhost:3000`) concurrently |
| `npm run dev:backend` | Runs only the Express backend development server with `tsx` |
| `npm run dev:frontend` | Runs only the Next.js development server |
| `npm run build` | Builds both backend (TypeScript compilation) and frontend (Next.js production build) |
| `npm run db:generate` | Generates the Prisma Client types |
| `npm run db:push` | Deploys schema changes directly to Supabase PostgreSQL |
| `npm run db:studio` | Launches Prisma Studio GUI for database inspection |

---

## 🚢 Deployment

### 1. Frontend (Vercel)
1. Import the repository into [Vercel](https://vercel.com).
2. Set the **Root Directory** to `frontend`.
3. Configure environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`).
4. Deploy!

### 2. Backend (Railway / Render / Fly.io)
1. Create a new service pointing to the `backend` folder.
2. Build Command: `npm run build`
3. Start Command: `npm start`
4. Supply all required production environment variables (including `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`).
5. Configure health check path to `/health`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
