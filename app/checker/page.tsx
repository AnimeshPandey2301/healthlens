"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSymptomStore } from "@/lib/stores/symptomStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  slug: string;
  displayName: string;
  bodyArea: string;
}

// ─── Body-area badge colour map ───────────────────────────────────────────────

const AREA_COLOURS: Record<string, string> = {
  head:    "bg-purple-100 text-purple-700",
  chest:   "bg-blue-100 text-blue-700",
  stomach: "bg-amber-100 text-amber-700",
  skin:    "bg-rose-100 text-rose-700",
  general: "bg-gray-100 text-gray-600",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckerPage() {
  const router = useRouter();

  const {
    selectedSymptoms,
    filters,
    isLoading,
    error,
    addSymptom,
    removeSymptom,
    setFilter,
    setLoading,
    setResults,
    setError,
    reset,
  } = useSymptomStore();

  // Search state
  const [query, setQuery]             = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown]   = useState(false);
  const [isSearching, setIsSearching]     = useState(false);
  const [maxReached, setMaxReached]       = useState(false);

  const inputRef    = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset store on mount so stale results don't carry over
  useEffect(() => {
    reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced search
  const runSearch = useCallback(async (q: string) => {
    setIsSearching(true);
    try {
      const res = await fetch("/api/symptoms/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q || " ", limit: 8 }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setSearchResults(data.results ?? []);
      setShowDropdown(true);
    } catch {
      // silently ignore network errors in search
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 300);
  };

  // Show default suggestions when input is focused empty
  const handleFocus = () => {
    if (!query && searchResults.length === 0) runSearch("");
    else setShowDropdown(true);
  };

  const handleSelectSymptom = (result: SearchResult) => {
    if (selectedSymptoms.length >= 8) {
      setMaxReached(true);
      setTimeout(() => setMaxReached(false), 2000);
      return;
    }
    addSymptom(result.slug);
    setQuery("");
    setShowDropdown(false);
    setSearchResults([]);
    inputRef.current?.focus();
  };

  // Analyse
  const handleAnalyse = async () => {
    if (selectedSymptoms.length === 0 || isLoading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/symptoms/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: selectedSymptoms, ...filters }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Analysis failed. Please try again.");
        return;
      }
      setResults(data.results, data.sessionToken);
      router.push("/results");
    } catch {
      setError("Network error. Please check your connection and try again.");
    }
  };

  const isDisabled = selectedSymptoms.length === 0 || isLoading;

  // Filter display names (not already selected in dropdown)
  const filteredResults = searchResults.filter(
    (r) => !selectedSymptoms.includes(r.slug)
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* ── SECTION 1: Heading ─────────────────────────────────────── */}
        <div className="text-center space-y-2 pt-4">
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: "#1E3A5F" }}
          >
            Check Your Symptoms
          </h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">
            Add your symptoms below to get health awareness information.{" "}
            <span className="font-medium text-gray-600">
              This is not a diagnosis.
            </span>
          </p>
        </div>

        {/* ── SECTION 2: Search ──────────────────────────────────────── */}
        <div className="relative">
          <div className="relative">
            {/* Search icon */}
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />

            {/* Loading spinner inside input */}
            {isSearching && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-500 animate-spin" />
            )}

            <Input
              ref={inputRef}
              value={query}
              onChange={handleInputChange}
              onFocus={handleFocus}
              placeholder="Type a symptom e.g. fever, headache..."
              className="pl-10 pr-10 py-3 h-12 text-base border-gray-200 focus-visible:ring-teal-500 rounded-xl shadow-sm"
              aria-label="Search symptoms"
              aria-autocomplete="list"
              aria-expanded={showDropdown}
            />
          </div>

          {/* Max reached tooltip */}
          {maxReached && (
            <p className="absolute -bottom-6 left-0 text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Maximum 8 symptoms reached
            </p>
          )}

          {/* Dropdown */}
          {showDropdown && filteredResults.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-50 mt-1.5 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
              role="listbox"
            >
              {filteredResults.map((result) => (
                <button
                  key={result.slug}
                  role="option"
                  aria-selected={false}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent blur before click
                    handleSelectSymptom(result);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-teal-50 transition-colors group"
                >
                  <span className="text-sm text-gray-800 group-hover:text-teal-700">
                    {result.displayName}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      AREA_COLOURS[result.bodyArea] ?? AREA_COLOURS.general
                    }`}
                  >
                    {result.bodyArea}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── SECTION 3: Chips ───────────────────────────────────────── */}
        <div className="space-y-3 pt-2">
          {selectedSymptoms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedSymptoms.map((slug) => (
                <span
                  key={slug}
                  className="chip inline-flex items-center gap-1.5 bg-teal-100 text-teal-800
                             rounded-full px-3 py-1.5 text-sm font-medium
                             animate-in fade-in slide-in-from-bottom-1 duration-200"
                >
                  {/* Pretty-print slug: skin_rash → Skin Rash */}
                  {slug
                    .split("_")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
                  <button
                    onClick={() => removeSymptom(slug)}
                    aria-label={`Remove ${slug}`}
                    className="rounded-full hover:bg-teal-200 p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400">
            {selectedSymptoms.length} of 8 symptoms added
          </p>
        </div>

        {/* ── SECTION 4: Filters ─────────────────────────────────────── */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Tell us more</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Age Group */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium">
                Age Group
              </label>
              <Select
                value={filters.ageGroup}
                onValueChange={(v) =>
                  setFilter("ageGroup", v as typeof filters.ageGroup)
                }
              >
                <SelectTrigger className="w-full border-gray-200 focus:ring-teal-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="child">Child (0–12)</SelectItem>
                  <SelectItem value="adult">Adult (13–59)</SelectItem>
                  <SelectItem value="senior">Senior (60+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium">
                Duration
              </label>
              <Select
                value={filters.duration}
                onValueChange={(v) =>
                  setFilter("duration", v as typeof filters.duration)
                }
              >
                <SelectTrigger className="w-full border-gray-200 focus:ring-teal-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="less_than_24hrs">
                    Less than 24 hours
                  </SelectItem>
                  <SelectItem value="one_to_three_days">1–3 days</SelectItem>
                  <SelectItem value="one_week_plus">1 week or more</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gender */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500 font-medium">
                Gender
              </label>
              <Select
                value={filters.gender}
                onValueChange={(v) =>
                  setFilter("gender", v as typeof filters.gender)
                }
              >
                <SelectTrigger className="w-full border-gray-200 focus:ring-teal-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">
                    Prefer not to say
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ── SECTION 5: Analyse button + error ─────────────────────── */}
        <div className="space-y-3 pt-2">
          <button
            id="analyse-btn"
            onClick={handleAnalyse}
            disabled={isDisabled}
            className={`w-full flex items-center justify-center gap-2
                        bg-teal-600 hover:bg-teal-700 active:bg-teal-800
                        text-white text-base font-semibold
                        py-4 rounded-xl
                        transition-all duration-200 shadow-sm
                        focus-visible:outline-none focus-visible:ring-2
                        focus-visible:ring-teal-500 focus-visible:ring-offset-2
                        ${isDisabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-md"}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analysing…
              </>
            ) : (
              "Analyse Symptoms →"
            )}
          </button>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── SECTION 6: Disclaimer ───────────────────────────────── */}
          <p className="text-center text-xs text-gray-400 pb-4">
            For educational awareness only.{" "}
            <span className="font-medium text-gray-500">
              Always consult a licensed doctor.
            </span>
          </p>
        </div>

      </div>
    </main>
  );
}
