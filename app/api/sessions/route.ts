import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerClient } from "@/lib/supabase/server";

// ─── GET — list sessions ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    // ── Query params ──────────────────────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const limit  = Math.min(parseInt(searchParams.get("limit")  ?? "10", 10), 50);
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0",  10), 0);

    // ── Fetch sessions and total in parallel ──────────────────────────────────
    const where = { userId: user.id };

    const [sessions, total] = await Promise.all([
      prisma.symptomSession.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take:    limit,
        skip:    offset,
        include: { results: { orderBy: { rank: "asc" } } },
      }),
      prisma.symptomSession.count({ where }),
    ]);

    return NextResponse.json({ sessions, total });
  } catch (err) {
    console.error("[sessions GET] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
