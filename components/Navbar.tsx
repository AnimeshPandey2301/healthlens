import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Stethoscope, Menu } from "lucide-react";

export default async function Navbar() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 h-16">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-full">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold text-teal-600 flex items-center gap-2 hover:text-teal-700 transition-colors"
        >
          <Stethoscope size={22} strokeWidth={2.2} />
          HealthLens
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/checker"
            className="text-sm text-gray-600 hover:text-teal-600 font-medium transition-colors"
          >
            Symptom Checker
          </Link>
          <Link
            href="/emergency"
            className="text-sm text-gray-600 hover:text-teal-600 font-medium transition-colors"
          >
            Emergency Guide
          </Link>
          <Link
            href="/diet-plan"
            className="text-sm text-gray-600 hover:text-teal-600 font-medium transition-colors"
          >
            Diet Plan
          </Link>
          <Link
            href="/doctors"
            className="text-sm text-gray-600 hover:text-teal-600 font-medium transition-colors"
          >
            Find a Doctor
          </Link>
          <Link
            href="/medicines"
            className="text-sm text-gray-600 hover:text-teal-600 font-medium transition-colors"
          >
            Medicines
          </Link>
          <Link
            href="/medicines/order"
            className="text-sm text-gray-600 hover:text-teal-600 font-medium transition-colors"
          >
            Order Medicines
          </Link>
        </nav>

        {/* Auth section */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm px-4 py-2 rounded-lg border border-teal-600 text-teal-600 font-medium hover:bg-teal-50 transition-colors"
            >
              Sign In
            </Link>
          )}

          {/* Mobile hamburger → checker */}
          <Link
            href="/checker"
            className="md:hidden p-2 rounded-lg text-gray-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"
            aria-label="Menu"
          >
            <Menu size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
}
