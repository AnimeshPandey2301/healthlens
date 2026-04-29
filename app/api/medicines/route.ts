import { NextRequest, NextResponse } from "next/server";
import { MEDICINES } from "@/data/medicines";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category")?.trim();
  const search = searchParams.get("search")?.toLowerCase().trim();

  let results = [...MEDICINES];

  if (category && category !== "All") {
    results = results.filter((m) => m.category === category);
  }

  if (search) {
    results = results.filter(
      (m) =>
        m.name.toLowerCase().includes(search) ||
        m.genericName.toLowerCase().includes(search) ||
        m.description.toLowerCase().includes(search)
    );
  }

  return NextResponse.json({ medicines: results, total: results.length });
}
