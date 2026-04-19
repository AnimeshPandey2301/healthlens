import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
import prisma from "@/lib/prisma";
import { createServerClient } from "@/lib/supabase/server";

// ─── Validation ───────────────────────────────────────────────────────────────

const GENDER_VALUES   = ["male", "female", "other", "prefer_not_to_say"] as const;
const BLOOD_GROUPS    = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const profileSchema = z.object({
  fullName:          z.string().max(100).optional(),
  age:               z.number().int().min(1).max(120).optional(),
  gender:            z.enum(GENDER_VALUES).optional(),
  bloodGroup:        z.enum(BLOOD_GROUPS).optional(),
  knownAllergies:    z.array(z.string().max(100)).optional(),
  chronicConditions: z.array(z.string().max(100)).optional(),
});

// ─── GET — fetch profile ─────────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const profile = await prisma.medicalProfile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[profile GET] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PUT — upsert profile ────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body   = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const profile = await prisma.medicalProfile.upsert({
      where:  { userId: user.id },
      create: {
        userId:            user.id,
        fullName:          data.fullName          ?? null,
        age:               data.age               ?? null,
        gender:            data.gender            ?? null,
        bloodGroup:        data.bloodGroup        ?? null,
        knownAllergies:    data.knownAllergies    ?? [],
        chronicConditions: data.chronicConditions ?? [],
      },
      update: {
        ...(data.fullName          !== undefined && { fullName:          data.fullName          }),
        ...(data.age               !== undefined && { age:               data.age               }),
        ...(data.gender            !== undefined && { gender:            data.gender            }),
        ...(data.bloodGroup        !== undefined && { bloodGroup:        data.bloodGroup        }),
        ...(data.knownAllergies    !== undefined && { knownAllergies:    data.knownAllergies    }),
        ...(data.chronicConditions !== undefined && { chronicConditions: data.chronicConditions }),
      },
    });

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[profile PUT] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
