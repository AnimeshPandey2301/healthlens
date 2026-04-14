-- CreateTable
CREATE TABLE "MedicalProfile" (
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

    CONSTRAINT "MedicalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SymptomSession" (
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

    CONSTRAINT "SymptomSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionResult" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL,
    "conditionName" TEXT NOT NULL,
    "conditionId" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "severityLevel" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Condition" (
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

    CONSTRAINT "Condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Symptom" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "severityWeight" INTEGER NOT NULL,
    "bodyArea" TEXT NOT NULL,
    "commonAliases" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Symptom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SymptomSession_sessionToken_key" ON "SymptomSession"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Condition_slug_key" ON "Condition"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Symptom_slug_key" ON "Symptom"("slug");

-- AddForeignKey
ALTER TABLE "SessionResult" ADD CONSTRAINT "SessionResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SymptomSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
