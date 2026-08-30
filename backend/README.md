# Momentum (Himma) Backend Service

Standalone REST API and AI Insight Engine backend for **Momentum (Himma)** — a learning-insight web application built with Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, and Google Gemini AI.

---

## 🏗️ System Architecture & Technology Stack

- **Runtime & Language**: Node.js (v20+) + TypeScript
- **Web Framework**: Express.js
- **Database & ORM**: PostgreSQL with Prisma ORM (`@prisma/client`)
- **Authentication**: Local JWT Authentication (`jsonwebtoken` + `bcryptjs`)
- **AI Insight Engine**: Google Gemini API (`@google/genai` / `gemini-2.0-flash`) with fallback heuristic engine
- **Job Scheduling**: `node-cron` background daemon for non-blocking periodic batch runs
- **File Upload & Validation**: `multer` with 5MB file size limits, stored locally under `uploads/avatars`
- **Security & Headers**: `helmet`, dynamic CORS whitelisting, body parser caps, and production HTTPS enforcement

---

## 🔐 Account Creation & Authentication Architecture

Authentication is fully self-contained using secure password hashing and JWT access tokens.

### Backend Authentication Flow
1. **Sign Up**: `POST /api/v1/auth/signup` takes `{ email, password, name? }`, hashes the password with `bcryptjs`, creates the user and profile in PostgreSQL, and issues a JWT token.
2. **Login**: `POST /api/v1/auth/login` verifies credentials and returns a JWT access token.
3. **Protected Requests**: Clients pass `Authorization: Bearer <token>` in headers.
4. **Token Verification**: The Express [`requireAuth`](src/middleware/auth.ts) middleware verifies the JWT against `JWT_SECRET` and attaches the user payload to `req.user`.

---

## 🧠 AI Insight Engine & Batch Scheduler

### 1. Periodic Batch Job Scheduling (`FR-4.1`, `Section 2.5`)
- The Insight Engine runs as a background batch job (default weekly: `0 0 * * 0`) managed by [`src/jobs/insights.scheduler.ts`](src/jobs/insights.scheduler.ts).
- Processing occurs asynchronously outside HTTP request/response lifecycles.

### 2. Batch Failure Retries & Decoupled Writes (`NFR-4.2`, `NFR-4.3`)
- Per-user batch execution executes up to 2 retries with exponential backoff (1s, 2s).
- Failed AI runs record status in `insight_runs` without altering or corrupting user-authored `ActivityEntry` or `NoteEntry` data.

### 3. Rolling Profile Digest (`FR-4.8`)
- User activities/notes older than the 30-day recency window are condensed into a rolling summary stored in the `ProfileDigest` table by [`src/modules/insights/ai/digest.service.ts`](src/modules/insights/ai/digest.service.ts).
- The digest is injected into LLM prompt contexts to keep input tokens bounded regardless of user account age.

### 4. Insufficient-Data Handling (`FR-9.4`)
- Checks minimum entry thresholds (`MIN_INSIGHT_ACTIVITIES`, `MIN_INSIGHT_NOTES`).
- If activity is below minimums, generation is skipped and recorded in database as `status: "skipped"` with clear reason metadata.

### 5. Cost & Usage Guardrail (`Section 2.5`)
- Enforces monthly run caps per user (`MAX_MONTHLY_INSIGHT_RUNS_PER_USER`, default `10`) and token limits (`MAX_TOKENS_PER_RUN`).

---

## 📥 Activity Import Module (`FR-3.1–3.4`, `NFR-2.4`)

Supports importing external learning history without auto-persisting unverified items:
1. **Browser History Upload**: `POST /api/v1/import/upload` accepts JSON history export files up to 5MB (validated via `multer` and Zod).
2. **Pasted URLs**: `POST /api/v1/import/urls` accepts raw URL lists and infers item titles and activity types (`article`, `video`, `course`, `repository`).
3. **Candidate Staging**: Parsed items are saved into the `import_candidates` table with `status: "pending"`.
4. **User Review & Confirmation**: `POST /api/v1/import/confirm` converts user-approved candidate IDs into permanent `ActivityEntry` records and sets excluded IDs to `status: "rejected"`.

---

## 🛡️ Data Privacy & Compliance (`NFR-3.4`, `Section 11.3`)

- **Full Data Export**: `GET /api/v1/user/export` returns a downloadable JSON file (`Content-Disposition: attachment`) containing the user's complete data bundle (`profile`, `activities`, `notes`, `insights`, `candidates`, `digests`).
- **Account Deletion**: `DELETE /api/v1/user/account` permanently deletes the user's PostgreSQL records (cascading to all associated tables).

---

## 📡 API Endpoints Reference

The canonical prefix is `/api/v1`. `/api` remains as a compatibility alias and
returns an `X-API-Deprecated: true` header with a successor link.

| Endpoint | Method | Auth | Description |
| :--- | :---: | :---: | :--- |
| `/health` | `GET` | Public | Service & Database health check |
| `/api/v1/auth/signup` | `POST` | Public | Register new account and receive JWT |
| `/api/v1/auth/login` | `POST` | Public | Authenticate with credentials |
| `/api/v1/auth/me` | `GET` | Required | Retrieve current user profile |
| `/api/v1/auth/logout` | `POST` | Public | Terminate session |
| `/api/v1/upload/avatar` | `POST` | Required | Upload profile avatar (stores locally) |
| `/api/v1/profile` | `GET` / `PUT` | Required | Retrieve or update user skills & goals profile |
| `/api/v1/activities` | `GET` / `POST` / `PUT` / `DELETE` | Required | CRUD for user learning activities |
| `/api/v1/notes` | `GET` / `POST` / `PUT` / `DELETE` | Required | CRUD for user notes & activity links |
| `/api/v1/import/upload` | `POST` | Required | Upload & parse browser history export file (staged) |
| `/api/v1/import/urls` | `POST` | Required | Parse & stage pasted learning URLs |
| `/api/v1/import/candidates` | `GET` | Required | List pending/staged import candidates |
| `/api/v1/import/confirm` | `POST` | Required | Commit approved candidates to activities |
| `/api/v1/insights/generate` | `POST` | Required | Trigger on-demand AI insight synthesis |
| `/api/v1/insights` | `GET` / `POST` | Required | List or manually create insight runs |
| `/api/v1/insights/:id` | `GET` | Required | Retrieve one generated trajectory report |
| `/api/v1/user/export` | `GET` | Required | Download full account data (GDPR JSON) |
| `/api/v1/user/account` | `DELETE` | Required | Erase user account & cascade-delete all data |

---

## 🚀 Local Development

```bash
# 1. Start local PostgreSQL
docker compose up -d

# 2. Run migrations
npm run db:deploy

# 3. Start development server
npm run dev
```
