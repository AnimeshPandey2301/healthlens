import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Fuse from "fuse.js";
import * as z from "zod";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Symptom {
  slug: string;
  displayName: string;
  severityWeight: number;
  bodyArea: string;
  commonAliases: string[];
}

// ─── Module-level setup (built once, reused across requests) ──────────────────

const symptomsPath = path.join(process.cwd(), "public", "data", "symptoms.json");
const symptoms: Symptom[] = JSON.parse(fs.readFileSync(symptomsPath, "utf-8"));

const fuse = new Fuse(symptoms, {
  keys: ["displayName", "commonAliases", "slug"],
  threshold: 0.35,
  distance: 100,
  minMatchCharLength: 2,
  includeScore: true,
});

// Alphabetical fallback list (first 8) for short queries
const alphabetical = [...symptoms]
  .sort((a, b) => a.displayName.localeCompare(b.displayName))
  .slice(0, 8)
  .map(({ slug, displayName, bodyArea }) => ({ slug, displayName, bodyArea }));

// ─── Validation ───────────────────────────────────────────────────────────────

const bodySchema = z.object({
  query: z.string().min(1, "query is required").max(50, "query too long"),
  limit: z.number().int().min(1).max(20).optional(),
});

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { query, limit = 8 } = parsed.data;

    // Short query → return alphabetical defaults
    if (query.trim().length < 2) {
      return NextResponse.json({ results: alphabetical.slice(0, limit) });
    }

    // Fuse search
    const fuseResults = fuse.search(query.trim(), { limit });
    const results = fuseResults.map(({ item }) => ({
      slug: item.slug,
      displayName: item.displayName,
      bodyArea: item.bodyArea,
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[symptoms/search] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
