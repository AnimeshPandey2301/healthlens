import Link from "next/link";

/**
 * Placeholder homepage — Day 7 will replace this with the full landing page.
 */
export default function HomePage() {
  return (
    <main className="flex flex-1 min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-bold text-teal-600 tracking-tight">HealthLens</h1>
      <p className="text-lg text-gray-500 max-w-sm">
        Your health awareness platform. Built for India.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <Link
          href="/checker"
          className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition-colors"
        >
          Check Symptoms
        </Link>
        <Link
          href="/emergency"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Emergency Guide
        </Link>
      </div>
    </main>
  );
}
