import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerClient } from "@/lib/supabase/server";

// ─── DELETE — permanently remove a user's data ───────────────────────────────

export async function DELETE() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    // Delete all Prisma-owned records in dependency order.
    // SessionResult rows are cascade-deleted via the SymptomSession relation.
    await prisma.$transaction([
      prisma.symptomSession.deleteMany({ where: { userId: user.id } }),
      prisma.medicalProfile.deleteMany({ where: { userId: user.id } }),
    ]);

    // Sign the user out on the server (clears the session cookie).
    await supabase.auth.signOut();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[account DELETE] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
