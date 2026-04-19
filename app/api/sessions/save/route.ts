import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
import prisma from "@/lib/prisma";
import { createServerClient } from "@/lib/supabase/server";
import { pendingSessionMap } from "@/lib/pending-sessions";

// ─── Validation ───────────────────────────────────────────────────────────────

const bodySchema = z.object({
  sessionToken: z.string().uuid("Invalid session token"),
});

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    // ── Validate body ─────────────────────────────────────────────────────────
    const body   = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { sessionToken } = parsed.data;

    // ── Look up pending session ────────────────────────────────────────────────
    const pending = pendingSessionMap.get(sessionToken);
    if (!pending) {
      return NextResponse.json(
        { error: "Session not found or expired" },
        { status: 404 }
      );
    }

    // ── Insert SymptomSession ─────────────────────────────────────────────────
    const newSession = await prisma.symptomSession.create({
      data: {
        userId:          user.id,
        sessionToken,
        symptomsEntered: pending.symptoms,
        ageGroup:        pending.ageGroup,
        genderFilter:    pending.gender,
        duration:        pending.duration,
        topCondition:    pending.results[0]?.condition.name ?? null,
        severityLevel:   pending.results[0]?.severityLevel ?? "green",
        resultCount:     pending.results.length,
      },
    });

    // ── Insert SessionResults ────────────────────────────────────────────────
    if (pending.results.length > 0) {
      await prisma.sessionResult.createMany({
        data: pending.results.map((r) => ({
          sessionId:     newSession.id,
          conditionName: r.condition.name,
          conditionId:   r.condition.slug,   // slug used as stable identifier
          matchScore:    r.matchScore,
          severityLevel: r.severityLevel,
          rank:          r.rank,
        })),
      });
    }

    // ── Clean up pending map ──────────────────────────────────────────────────
    pendingSessionMap.delete(sessionToken);

    return NextResponse.json({ sessionId: newSession.id, saved: true });
  } catch (err) {
    console.error("[sessions/save] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
