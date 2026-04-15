import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnalysisResult = {
  condition: {
    slug: string;
    name: string;
    description: string;
    severityLevel: string;
    speciality: string;
    precautions: string[];
    medicineAwareness: string[];
    articleUrl: string;
  };
  matchScore: number;
  severityLevel: string;
  rank: number;
};

export type Filters = {
  ageGroup: "child" | "adult" | "senior";
  gender: "male" | "female" | "other" | "prefer_not_to_say";
  duration: "less_than_24hrs" | "one_to_three_days" | "one_week_plus";
};

// ─── State & Actions shape ────────────────────────────────────────────────────

type SymptomState = {
  selectedSymptoms: string[];
  filters: Filters;
  isLoading: boolean;
  results: AnalysisResult[] | null;
  sessionToken: string | null;
  error: string | null;
};

type SymptomActions = {
  addSymptom: (slug: string) => void;
  removeSymptom: (slug: string) => void;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  setLoading: (val: boolean) => void;
  setResults: (results: AnalysisResult[], sessionToken: string) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultFilters: Filters = {
  ageGroup: "adult",
  gender: "prefer_not_to_say",
  duration: "less_than_24hrs",
};

const defaultState: SymptomState = {
  selectedSymptoms: [],
  filters: defaultFilters,
  isLoading: false,
  results: null,
  sessionToken: null,
  error: null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSymptomStore = create<SymptomState & SymptomActions>((set) => ({
  ...defaultState,

  addSymptom: (slug) =>
    set((state) => {
      if (
        state.selectedSymptoms.includes(slug) ||
        state.selectedSymptoms.length >= 8
      ) {
        return state; // no change
      }
      return { selectedSymptoms: [...state.selectedSymptoms, slug] };
    }),

  removeSymptom: (slug) =>
    set((state) => ({
      selectedSymptoms: state.selectedSymptoms.filter((s) => s !== slug),
    })),

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  setLoading: (val) => set({ isLoading: val }),

  setResults: (results, sessionToken) =>
    set({ results, sessionToken, isLoading: false, error: null }),

  setError: (msg) => set({ error: msg, isLoading: false }),

  reset: () => set(defaultState),
}));
