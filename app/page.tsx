import Link from "next/link";
import { CheckCircle, Heart, ShieldAlert, Stethoscope } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex-1">
        {/* ─── HERO ─── */}
        <section className="pt-20 pb-16 text-center px-4">
          {/* Disclaimer badge */}
          <span className="bg-amber-100 text-amber-800 rounded-full px-4 py-1.5 text-sm inline-block mb-6 font-medium">
            Educational tool only — not a diagnostic service
          </span>

          <h1 className="text-4xl md:text-5xl font-bold text-[#1E3A5F] leading-tight mb-6">
            Understand Your Symptoms.
            <br />
            Get Informed. See a Doctor.
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-gray-500 leading-relaxed mb-10">
            HealthLens gives you structured health awareness — not random web results.
            Always based on curated medical data from verified sources.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/checker"
              className="bg-teal-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-teal-700 transition-colors"
            >
              Check Your Symptoms →
            </Link>
            <Link
              href="/emergency"
              className="border-2 border-teal-600 text-teal-600 px-8 py-4 rounded-xl text-lg font-medium hover:bg-teal-50 transition-colors"
            >
              Emergency Guide
            </Link>
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-[#1E3A5F] text-center">
              Everything you need in one place
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              {/* Card 1 */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 bg-teal-50 rounded-xl">
                  <Stethoscope size={28} className="text-teal-600" strokeWidth={1.8} />
                </div>
                <h3 className="text-base font-semibold text-[#1E3A5F] mb-2">
                  Symptom Checker
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Enter your symptoms and get structured health awareness in seconds
                  based on curated medical datasets.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 bg-teal-50 rounded-xl">
                  <ShieldAlert size={28} className="text-teal-600" strokeWidth={1.8} />
                </div>
                <h3 className="text-base font-semibold text-[#1E3A5F] mb-2">
                  Severity Guide
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Know instantly whether to monitor at home, visit a doctor within 48
                  hours, or seek immediate emergency care.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 bg-teal-50 rounded-xl">
                  <Heart size={28} className="text-teal-600" strokeWidth={1.8} />
                </div>
                <h3 className="text-base font-semibold text-[#1E3A5F] mb-2">
                  Emergency First Aid
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Step-by-step CPR and first aid guides that load offline. Designed for
                  emergencies when every second counts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── TRUST STRIP ─── */}
        <section className="py-10 bg-white">
          <div className="flex justify-center gap-12 flex-wrap">
            <div className="flex flex-col items-center text-center gap-2">
              <CheckCircle size={20} className="text-teal-600" />
              <span className="text-sm text-gray-600">Based on WHO &amp; AIIMS data</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <CheckCircle size={20} className="text-teal-600" />
              <span className="text-sm text-gray-600">Works on 2G mobile</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <CheckCircle size={20} className="text-teal-600" />
              <span className="text-sm text-gray-600">Your data stays private</span>
            </div>
          </div>
        </section>

        {/* ─── EMERGENCY CTA ─── */}
        <section className="py-12 bg-red-50 border-y border-red-100">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <p className="text-sm font-medium text-red-600 uppercase tracking-wide mb-2">
              In an emergency?
            </p>
            <h2 className="text-2xl font-bold text-[#1E3A5F] mb-8">
              Don&apos;t wait. Act immediately.
            </h2>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="tel:112"
                className="bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Call 112 — Emergency
              </a>
              <a
                href="tel:102"
                className="border-2 border-red-600 text-red-600 px-6 py-3 rounded-xl font-medium hover:bg-red-50 transition-colors"
              >
                Call 102 — Ambulance
              </a>
              <Link
                href="/emergency"
                className="bg-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-teal-700 transition-colors"
              >
                First Aid Guide →
              </Link>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="py-8 border-t bg-white text-center">
          <p className="text-sm text-gray-400 max-w-2xl mx-auto mb-4">
            HealthLens is an educational tool. It is not a substitute for professional
            medical advice, diagnosis, or treatment.
          </p>
          <div className="flex justify-center gap-6 flex-wrap">
            <Link href="/about" className="text-sm text-teal-600 hover:text-teal-700 transition-colors">
              About
            </Link>
            <Link href="/doctors" className="text-sm text-teal-600 hover:text-teal-700 transition-colors">
              Find a Doctor
            </Link>
            <Link href="/emergency" className="text-sm text-teal-600 hover:text-teal-700 transition-colors">
              Emergency Guide
            </Link>
          </div>
        </footer>
      </main>
  );
}
