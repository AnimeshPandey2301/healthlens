"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ShoppingCart, Pill, Stethoscope, Grid3X3, AlertTriangle, Tag, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Medicine } from "@/data/medicines";
import { CATEGORIES } from "@/data/medicines";
import { useCartStore } from "@/lib/stores/cartStore";

const MedicineCard = dynamic(() => import("@/components/MedicineCard"), { ssr: false });
const CartDrawer = dynamic(() => import("@/components/CartDrawer"), { ssr: false });

type Tab = "catalog" | "suggestions" | "categories";

const CATEGORY_ICONS: Record<string, string> = {
  "Fever": "🌡️",
  "Cold & Cough": "🤧",
  "Pain Relief": "💊",
  "Diabetes": "🩸",
  "Heart Care": "❤️",
};

const COMMON_DISEASES = [
  "fever", "cold", "cough", "headache", "bodyache",
  "joint pain", "diabetes", "hypertension", "allergy", "toothache",
];

export default function MedicinesPage() {
  const [tab, setTab] = useState<Tab>("catalog");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cartOpen, setCartOpen] = useState(false);

  // Suggestions state
  const [disease, setDisease] = useState("");
  const [suggestions, setSuggestions] = useState<Medicine[]>([]);
  const [disclaimer, setDisclaimer] = useState("");
  const [sugLoading, setSugLoading] = useState(false);
  const [sugError, setSugError] = useState("");

  const { totalItems } = useCartStore();

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory !== "All") params.set("category", activeCategory);
    if (search) params.set("search", search);
    const res = await fetch(`/api/medicines?${params}`);
    const data = await res.json();
    setMedicines(data.medicines ?? []);
    setLoading(false);
  }, [activeCategory, search]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const handleSuggest = async (q: string) => {
    const d = q.trim().toLowerCase();
    if (!d) return;
    setSugLoading(true);
    setSugError("");
    setSuggestions([]);
    setDisclaimer("");
    const res = await fetch(`/api/suggestions?disease=${encodeURIComponent(d)}`);
    const data = await res.json();
    if (data.medicines?.length) {
      setSuggestions(data.medicines);
      setDisclaimer(data.disclaimer);
    } else {
      setSugError(`No suggestions found for "${d}". Try: fever, cold, diabetes, headache…`);
    }
    setSugLoading(false);
  };

  const cartCount = totalItems();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Pill size={24} /> Medical Services
              </h1>
              <p className="text-teal-100 text-sm mt-1">
                Order medicines, get suggestions, explore categories — all inside HealthLens
              </p>
            </div>
            {/* Cart button */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <ShoppingCart size={18} />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            {([
              { key: "catalog", label: "Medicines", icon: Pill },
              { key: "suggestions", label: "Suggestions", icon: Stethoscope },
              { key: "categories", label: "Categories", icon: Grid3X3 },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tab === key
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-teal-100 hover:bg-white/10"
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── TAB: CATALOG ─────────────────────────────────────────── */}
        {tab === "catalog" && (
          <div>
            {/* Disclaimer banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3 mb-6">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                <strong>Disclaimer:</strong> Always consult a doctor before purchasing prescription medicines.
                This platform is for informational and convenience purposes only.
              </p>
            </div>

            {/* Search + Filter row */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search medicines, generics…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-teal-400 bg-white"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              {["All", ...CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    activeCategory === cat
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-700"
                  }`}
                >
                  {CATEGORY_ICONS[cat] && <span>{CATEGORY_ICONS[cat]}</span>}
                  {cat}
                </button>
              ))}
            </div>

            {/* Results count */}
            <p className="text-sm text-gray-500 mb-4">
              {loading ? "Loading…" : `${medicines.length} medicine${medicines.length !== 1 ? "s" : ""} found`}
            </p>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-64 animate-pulse">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl mb-3" />
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                    <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                    <div className="h-3 bg-gray-100 rounded w-5/6" />
                  </div>
                ))}
              </div>
            ) : medicines.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <span className="text-5xl mb-4">💊</span>
                <p className="text-gray-500 font-medium">No medicines found</p>
                <p className="text-gray-400 text-sm mt-1">Try a different search or category</p>
                <button onClick={() => { setSearch(""); setActiveCategory("All"); }} className="mt-4 text-teal-600 text-sm hover:underline">
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {medicines.map((m) => (
                  <MedicineCard key={m.id} medicine={m} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: SUGGESTIONS ─────────────────────────────────────── */}
        {tab === "suggestions" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-bold text-[#1E3A5F] mb-1">Medicine Suggestions</h2>
              <p className="text-sm text-gray-500 mb-5">
                Enter a disease or symptom to see commonly used medicines. Always consult a doctor.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. fever, cold, headache, diabetes…"
                  value={disease}
                  onChange={(e) => setDisease(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSuggest(disease)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-teal-400"
                />
                <button
                  onClick={() => handleSuggest(disease)}
                  disabled={sugLoading}
                  className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  {sugLoading ? "…" : "Search"}
                </button>
              </div>

              {/* Quick chips */}
              <div className="flex flex-wrap gap-2 mt-4">
                {COMMON_DISEASES.map((d) => (
                  <button
                    key={d}
                    onClick={() => { setDisease(d); handleSuggest(d); }}
                    className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-100 px-3 py-1 rounded-full transition-colors capitalize"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            {disclaimer && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 mb-4">
                <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">{disclaimer}</p>
              </div>
            )}

            {/* Error */}
            {sugError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">
                {sugError}
              </div>
            )}

            {/* Results */}
            {suggestions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3">
                  Commonly used for <span className="text-teal-600 capitalize">{disease}</span> ({suggestions.length} medicines)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {suggestions.map((m) => (
                    <MedicineCard key={m.id} medicine={m} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: CATEGORIES ──────────────────────────────────────── */}
        {tab === "categories" && (
          <div>
            <h2 className="text-lg font-bold text-[#1E3A5F] mb-6">Browse by Category</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
              {CATEGORIES.map((cat) => {
                const count = medicines.length > 0
                  ? undefined
                  : undefined;
                return (
                  <button
                    key={cat}
                    onClick={() => { setActiveCategory(cat); setTab("catalog"); }}
                    className="bg-white rounded-2xl border border-gray-100 p-6 text-left hover:shadow-md hover:border-teal-200 transition-all group"
                  >
                    <div className="text-4xl mb-3">{CATEGORY_ICONS[cat]}</div>
                    <h3 className="font-semibold text-[#1E3A5F] text-base">{cat}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {cat === "Fever" && "Paracetamol, Ibuprofen, Combiflam…"}
                      {cat === "Cold & Cough" && "Cetirizine, Benadryl, Sinarest…"}
                      {cat === "Pain Relief" && "Diclofenac, Volini, Moov…"}
                      {cat === "Diabetes" && "Metformin, Glimepiride, Januvia…"}
                      {cat === "Heart Care" && "Atorvastatin, Aspirin, Amlodipine…"}
                    </p>
                    <div className="flex items-center gap-1 text-teal-600 text-sm font-medium mt-4 group-hover:gap-2 transition-all">
                      Browse <ChevronRight size={14} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Recommended section */}
            <div className="mb-4 flex items-center gap-2">
              <Tag size={16} className="text-teal-600" />
              <h2 className="text-lg font-bold text-[#1E3A5F]">Most Popular</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {["med-001","med-007","med-013","med-026"].map((id) => {
                const m = medicines.find((x) => x.id === id);
                return m ? <MedicineCard key={id} medicine={m} /> : null;
              })}
            </div>
          </div>
        )}
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
