-- HealthLens — Run this in Supabase SQL Editor to create all required tables
-- Go to: https://supabase.com/dashboard/project/aqynnlcvkggqkkqgrbty/sql/new

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Medical Profiles
CREATE TABLE IF NOT EXISTS medical_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"            UUID UNIQUE NOT NULL,
  "fullName"          TEXT,
  age                 INTEGER,
  gender              TEXT,
  "bloodGroup"        TEXT,
  "knownAllergies"    TEXT[] DEFAULT '{}',
  "chronicConditions" TEXT[] DEFAULT '{}',
  "createdAt"         TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Symptom Sessions
CREATE TABLE IF NOT EXISTS symptom_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"          UUID,
  "sessionToken"    TEXT UNIQUE NOT NULL,
  "symptomsEntered" TEXT[] DEFAULT '{}',
  "ageGroup"        TEXT NOT NULL,
  "genderFilter"    TEXT NOT NULL,
  duration          TEXT NOT NULL,
  "topCondition"    TEXT,
  "severityLevel"   TEXT NOT NULL,
  "resultCount"     INTEGER NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Session Results
CREATE TABLE IF NOT EXISTS session_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId"     UUID NOT NULL REFERENCES symptom_sessions(id) ON DELETE CASCADE,
  "conditionName" TEXT NOT NULL,
  "conditionId"   TEXT NOT NULL,
  "matchScore"    FLOAT NOT NULL,
  "severityLevel" TEXT NOT NULL,
  rank            INTEGER NOT NULL,
  "createdAt"     TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Conditions
CREATE TABLE IF NOT EXISTS conditions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  description         TEXT NOT NULL,
  symptoms            TEXT[] DEFAULT '{}',
  "severityLevel"     TEXT NOT NULL,
  speciality          TEXT NOT NULL,
  precautions         TEXT[] DEFAULT '{}',
  "medicineAwareness" TEXT[] DEFAULT '{}',
  "articleUrl"        TEXT,
  "createdAt"         TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Symptoms
CREATE TABLE IF NOT EXISTS symptoms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL,
  "displayName"    TEXT NOT NULL,
  "severityWeight" INTEGER NOT NULL,
  "bodyArea"       TEXT NOT NULL,
  "commonAliases"  TEXT[] DEFAULT '{}',
  "createdAt"      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updatedAt for medical_profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON medical_profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON medical_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. OTP Records (Twilio SMS OTP)
CREATE TABLE IF NOT EXISTS otp_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "phoneNumber"   TEXT NOT NULL,
  "otpHash"       TEXT NOT NULL,
  attempts        INTEGER NOT NULL DEFAULT 0,
  verified        BOOLEAN NOT NULL DEFAULT FALSE,
  "expiresAt"     TIMESTAMPTZ NOT NULL,
  "createdAt"     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS otp_records_phone_idx ON otp_records ("phoneNumber");

-- 7. Medicine Orders
CREATE TABLE IF NOT EXISTS medicine_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "phoneNumber"     TEXT NOT NULL,
  "patientName"     TEXT NOT NULL,
  medicines         JSONB NOT NULL,
  "deliveryAddress" TEXT NOT NULL,
  notes             TEXT,
  status            TEXT NOT NULL DEFAULT 'confirmed',
  "otpVerified"     BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"       TIMESTAMPTZ DEFAULT NOW()
);

SELECT 'All tables created successfully! ✅' AS status;
