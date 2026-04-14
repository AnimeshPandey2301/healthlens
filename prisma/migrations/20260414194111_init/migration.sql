/*
  Warnings:

  - You are about to drop the `Condition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MedicalProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SessionResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Symptom` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SymptomSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SessionResult" DROP CONSTRAINT "SessionResult_sessionId_fkey";

-- DropTable
DROP TABLE "Condition";

-- DropTable
DROP TABLE "MedicalProfile";

-- DropTable
DROP TABLE "SessionResult";

-- DropTable
DROP TABLE "Symptom";

-- DropTable
DROP TABLE "SymptomSession";

-- CreateTable
CREATE TABLE "medical_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "fullName" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "bloodGroup" TEXT,
    "knownAllergies" TEXT[],
    "chronicConditions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptom_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID,
    "sessionToken" TEXT NOT NULL,
    "symptomsEntered" TEXT[],
    "ageGroup" TEXT NOT NULL,
    "genderFilter" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "topCondition" TEXT,
    "severityLevel" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "symptom_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL,
    "conditionName" TEXT NOT NULL,
    "conditionId" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "severityLevel" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conditions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "symptoms" TEXT[],
    "severityLevel" TEXT NOT NULL,
    "speciality" TEXT NOT NULL,
    "precautions" TEXT[],
    "medicineAwareness" TEXT[],
    "articleUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptoms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "severityWeight" INTEGER NOT NULL,
    "bodyArea" TEXT NOT NULL,
    "commonAliases" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "symptoms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "medical_profiles_userId_key" ON "medical_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "symptom_sessions_sessionToken_key" ON "symptom_sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "conditions_slug_key" ON "conditions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "symptoms_slug_key" ON "symptoms"("slug");

-- AddForeignKey
ALTER TABLE "session_results" ADD CONSTRAINT "session_results_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "symptom_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
