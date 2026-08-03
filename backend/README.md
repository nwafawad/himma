# Momentum (Himma) Backend Service

Standalone REST API and AI Insight Engine backend for **Momentum (Himma)** — a learning-insight web application built with Node.js, Express, TypeScript, Prisma ORM, Supabase PostgreSQL, and Google Gemini AI.

---

## 🏗️ System Architecture & Technology Stack

- **Runtime & Language**: Node.js (v20+) + TypeScript
- **Web Framework**: Express.js
- **Database & ORM**: Supabase PostgreSQL with Prisma ORM (`@prisma/client`)
- **Authentication**: Supabase Auth (JWT validation via `@supabase/supabase-js`)
- **AI Insight Engine**: Google Gemini API (`@google/genai` / `gemini-2.0-flash`) with fallback heuristic engine
- **Job Scheduling**: `node-cron` background daemon for non-blocking periodic batch runs
- **File Upload & Validation**: `multer` with 5MB file size limits and Zod schema validation
- **Security & Headers**: `helmet`, dynamic CORS whitelisting, body parser caps, and production HTTPS enforcement

---

## 🔐 Account Creation & Authentication Architecture

Account creation and identity management are delegated directly to **Supabase Auth** on the frontend client (`supabase.auth.signUp()` or OAuth social providers).

### Backend Authentication Flow
1. The frontend authenticates with Supabase Auth and receives a JWT access token.
2. API requests to protected routes pass `Authorization: Bearer <token>`.
3. The Express [`requireAuth`](src/middleware/auth.ts) middleware verifies the JWT against Supabase (`supabase.auth.getUser`).
4. **Auto-Provisioning**: On token verification, the backend automatically upserts a matching record in `public.users` if one does not exist yet.

### Recommended Supabase Database Trigger
To ensure instant database synchronization upon user registration, apply this SQL trigger in your Supabase SQL Editor:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 🧠 AI Insight Engine & Batch Scheduler

### 1. Periodic Batch Job Scheduling (`FR-4.1`, `Section 2.5`)
- The Insight Engine runs as a background batch job (default weekly: `0 0 * * 0`) managed by [`src/services/scheduler.service.ts`](src/services/scheduler.service.ts).
- Processing occurs asynchronously outside HTTP request/response lifecycles.

### 2. Batch Failure Retries & Decoupled Writes (`NFR-4.2`, `NFR-4.3`)
- Per-user batch execution executes up to 2 retries with exponential backoff (1s, 2s).
- Failed AI runs record status in `insight_runs` without altering or corrupting user-authored `ActivityEntry` or `NoteEntry` data.

### 3. Rolling Profile Digest (`FR-4.8`)
- User activities/notes older than the 30-day recency window are condensed into a rolling summary stored in the `ProfileDigest` table by [`src/services/ai/digest.service.ts`](src/services/ai/digest.service.ts).
- The digest is injected into LLM prompt contexts to keep input tokens bounded regardless of user account age.

### 4. Insufficient-Data Handling (`FR-9.4`)
- Checks minimum entry thresholds (`MIN_INSIGHT_ACTIVITIES`, `MIN_INSIGHT_NOTES`).
- If activity is below minimums, generation is skipped and recorded in database as `status: "skipped"` with clear reason metadata.

### 5. Cost & Usage Guardrail (`Section 2.5`)
- Enforces monthly run caps per user (`MAX_MONTHLY_INSIGHT_RUNS_PER_USER`, default `10`) and token limits (`MAX_TOKENS_PER_RUN`).

---

## 📥 Activity Import Module (`FR-3.1–3.4`, `NFR-2.4`)

Supports importing external learning history without auto-persisting unverified items:
1. **Browser History Upload**: `POST /api/import/upload` accepts JSON history export files up to 5MB (validated via `multer` and Zod).
2. **Pasted URLs**: `POST /api/import/urls` accepts raw URL lists and infers item titles and activity types (`article`, `video`, `course`, `repository`).
3. **Candidate Staging**: Parsed items are saved into the `import_candidates` table with `status: "pending"`.
4. **User Review & Confirmation**: `POST /api/import/confirm` converts user-approved candidate IDs into permanent `ActivityEntry` records and sets excluded IDs to `status: "rejected"`.

---

## 🛡️ Data Privacy & Compliance (`NFR-3.4`, `Section 11.3`)

- **Full Data Export**: `GET /api/user/export` returns a downloadable JSON file (`Content-Disposition: attachment`) containing the user's complete data bundle (`profile`, `activities`, `notes`, `insights`, `candidates`, `digests`).
- **Account Deletion**: `DELETE /api/user/account` permanently deletes the user's PostgreSQL records (cascading to all associated tables) and triggers administrative deletion of the Supabase Auth user.

---

## 📡 API Endpoints Reference

| Endpoint | Method | Auth | Description |
| :--- | :---: | :---: | :--- |
| `/health` | `GET` | Public | Service & Database health check |
| `/api/profile` | `GET` / `PUT` | Required | Retrieve or update user skills & goals profile |
| `/api/activities` | `GET` / `POST` / `PUT` / `DELETE` | Required | CRUD for user learning activities |
| `/api/notes` | `GET` / `POST` / `PUT` / `DELETE` | Required | CRUD for user notes & activity links |
| `/api/import/upload` | `POST` | Required | Upload & parse browser history export file (staged) |
| `/api/import/urls` | `POST` | Required | Parse & stage pasted learning URLs |
| `/api/import/candidates` | `GET` | Required | List user's pending import candidates |
| `/api/import/confirm` | `POST` | Required | Approve selected candidates into ActivityEntries |
| `/api/insights/generate` | `POST` | Required | Manually trigger AI Insight pipeline for user |
| `/api/insights` | `GET` | Required | List user's past Insight Runs |
| `/api/user/export` | `GET` | Required | Download full user data export file |
| `/api/user/account` | `DELETE` | Required | Permanently delete user account & all data |

---

## 🔑 Environment Variables Reference

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | HTTP server port | `8000` |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated or `*`) | `http://localhost:3000` |
| `DATABASE_URL` | Supabase PostgreSQL connection string | `postgresql://postgres:[PASS]@db.[REF].supabase.co:5432/postgres` |
| `SUPABASE_URL` | Supabase API URL | `https://[REF].supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Anon Key | `your_anon_key` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (Admin operations) | `your_service_role_key` |
| `GEMINI_API_KEY` | Google Gemini API Key | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.0-flash` |
| `INSIGHT_BATCH_CRON` | Cron schedule for batch Insight job | `0 0 * * 0` (Weekly Sunday midnight) |
| `MIN_INSIGHT_ACTIVITIES` | Min activities required for Insight run | `3` |
| `MIN_INSIGHT_NOTES` | Min notes required for Insight run | `1` |
| `MAX_MONTHLY_INSIGHT_RUNS_PER_USER` | Monthly cap on Insight runs per user | `10` |
| `MAX_TOKENS_PER_RUN` | Token cap per Insight run | `8000` |

---

## 🛠️ Local Development & Commands

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npm run db:generate

# 3. Start development server (with live reload)
npm run dev

# 4. Build and run production bundle
npm run build
npm start
```