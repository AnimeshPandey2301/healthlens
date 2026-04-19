import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_BADGE: Record<string, { cls: string; label: string }> = {
  green:  { cls: "bg-green-100 text-green-700",  label: "Low"      },
  yellow: { cls: "bg-amber-100 text-amber-700",  label: "Moderate" },
  red:    { cls: "bg-red-100   text-red-700",    label: "High"     },
};

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day:    "2-digit",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDateOnly(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  }).format(date);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export const metadata = {
  title: "Dashboard — HealthLens",
  description: "View your health awareness session history and medical profile.",
};

export default async function DashboardPage() {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware protects this route, but guard defensively.
  if (!user) redirect("/auth/login");

  // ── 2. Data fetching ───────────────────────────────────────────────────────
  const [sessions, totalCount, profile] = await Promise.all([
    prisma.symptomSession.findMany({
      where:   { userId: user.id },
      orderBy: { createdAt: "desc" },
      take:    10,
      include: { results: true },
    }),
    prisma.symptomSession.count({ where: { userId: user.id } }),
    prisma.medicalProfile.findUnique({ where: { userId: user.id } }),
  ]);

  // ── 3. Sign-out server action ──────────────────────────────────────────────
  async function signOut() {
    "use server";
    const sb = await createServerClient();
    await sb.auth.signOut();
    redirect("/");
  }

  // ── 4. Derived display values ──────────────────────────────────────────────
  const displayName =
    profile?.fullName ?? user.email?.split("@")[0] ?? "User";

  const lastCheck =
    sessions[0]?.createdAt ? formatDateOnly(sessions[0].createdAt) : "Never";

  const profileStatus = profile?.fullName ? "Complete" : "Incomplete";

  // ── 5. Render ──────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[#1E3A5F]">
              Hello, {displayName}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Your health awareness history
            </p>
          </div>

          {/* Sign-out form — server action */}
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm font-medium text-gray-600 border border-gray-300
                         rounded-lg px-4 py-2 hover:bg-gray-50 hover:text-gray-900
                         transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>

        {/* ── STATS ROW ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {/* Card 1 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#1E3A5F]">{totalCount}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">
              Total Sessions
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#1E3A5F] truncate">
              {lastCheck}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">
              Last Check
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
            <p
              className={`text-2xl font-bold ${
                profileStatus === "Complete"
                  ? "text-teal-600"
                  : "text-amber-500"
              }`}
            >
              {profileStatus}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">
              Profile
            </p>
          </div>
        </div>

        {/* ── START NEW CHECK ─────────────────────────────────────────────── */}
        <a
          href="/checker"
          className="block bg-teal-600 hover:bg-teal-700 active:bg-teal-800
                     text-white rounded-xl px-6 py-3 font-medium w-full mt-6
                     text-center transition-colors shadow-sm"
        >
          + Start new symptom check
        </a>

        {/* ── RECENT SESSIONS ─────────────────────────────────────────────── */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
            Recent sessions
          </h2>

          {sessions.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-10 text-center border border-gray-100">
              <p className="text-gray-500 font-medium">No sessions yet.</p>
              <p className="text-sm text-teal-600 mt-1">
                Check your symptoms to get started →
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                // Derive overall severity from session or first result
                const sev =
                  session.severityLevel ?? session.results[0]?.severityLevel ?? "yellow";
                const badge = SEVERITY_BADGE[sev] ?? SEVERITY_BADGE.yellow;

                const visibleSymptoms = session.symptomsEntered.slice(0, 4);
                const extraCount = session.symptomsEntered.length - 4;

                return (
                  <div
                    key={session.id}
                    className="bg-white rounded-xl border border-gray-200 p-5
                               hover:shadow-sm transition-shadow"
                  >
                    {/* Row 1: date + severity badge */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-sm text-gray-700 font-medium">
                        {formatDateTime(session.createdAt)}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}
                      >
                        {badge.label} severity
                      </span>
                    </div>

                    {/* Row 2: symptom chips */}
                    {session.symptomsEntered.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {visibleSymptoms.map((sym) => (
                          <span
                            key={sym}
                            className="text-xs bg-gray-100 text-gray-600
                                       rounded-full px-2.5 py-0.5 font-medium"
                          >
                            {sym}
                          </span>
                        ))}
                        {extraCount > 0 && (
                          <span className="text-xs text-gray-400 self-center">
                            +{extraCount} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Row 3: top condition */}
                    {session.topCondition && (
                      <p className="text-sm text-gray-600 mt-2">
                        Top condition:{" "}
                        <span className="font-medium text-gray-800">
                          {session.topCondition}
                        </span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── PROFILE CARD ────────────────────────────────────────────────── */}
        <section className="mt-8 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1E3A5F] mb-4">
            Your medical profile
          </h2>

          {profile ? (
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-32 shrink-0">Full name</span>
                <span className="font-medium">{profile.fullName ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-32 shrink-0">Blood group</span>
                <span className="font-medium">{profile.bloodGroup ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-32 shrink-0">Allergies</span>
                <span className="font-medium">
                  {profile.knownAllergies.length > 0
                    ? `${profile.knownAllergies.length} listed`
                    : "None"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No profile set up yet.</p>
          )}

          <a
            href="/dashboard/profile"
            className="inline-block mt-4 text-sm text-teal-600
                       hover:text-teal-800 font-medium transition-colors"
          >
            Edit profile →
          </a>
        </section>

      </div>
    </main>
  );
}
