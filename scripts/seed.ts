/**
 * HealthLens — Database Seed Script  (Parts A–F)
 *
 * Reads 4 Kaggle CSV files and:
 *   A. Parses CSV data
 *   B. Builds symptom objects
 *   C. Builds condition objects (hyphen slugs, red/yellow/green severity, speciality)
 *   D. Upserts symptoms + conditions via Prisma
 *   E. Exports public/data/symptoms.json + public/data/conditions.json
 *   F. Prints final summary
 *
 * Run with:  npm run seed
 */

import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Path helpers ───────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), "data", "kaggle");

function csvPath(filename: string) {
  return path.join(DATA_DIR, filename);
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Normalise a raw symptom string to a DB slug (underscores):
 *  " skin_rash " → "skin_rash"
 */
function toSymptomSlug(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "_");
}

/**
 * Normalise a disease name to a condition slug (hyphens):
 *  "Common Cold" → "common-cold"
 *  "Fungal infection" → "fungal-infection"
 */
function toConditionSlug(disease: string): string {
  return disease.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Convert underscore slug → title-case display name:
 *  "skin_rash" → "Skin Rash"
 */
function toDisplayName(slug: string): string {
  return slug
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Classify a symptom slug into a body area.
 */
function classifyBodyArea(slug: string): string {
  const s = slug.toLowerCase();
  if (/head|eye|ear|nose|throat|vision|hearing/.test(s)) return "head";
  if (/chest|breath|heart|lung|cough/.test(s)) return "chest";
  if (/stomach|abdomen|nausea|vomit|diarrhea|bowel/.test(s)) return "stomach";
  if (/skin|rash|itch|blister|swell/.test(s)) return "skin";
  return "general";
}

/**
 * Assign medical speciality from disease name keywords.
 */
function classifySpeciality(disease: string): string {
  const d = disease.toLowerCase();
  if (/heart|cardiac|hypertension/.test(d)) return "cardiologist";
  if (/skin|fungal|acne|psoriasis/.test(d)) return "dermatologist";
  if (/brain|migraine|paralysis|epilepsy/.test(d)) return "neurologist";
  if (/diabetes|thyroid|jaundice/.test(d)) return "endocrinologist";
  if (/dengue|malaria|typhoid|flu|cold/.test(d)) return "general";
  return "general";
}

// ─── CSV Parsers ──────────────────────────────────────────────────────────────

type SeverityRow = { Symptom: string; weight: string };
type DatasetRow = Record<string, string>;
type DescriptionRow = { Disease: string; Description: string };
type PrecautionRow = {
  Disease: string;
  Precaution_1: string;
  Precaution_2: string;
  Precaution_3: string;
  Precaution_4: string;
};

function parseCsv<T>(filename: string): T[] {
  const content = fs.readFileSync(csvPath(filename), "utf-8");
  return parse(content, {
    columns: true,       // first row = headers
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as T[];
}

// ─── Build data maps ─────────────────────────────────────────────────────────

/**
 * Map<symptomSlug, severityWeight>
 * The Symptom-severity.csv already uses underscored slugs.
 */
function buildSeverityMap(rows: SeverityRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const slug = toSymptomSlug(row.Symptom);
    const weight = parseInt(row.weight, 10);
    map.set(slug, isNaN(weight) ? 1 : weight);
  }
  return map;
}

/**
 * Map<diseaseNormalised, string[]> of symptom slugs per disease.
 * dataset.csv has Symptom_1 … Symptom_17 columns.
 */
function buildDiseaseSymptomMap(rows: DatasetRow[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const disease = row["Disease"]?.trim();
    if (!disease) continue;

    const symptoms: string[] = [];
    for (let i = 1; i <= 17; i++) {
      const raw = row[`Symptom_${i}`];
      if (!raw || raw.trim() === "") continue;
      const slug = toSymptomSlug(raw);
      if (slug && !symptoms.includes(slug)) {
        symptoms.push(slug);
      }
    }

    // Merge rows for the same disease (multiple CSV rows per disease)
    const existing = map.get(disease) ?? [];
    for (const s of symptoms) {
      if (!existing.includes(s)) existing.push(s);
    }
    map.set(disease, existing);
  }
  return map;
}

/**
 * Map<disease, description>
 */
function buildDescriptionMap(rows: DescriptionRow[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.Disease) map.set(row.Disease.trim(), row.Description?.trim() ?? "");
  }
  return map;
}

/**
 * Map<disease, precaution[]>
 */
function buildPrecautionMap(rows: PrecautionRow[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.Disease) continue;
    const precautions = [
      row.Precaution_1,
      row.Precaution_2,
      row.Precaution_3,
      row.Precaution_4,
    ]
      .map((p) => p?.trim() ?? "")
      .filter(Boolean);
    map.set(row.Disease.trim(), precautions);
  }
  return map;
}

// ─── Derive severity label (traffic-light scale) ─────────────────────────────

/**
 * Uses the MAX weight across all symptoms:
 *   any symptom weight >= 5  →  "red"    (severe)
 *   any symptom weight >= 3  →  "yellow" (moderate)
 *   otherwise                →  "green"  (mild)
 */
function deriveSeverityLevel(
  symptomSlugs: string[],
  severityMap: Map<string, number>
): string {
  if (symptomSlugs.length === 0) return "green";
  const maxWeight = Math.max(
    ...symptomSlugs.map((s) => severityMap.get(s) ?? 1)
  );
  if (maxWeight >= 5) return "red";
  if (maxWeight >= 3) return "yellow";
  return "green";
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  HealthLens seed starting…\n");

  // ── 1. Parse all CSVs ──────────────────────────────────────────────────────
  console.log("📂  Reading CSV files…");
  const severityRows = parseCsv<SeverityRow>("Symptom-severity.csv");
  const datasetRows  = parseCsv<DatasetRow>("dataset.csv");
  const descRows     = parseCsv<DescriptionRow>("symptom_Description.csv");
  const precRows     = parseCsv<PrecautionRow>("symptom_precaution.csv");
  console.log(
    `    severity: ${severityRows.length} rows | ` +
    `dataset: ${datasetRows.length} rows | ` +
    `descriptions: ${descRows.length} rows | ` +
    `precautions: ${precRows.length} rows`
  );

  // ── 2. Build lookup maps ──────────────────────────────────────────────────
  const severityMap    = buildSeverityMap(severityRows);
  const diseaseSymMap  = buildDiseaseSymptomMap(datasetRows);
  const descriptionMap = buildDescriptionMap(descRows);
  const precautionMap  = buildPrecautionMap(precRows);

  // ── 3. Collect all unique symptom slugs ──────────────────────────────────
  const allSymptomSlugs = new Set<string>();
  for (const slugs of diseaseSymMap.values()) {
    for (const s of slugs) allSymptomSlugs.add(s);
  }
  console.log(`\n💊  Unique symptoms found: ${allSymptomSlugs.size}`);

  // ── 4. Build Symptom objects ──────────────────────────────────────────────
  const symptomObjects = Array.from(allSymptomSlugs).map((slug) => ({
    slug,
    displayName:    toDisplayName(slug),
    severityWeight: severityMap.get(slug) ?? 1,
    bodyArea:       classifyBodyArea(slug),
    commonAliases:  [] as string[],
  }));

  // ── 5. Build Condition objects (Part C) ──────────────────────────────────
  const conditionObjects = Array.from(diseaseSymMap.entries()).map(
    ([disease, symptomSlugs]) => {
      const slug         = toConditionSlug(disease);          // hyphens
      const description  = descriptionMap.get(disease) ?? `Information about ${disease}.`;
      const precautions  = precautionMap.get(disease) ?? [];
      const severityLevel = deriveSeverityLevel(symptomSlugs, severityMap); // red/yellow/green
      const speciality   = classifySpeciality(disease);

      return {
        slug,
        name:              disease,
        description,
        symptoms:          symptomSlugs,
        severityLevel,
        speciality,
        precautions,
        medicineAwareness: [] as string[],
        articleUrl:        "",             // empty — filled manually later
      };
    }
  );

  console.log(`🏥  Unique conditions found: ${conditionObjects.length}`);

  // ── 6. Seed Symptoms (Part D) ─────────────────────────────────────────────
  console.log("\nUpserting symptoms…");
  let symInserted = 0;
  let symSkipped  = 0;

  for (const sym of symptomObjects) {
    try {
      await prisma.symptom.upsert({
        where: { slug: sym.slug },
        create: sym,
        update: {
          displayName:    sym.displayName,
          severityWeight: sym.severityWeight,
          bodyArea:       sym.bodyArea,
        },
      });
      symInserted++;
    } catch (err) {
      console.warn(`    ⚠ skipped symptom "${sym.slug}":`, (err as Error).message);
      symSkipped++;
    }
  }
  console.log(`    ✔ ${symInserted} upserted, ${symSkipped} skipped`);

  // ── 7. Seed Conditions (Part D) ───────────────────────────────────────────
  console.log("\nUpserting conditions…");
  let conInserted = 0;
  let conSkipped  = 0;

  for (const cond of conditionObjects) {
    try {
      await prisma.condition.upsert({
        where: { slug: cond.slug },
        create: cond,
        update: {
          description:   cond.description,
          symptoms:      cond.symptoms,
          severityLevel: cond.severityLevel,
          speciality:    cond.speciality,
          precautions:   cond.precautions,
          articleUrl:    cond.articleUrl,
        },
      });
      conInserted++;
    } catch (err) {
      console.warn(`    ⚠ skipped condition "${cond.slug}":`, (err as Error).message);
      conSkipped++;
    }
  }
  console.log(`    ✔ ${conInserted} upserted, ${conSkipped} skipped`);

  // ── 8. Export JSON files (Part E) ────────────────────────────────────────
  const publicDataDir = path.join(process.cwd(), "public", "data");
  fs.mkdirSync(publicDataDir, { recursive: true });

  fs.writeFileSync(
    path.join(publicDataDir, "symptoms.json"),
    JSON.stringify(symptomObjects, null, 2),
    "utf-8"
  );
  fs.writeFileSync(
    path.join(publicDataDir, "conditions.json"),
    JSON.stringify(conditionObjects, null, 2),
    "utf-8"
  );
  console.log("\nExported JSON files to public/data/");

  // ── 9. Final summary (Part F) ─────────────────────────────────────────────
  const [totalSym, totalCond] = await Promise.all([
    prisma.symptom.count(),
    prisma.condition.count(),
  ]);

  console.log(`\nSeed complete: ${totalCond} conditions, ${totalSym} symptoms`);
}

main()
  .catch((err) => {
    console.error("❌  Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
