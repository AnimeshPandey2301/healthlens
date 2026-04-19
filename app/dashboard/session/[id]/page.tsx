import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_BADGE: Record<string, { cls: string; label: string }> = {
  green:  { cls: "bg-green-100  text-green-700",  label: "Low"      },
  yellow: { cls: "bg-amber-100  text-amber-700",  label: "Moderate" },
  red:    { cls: "bg-red-100    text-red-700",    label: "High"     },
};

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day:     "2-digit",
    month:   "long",
    year:    "numeric",
    hour:    "2-digit",
    minute:  "2-digit",
  }).format(date);
}

const RANK_LABEL: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };
function rankOrdinal(n: number): string {
  return RANK_LABEL[n] ?? `${n}th`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const metadata = {
  title: "Session Detail — HealthLens",
};

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // ── Resolve params (Next.js 16 async params) ─────────────────────────────
  const { id } = await params;

  // ── Fetch session ───────────────────────────────────────────────────────────
  const session = await prisma.symptomSession.findUnique({
    where:   { id },
    include: { results: { orderBy: { rank: "asc" } } },
  });

  // Guard: not found or not owned by this user
  if (!session || session.userId !== user.id) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ── Back link ─────────────────────────────────────────────────────── */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-teal-600
                     hover:text-teal-800 transition-colors mb-6"
        >
          ← Back to dashboard
        </Link>

        {/* ── Heading ───────────────────────────────────────────────────────── */}
        <h1 className="text-2xl font-bold text-[#1E3A5F] mb-1">
          Session details
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          {formatDateTime(session.createdAt)}
        </p>

        {/* ── Symptoms ──────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Symptoms reported
          </h2>
          {session.symptomsEntered.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {session.symptomsEntered.map((sym) => (
                <span
                  key={sym}
                  className="bg-teal-50 text-teal-700 border border-teal-200
                             rounded-full px-3 py-1 text-sm font-medium"
                >
                  {sym}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No symptoms recorded.</p>
          )}
        </section>

        {/* ── Filters ───────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Filters used
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Age group", value: session.ageGroup },
              { label: "Gender",    value: session.genderFilter },
              { label: "Duration",  value: session.duration },
            ].map(({ label, value }) => (
              <span
                key={label}
                className="bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-sm"
              >
                <span className="text-gray-400 text-xs mr-1">{label}:</span>
                {value}
              </span>
            ))}
          </div>
        </section>

        {/* ── Results ───────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
            Matched conditions
          </h2>

          {session.results.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-100">
              <p className="text-gray-500">No results were matched for this session.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {session.results.map((result) => {
                const badge = SEVERITY_BADGE[result.severityLevel] ?? SEVERITY_BADGE.yellow;
                const pct   = Math.round(result.matchScore * 100);

                return (
                  <div
                    key={result.id}
                    className="bg-white rounded-xl border border-gray-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">

                      {/* Left: condition name + rank */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full
                                     bg-[#1E3A5F] text-white text-xs font-bold shrink-0"
                          aria-label={`Rank ${result.rank}`}
                        >
                          #{result.rank}
                        </span>
                        <p className="font-semibold text-gray-900 text-base">
                          {result.conditionName}
                        </p>
                      </div>

                      {/* Right: severity badge */}
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${badge.cls}`}>
                        {badge.label} severity
                      </span>
                    </div>

                    {/* Match score + rank label */}
                    <div className="mt-3 flex items-center gap-3">
                      {/* Progress bar */}
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums shrink-0">
                        {pct}% match · {rankOrdinal(result.rank)} result
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Note ──────────────────────────────────────────────────────────── */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          View full details by{" "}
          <Link href="/check" className="font-semibold underline underline-offset-2 hover:text-amber-900">
            running a new symptom check
          </Link>
          . These results are for reference only and are not a medical diagnosis.
        </div>

      </div>
    </main>
  );
}
