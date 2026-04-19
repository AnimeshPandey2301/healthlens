"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  MapPin,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { useSymptomStore, type AnalysisResult } from "@/lib/stores/symptomStore";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_BORDER: Record<string, string> = {
  green:  "border-l-green-500",
  yellow: "border-l-amber-500",
  red:    "border-l-red-500",
};

const SEVERITY_BADGE: Record<string, { cls: string; label: string; pulse: boolean }> = {
  green:  { cls: "bg-green-100 text-green-800",  label: "Monitor at home",               pulse: false },
  yellow: { cls: "bg-amber-100 text-amber-800",  label: "See doctor within 48 hrs",       pulse: false },
  red:    { cls: "bg-red-100   text-red-800",    label: "Seek immediate care — call 112", pulse: true  },
};

function matchLabel(score: number): string {
  if (score > 0.7) return "High match";
  if (score > 0.4) return "Medium match";
  return "Low match";
}

// ─── Condition Card ───────────────────────────────────────────────────────────

function ConditionCard({ item }: { item: AnalysisResult }) {
  const [expanded, setExpanded] = useState(false);
  const { condition, matchScore, severityLevel } = item;

  const border = SEVERITY_BORDER[severityLevel] ?? "border-l-gray-300";
  const badge  = SEVERITY_BADGE[severityLevel] ?? SEVERITY_BADGE.yellow;

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${border} overflow-hidden`}
    >
      <div className="p-6 space-y-3">
        {/* Top row: name + severity badge */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold text-gray-900 leading-snug">
            {condition.name}
          </h2>
          <span
            className={`inline-flex items-center text-xs font-medium px-3 py-1 rounded-full shrink-0 ${badge.cls} ${
              badge.pulse ? "animate-pulse" : ""
            }`}
          >
            {badge.label}
          </span>
        </div>

        {/* Confidence label */}
        <p className="text-sm text-gray-400">{matchLabel(matchScore)}</p>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-800 transition-colors"
          aria-expanded={expanded}
        >
          {expanded ? (
            <>Hide details <ChevronUp className="h-4 w-4" /></>
          ) : (
            <>Show details <ChevronDown className="h-4 w-4" /></>
          )}
        </button>

        {/* Expanded section */}
        {expanded && (
          <div className="pt-2 space-y-5 border-t border-gray-50 mt-2">

            {/* Description */}
            <p className="text-gray-600 text-sm leading-relaxed">
              {condition.description}
            </p>

            {/* Precautions */}
            {condition.precautions.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Precautions
                </p>
                <ul className="space-y-1.5">
                  {condition.precautions.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Medicine awareness */}
            {condition.medicineAwareness.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Commonly discussed medicines
                </p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {condition.medicineAwareness.map((med) => (
                    <span
                      key={med}
                      className="inline-block bg-teal-50 text-teal-700 border border-teal-200
                                 rounded-full px-3 py-0.5 text-xs font-medium"
                    >
                      {med}
                    </span>
                  ))}
                </div>
                <div className="flex items-start gap-2 bg-amber-50 rounded-lg p-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    Do not self-medicate. Consult your doctor before taking any medicine.
                  </p>
                </div>
              </div>
            )}

            {/* Article link */}
            {condition.articleUrl && (
              <a
                href={condition.articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-teal-600
                           hover:text-teal-800 hover:underline transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Read more about this condition
                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
              </a>
            )}

            {/* Find a Doctor */}
            <button
              onClick={() =>
                window.open(
                  "https://www.google.com/maps/search/hospitals+near+me",
                  "_blank"
                )
              }
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700
                         active:bg-teal-800 text-white rounded-lg px-4 py-2 text-sm
                         font-medium transition-colors"
            >
              <MapPin className="h-4 w-4" />
              Find hospitals near me
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const router = useRouter();
  const { results, sessionToken, reset } = useSymptomStore();

  const [user, setUser]         = useState<User | null>(null);
  const [saved, setSaved]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Redirect if no results in store
  useEffect(() => {
    if (results === null) {
      router.push("/checker");
    }
  }, [results, router]);

  // Check auth state once on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  // Don't render while redirecting
  if (results === null) return null;

  // ── Save session ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!sessionToken || saving || saved) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/sessions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error ?? "Could not save session.");
        return;
      }
      setSaved(true);
    } catch {
      setSaveError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── ELEMENT 1: Back button ───────────────────────────────── */}
        <button
          onClick={() => { reset(); router.push("/checker"); }}
          className="text-sm text-teal-600 hover:text-teal-800 transition-colors mb-2"
        >
          ← Check again
        </button>

        {/* ── ELEMENT 2: Disclaimer banner (no dismiss) ────────────── */}
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">
            <span className="font-semibold">HealthLens</span> is for educational
            awareness only. This is not a medical diagnosis. Always consult a
            licensed doctor before taking any action.
          </p>
        </div>

        {/* ── ELEMENT 3: Results heading ───────────────────────────── */}
        <h1
          className="text-xl font-semibold"
          style={{ color: "#1E3A5F" }}
        >
          Possible conditions ({results.length} found)
        </h1>

        {/* ── ELEMENT 4: Condition cards ───────────────────────────── */}
        {results.length > 0 ? (
          <div className="space-y-4">
            {results.map((item) => (
              <ConditionCard key={item.condition.slug} item={item} />
            ))}
          </div>
        ) : (
          /* ── ELEMENT 5: No results state ───────────────────────── */
          <div className="text-center py-16 space-y-3">
            <p className="text-lg text-gray-600">
              We could not precisely match your symptoms.
            </p>
            <p className="text-gray-500">Please consult a doctor.</p>
            <a
              href="tel:104"
              className="block text-2xl font-bold text-teal-600 hover:text-teal-800 mt-4"
            >
              Health Helpline: 104
            </a>
          </div>
        )}

        {/* ── ELEMENT 6: Save session ──────────────────────────────── */}
        <div className="pt-4 pb-8 space-y-2">
          {user ? (
            <>
              <button
                id="save-session-btn"
                onClick={handleSave}
                disabled={saved || saving}
                className={`w-full py-3 rounded-xl border-2 text-sm font-medium transition-all
                            ${
                              saved
                                ? "border-green-400 text-green-600 bg-green-50"
                                : "border-teal-600 text-teal-600 hover:bg-teal-50 active:bg-teal-100"
                            }
                            ${saving ? "opacity-60 cursor-not-allowed" : ""}
                            ${saved  ? "cursor-default" : ""}`}
              >
                {saved
                  ? "✓ Session saved to your dashboard"
                  : saving
                  ? "Saving…"
                  : "Save this session"}
              </button>
              {saveError && (
                <p className="text-xs text-red-500 text-center">{saveError}</p>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/auth/login")}
                className="w-full py-3 rounded-xl border-2 border-gray-300 text-sm
                           font-medium text-gray-500 hover:border-gray-400
                           hover:text-gray-700 transition-all"
              >
                Sign in to save your session history
              </button>
              <p className="text-xs text-gray-400 text-center">
                Your results won&apos;t be lost — sign in anytime
              </p>
            </>
          )}
        </div>

      </div>
    </main>
  );
}
