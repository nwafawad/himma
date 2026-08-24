-- ==============================================================================
-- Production SQL Migration: Schema, Enums, Constraints, Triggers, Indexes & RLS
-- Target: PostgreSQL 15+ / Supabase Auth (auth.users)
-- Project: Momentum / Himma Backend
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Custom Enum Types
-- ------------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE "activity_source" AS ENUM ('manual', 'import', 'extension');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "activity_type" AS ENUM ('article', 'video', 'course', 'repository', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "alignment_score" AS ENUM ('on track', 'drifting', 'no stated goal yet');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "import_candidate_status" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. Tables & Schema Definitions
-- ------------------------------------------------------------------------------

-- Table 1: users (Profile extension of auth.users)
CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" UUID NOT NULL PRIMARY KEY REFERENCES auth.users("id") ON DELETE CASCADE,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 2: skills_goals_profile
CREATE TABLE IF NOT EXISTS "public"."skills_goals_profile" (
    "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL UNIQUE REFERENCES public.users("id") ON DELETE CASCADE,
    "avatar_url" TEXT NULL,
    "current_skills" TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    "interests" TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    "target_path" TEXT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 3: activity_entries
CREATE TABLE IF NOT EXISTS "public"."activity_entries" (
    "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES public.users("id") ON DELETE CASCADE,
    "source" "activity_source" NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NULL,
    "type" "activity_type" NOT NULL,
    "tags" TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    "consumed_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 4: note_entries
CREATE TABLE IF NOT EXISTS "public"."note_entries" (
    "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES public.users("id") ON DELETE CASCADE,
    "text" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    "linked_activity_id" UUID NULL REFERENCES "public"."activity_entries"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 5: insight_runs
CREATE TABLE IF NOT EXISTS "public"."insight_runs" (
    "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES public.users("id") ON DELETE CASCADE,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "input_window" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "skill_summary" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "direction_summary" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "alignment_score" "alignment_score" NOT NULL,
    "citations" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "status_reason" TEXT NULL,
    "tokens_used" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "public"."import_candidates" (
    "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES public.users("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "url" TEXT NULL,
    "type" "activity_type" NOT NULL,
    "source" "activity_source" NOT NULL DEFAULT 'import',
    "tags" TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    "consumed_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "status" "import_candidate_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."profile_digests" (
    "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES public.users("id") ON DELETE CASCADE,
    "period_start" TIMESTAMPTZ NOT NULL,
    "period_end" TIMESTAMPTZ NOT NULL,
    "digest_summary" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "profile_digests_period_check" CHECK (period_end >= period_start)
);

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.api_rate_limits (
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "window_start" TIMESTAMPTZ NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1 CHECK (count > 0),
    "expires_at" TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (scope, key, window_start)
);

CREATE INDEX IF NOT EXISTS "idx_api_rate_limits_expires_at" ON private.api_rate_limits (expires_at);

-- ------------------------------------------------------------------------------
-- 3. Database Triggers & Functions
-- ------------------------------------------------------------------------------

-- Function to automatically refresh updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = '';

-- Trigger for skills_goals_profile
DROP TRIGGER IF EXISTS set_skills_goals_profile_updated_at ON "public"."skills_goals_profile";
CREATE TRIGGER set_skills_goals_profile_updated_at
BEFORE UPDATE ON "public"."skills_goals_profile"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function & Trigger to auto-create public.users row on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, created_at)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.created_at, now()))
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 4. Indexes Strategy
-- ------------------------------------------------------------------------------

-- Foreign Key Performance Indexes
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "public"."users" ("email");
CREATE INDEX IF NOT EXISTS "idx_skills_goals_profile_user_id" ON "public"."skills_goals_profile" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_activity_entries_user_id" ON "public"."activity_entries" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_note_entries_user_id" ON "public"."note_entries" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_note_entries_linked_activity_id" ON "public"."note_entries" ("linked_activity_id");
CREATE INDEX IF NOT EXISTS "idx_insight_runs_user_id" ON "public"."insight_runs" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_import_candidates_user_status" ON "public"."import_candidates" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_import_candidates_user_url" ON "public"."import_candidates" ("user_id", "url");
CREATE INDEX IF NOT EXISTS "idx_profile_digests_user_created" ON "public"."profile_digests" ("user_id", "created_at" DESC);

-- Date Range Query Indexes
CREATE INDEX IF NOT EXISTS "idx_activity_entries_consumed_at" ON "public"."activity_entries" ("user_id", "consumed_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_note_entries_created_at" ON "public"."note_entries" ("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_insight_runs_timestamp" ON "public"."insight_runs" ("user_id", "timestamp" DESC);

-- GIN Indexes for Tag Array Operations
CREATE INDEX IF NOT EXISTS "idx_activity_entries_tags" ON "public"."activity_entries" USING GIN ("tags");
CREATE INDEX IF NOT EXISTS "idx_note_entries_tags" ON "public"."note_entries" USING GIN ("tags");

-- ------------------------------------------------------------------------------
-- 5. Row-Level Security (RLS) Enablement & Policy Definitions
-- ------------------------------------------------------------------------------

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."skills_goals_profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."activity_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."note_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."insight_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."import_candidates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profile_digests" ENABLE ROW LEVEL SECURITY;

-- -----------------------------------
-- RLS Policies: public.users
-- -----------------------------------
DROP POLICY IF EXISTS "Users can read own profile" ON "public"."users";
CREATE POLICY "Users can read own profile"
    ON "public"."users" FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON "public"."users";
CREATE POLICY "Users can insert own profile"
    ON "public"."users" FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON "public"."users";
CREATE POLICY "Users can update own profile"
    ON "public"."users" FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON "public"."users";
CREATE POLICY "Users can delete own profile"
    ON "public"."users" FOR DELETE
    USING (auth.uid() = id);

-- -----------------------------------
-- RLS Policies: public.skills_goals_profile
-- -----------------------------------
DROP POLICY IF EXISTS "Users can read own skills profile" ON "public"."skills_goals_profile";
CREATE POLICY "Users can read own skills profile"
    ON "public"."skills_goals_profile" FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own skills profile" ON "public"."skills_goals_profile";
CREATE POLICY "Users can insert own skills profile"
    ON "public"."skills_goals_profile" FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own skills profile" ON "public"."skills_goals_profile";
CREATE POLICY "Users can update own skills profile"
    ON "public"."skills_goals_profile" FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own skills profile" ON "public"."skills_goals_profile";
CREATE POLICY "Users can delete own skills profile"
    ON "public"."skills_goals_profile" FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------
-- RLS Policies: public.activity_entries
-- -----------------------------------
DROP POLICY IF EXISTS "Users can read own activities" ON "public"."activity_entries";
CREATE POLICY "Users can read own activities"
    ON "public"."activity_entries" FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activities" ON "public"."activity_entries";
CREATE POLICY "Users can insert own activities"
    ON "public"."activity_entries" FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own activities" ON "public"."activity_entries";
CREATE POLICY "Users can update own activities"
    ON "public"."activity_entries" FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own activities" ON "public"."activity_entries";
CREATE POLICY "Users can delete own activities"
    ON "public"."activity_entries" FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------
-- RLS Policies: public.note_entries
-- -----------------------------------
DROP POLICY IF EXISTS "Users can read own notes" ON "public"."note_entries";
CREATE POLICY "Users can read own notes"
    ON "public"."note_entries" FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notes" ON "public"."note_entries";
CREATE POLICY "Users can insert own notes"
    ON "public"."note_entries" FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notes" ON "public"."note_entries";
CREATE POLICY "Users can update own notes"
    ON "public"."note_entries" FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notes" ON "public"."note_entries";
CREATE POLICY "Users can delete own notes"
    ON "public"."note_entries" FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------
-- RLS Policies: public.insight_runs (Immutable - No UPDATE policy granted)
-- -----------------------------------
DROP POLICY IF EXISTS "Users can read own insights" ON "public"."insight_runs";
CREATE POLICY "Users can read own insights"
    ON "public"."insight_runs" FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own insights" ON "public"."insight_runs";
CREATE POLICY "Users can insert own insights"
    ON "public"."insight_runs" FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own insights" ON "public"."insight_runs";
CREATE POLICY "Users can delete own insights"
    ON "public"."insight_runs" FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can read own import candidates" ON public.import_candidates FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own import candidates" ON public.import_candidates FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own import candidates" ON public.import_candidates FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own import candidates" ON public.import_candidates FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can read own profile digests" ON public.profile_digests FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own profile digests" ON public.profile_digests FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own profile digests" ON public.profile_digests FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own profile digests" ON public.profile_digests FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);
