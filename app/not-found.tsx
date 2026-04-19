import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      {/* Large decorative 404 */}
      <p className="text-8xl font-bold text-gray-100 select-none leading-none">
        404
      </p>

      <h1 className="text-2xl font-bold text-[#1E3A5F] mt-4">
        Page not found
      </h1>

      <p className="text-gray-500 mt-2 max-w-xs">
        This page doesn&apos;t exist, but your health still matters.
      </p>

      <div className="flex gap-4 mt-8 flex-wrap justify-center">
        <Link
          href="/"
          className="border-2 border-teal-600 text-teal-600 px-6 py-3 rounded-xl text-sm font-medium hover:bg-teal-50 transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/checker"
          className="bg-teal-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          Check My Symptoms
        </Link>
      </div>
    </div>
  );
}
