import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import * as z from "zod";
import { pendingSessionMap } from "@/lib/pending-sessions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Condition {
  slug: string;
  name: string;
  description: string;
  symptoms: string[];
  severityLevel: string;
  speciality: string;
  precautions: string[];
  medicineAwareness: string[];
  articleUrl: string;
}

interface Symptom {
  slug: string;
  displayName: string;
  severityWeight: number;
  bodyArea: string;
  commonAliases: string[];
}

interface FormattedResult {
  condition: Condition;
  matchScore: number;
  severityLevel: string;
  rank: number;
}

// ─── Session store (shared via lib/pending-sessions) ────────────────────────

// ─── Module-level data (loaded once, reused across requests) ──────────────────

const conditions: Condition[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "public", "data", "conditions.json"), "utf-8")
);

const symptoms: Symptom[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "public", "data", "symptoms.json"), "utf-8")
);

// slug → severityWeight lookup
const symptomWeightMap = new Map<string, number>(
  symptoms.map((s) => [s.slug, s.severityWeight])
);

// ─── Rate limiting ────────────────────────────────────────────────────────────

type RateEntry = { count: number; resetAt: number };
const rateLimitMap = new Map<string, RateEntry>();

const RATE_LIMIT     = 10;         // max requests
const RATE_WINDOW_MS = 60_000;     // per 60 seconds

function checkRateLimit(ip: string): boolean {
  const now  = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true; // allowed
  }

  if (entry.count >= RATE_LIMIT) return false; // blocked

  entry.count++;
  return true; // allowed
}

// ─── Input validation ─────────────────────────────────────────────────────────

const schema = z.object({
  symptoms: z.array(z.string().max(50)).min(1).max(8),
  ageGroup: z.enum(["child", "adult", "senior"]),
  gender:   z.enum(["male", "female", "other", "prefer_not_to_say"]),
  duration: z.enum(["less_than_24hrs", "one_to_three_days", "one_week_plus"]),
});

// ─── Scoring helpers ──────────────────────────────────────────────────────────

function weightSum(slugs: string[]): number {
  return slugs.reduce((sum, s) => sum + (symptomWeightMap.get(s) ?? 1), 0);
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit ──────────────────────────────────────────────────────────
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    // ── Validate input ──────────────────────────────────────────────────────
    const body   = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { symptoms: inputSymptoms, ageGroup, gender, duration } = parsed.data;

    // ── Score each condition ────────────────────────────────────────────────
    type ScoredCondition = {
      condition: Condition;
      normalizedScore: number;
      matchedCount: number;
    };

    const scored: ScoredCondition[] = [];

    for (const condition of conditions) {
      const matchedSlugs = inputSymptoms.filter((s) =>
        condition.symptoms.includes(s)
      );

      if (matchedSlugs.length === 0) continue;

      const matchedScore    = weightSum(matchedSlugs);
      const maxScore        = weightSum(condition.symptoms);
      const normalizedScore = maxScore > 0 ? matchedScore / maxScore : 0;

      scored.push({ condition, normalizedScore, matchedCount: matchedSlugs.length });
    }

    // Sort descending by score
    scored.sort((a, b) => b.normalizedScore - a.normalizedScore);

    // Take top 4
    const top4 = scored.slice(0, 4);

    // ── Low-confidence guard ────────────────────────────────────────────────
    const sessionToken = crypto.randomUUID();

    if (top4.length === 0 || top4[0].normalizedScore < 0.15) {
      // Store empty session so the save endpoint still has a valid token
      pendingSessionMap.set(sessionToken, {
        symptoms: inputSymptoms,
        ageGroup,
        gender,
        duration,
        results: [],
        createdAt: Date.now(),
      });
      setTimeout(() => pendingSessionMap.delete(sessionToken), 60 * 60 * 1000);

      return NextResponse.json({ results: [], sessionToken });
    }

    // ── Format results ──────────────────────────────────────────────────────
    const formattedResults: FormattedResult[] = top4.map((item, idx) => ({
      condition:    item.condition,
      matchScore:   parseFloat(item.normalizedScore.toFixed(4)),
      severityLevel: item.condition.severityLevel,
      rank:          idx + 1,
    }));

    // ── Persist pending session (consumed by /api/sessions/save) ───────────
    pendingSessionMap.set(sessionToken, {
      symptoms: inputSymptoms,
      ageGroup,
      gender,
      duration,
      results: formattedResults,
      createdAt: Date.now(),
    });
    // Auto-expire after 1 hour
    setTimeout(() => pendingSessionMap.delete(sessionToken), 60 * 60 * 1000);

    // ── Respond ─────────────────────────────────────────────────────────────
    return NextResponse.json({ results: formattedResults, sessionToken });
  } catch (err) {
    console.error("[symptoms/analyse] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
