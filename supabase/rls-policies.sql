-- ============================================================
-- HealthLens — Row Level Security Policies
-- ============================================================
-- Paste this entire script into:
--   Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================


-- ── 1. Enable RLS on all 5 tables ────────────────────────────

ALTER TABLE medical_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_results    ENABLE ROW LEVEL SECURITY;
ALTER TABLE conditions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms           ENABLE ROW LEVEL SECURITY;


-- ── 2. medical_profiles ───────────────────────────────────────
-- Authenticated users can SELECT / INSERT / UPDATE / DELETE
-- only the row where userId matches their own auth.uid().

DROP POLICY IF EXISTS "Users manage own profile" ON medical_profiles;

CREATE POLICY "Users manage own profile"
ON medical_profiles
FOR ALL
TO authenticated
USING     (auth.uid()::text = "userId"::text)
WITH CHECK(auth.uid()::text = "userId"::text);


-- ── 3. symptom_sessions ───────────────────────────────────────
-- Authenticated users see and create only their own sessions.

DROP POLICY IF EXISTS "Users read own sessions"   ON symptom_sessions;
DROP POLICY IF EXISTS "Users insert own sessions" ON symptom_sessions;

CREATE POLICY "Users read own sessions"
ON symptom_sessions
FOR SELECT
TO authenticated
USING (auth.uid()::text = "userId"::text);

CREATE POLICY "Users insert own sessions"
ON symptom_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = "userId"::text);


-- ── 4. session_results ────────────────────────────────────────
-- Results are accessible only through the owning session.
-- A sub-select confirms the parent session belongs to the caller.

DROP POLICY IF EXISTS "Users read own results"   ON session_results;
DROP POLICY IF EXISTS "Users insert own results" ON session_results;

CREATE POLICY "Users read own results"
ON session_results
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM symptom_sessions s
    WHERE s.id = "sessionId"
      AND auth.uid()::text = s."userId"::text
  )
);

CREATE POLICY "Users insert own results"
ON session_results
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM symptom_sessions s
    WHERE s.id = "sessionId"
      AND auth.uid()::text = s."userId"::text
  )
);


-- ── 5. conditions — public read ───────────────────────────────
-- Educational content: readable by everyone (anon + authenticated).

DROP POLICY IF EXISTS "Public can read conditions" ON conditions;

CREATE POLICY "Public can read conditions"
ON conditions
FOR SELECT
TO anon, authenticated
USING (true);


-- ── 6. symptoms — public read ─────────────────────────────────
-- Symptom catalogue: readable by everyone (anon + authenticated).

DROP POLICY IF EXISTS "Public can read symptoms" ON symptoms;

CREATE POLICY "Public can read symptoms"
ON symptoms
FOR SELECT
TO anon, authenticated
USING (true);


-- ============================================================
-- End of RLS policy script
-- ============================================================
