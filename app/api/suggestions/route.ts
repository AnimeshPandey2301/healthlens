import { NextRequest, NextResponse } from "next/server";
import { MEDICINES } from "@/data/medicines";
import { DISEASE_SUGGESTIONS, DISCLAIMER } from "@/data/suggestions";

export async function GET(req: NextRequest) {
  const disease = req.nextUrl.searchParams.get("disease")?.toLowerCase().trim() ?? "";

  if (!disease) {
    return NextResponse.json({ error: "disease param required" }, { status: 400 });
  }

  // Find best matching key (exact or partial)
  const key = Object.keys(DISEASE_SUGGESTIONS).find(
    (k) => k === disease || k.includes(disease) || disease.includes(k)
  );

  const names = key ? DISEASE_SUGGESTIONS[key] : [];
  const medicines = MEDICINES.filter((m) => names.includes(m.name));

  return NextResponse.json({ disease, medicines, disclaimer: DISCLAIMER });
}
