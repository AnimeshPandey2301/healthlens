export const metadata = {
  title: "About HealthLens — Health Awareness Platform",
  description:
    "Learn about HealthLens, how it works, our data sources, medical disclaimer, and our commitment to your privacy.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-[#1E3A5F] mb-10">
        About HealthLens
      </h1>

      {/* What is HealthLens */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#1E3A5F] mb-3">
          What is HealthLens?
        </h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          HealthLens is a free, educational health awareness platform built for
          India. It helps you understand your symptoms in a structured, medically
          grounded way — replacing the chaos of random Google searches with
          curated information from verified medical datasets and public health
          organisations.
        </p>
        <p className="text-gray-600 leading-relaxed">
          HealthLens is <strong>not</strong> a diagnostic service and is not a
          substitute for a qualified doctor. Our mission is to reduce health
          misinformation by giving every Indian access to the same quality of
          structured health awareness, regardless of their location or internet
          speed.
        </p>
      </section>

      {/* How it works */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
          How it works
        </h2>
        <ol className="space-y-4">
          {[
            {
              n: 1,
              title: "Enter your symptoms",
              desc: "Search and select from a curated list of clinically validated symptoms. Add filters like age, sex, and duration to improve accuracy.",
            },
            {
              n: 2,
              title: "Get structured health awareness",
              desc: "HealthLens matches your symptom profile against verified medical datasets and returns a ranked list of possible conditions with severity guidance.",
            },
            {
              n: 3,
              title: "Consult a doctor",
              desc: "Use the results as a starting point for a conversation with your physician — not as a final answer. HealthLens helps you ask better questions.",
            },
          ].map(({ n, title, desc }) => (
            <li key={n} className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center">
                {n}
              </span>
              <div>
                <p className="font-semibold text-[#1E3A5F]">{title}</p>
                <p className="text-gray-500 text-sm mt-1">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Data sources */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#1E3A5F] mb-3">
          Our data sources
        </h2>
        <ul className="space-y-2 text-gray-600">
          {[
            "Kaggle Disease–Symptom Dataset (CC0 public domain)",
            "WHO fact sheets and clinical guidelines",
            "Mayo Clinic Patient Care & Health Information",
            "MedlinePlus — U.S. National Library of Medicine",
          ].map((src) => (
            <li key={src} className="flex items-start gap-2">
              <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-teal-600 inline-block" />
              <span className="text-sm leading-relaxed">{src}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Medical disclaimer */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
          Medical disclaimer
        </h2>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-3">
          <p className="text-sm text-amber-900 leading-relaxed">
            HealthLens is an educational tool only. It is not a substitute for
            professional medical advice, diagnosis, or treatment.
          </p>
          <p className="text-sm text-amber-900 leading-relaxed">
            Always seek the advice of your physician or other qualified health
            provider with any questions you may have regarding a medical
            condition.
          </p>
          <p className="text-sm text-amber-900 leading-relaxed">
            Never disregard professional medical advice or delay in seeking it
            because of something you have read on HealthLens.
          </p>
          <p className="text-sm text-amber-900 font-medium leading-relaxed">
            If you think you may have a medical emergency, call 112 immediately.
          </p>
        </div>
      </section>

      {/* Privacy */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#1E3A5F] mb-3">Privacy</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          HealthLens is designed in compliance with India&apos;s{" "}
          <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>.
          We do not sell, rent, or share your personal data with third parties
          for commercial purposes. Your symptom sessions and medical profile are
          stored securely and are visible only to you. You can export all your
          data or permanently delete your account at any time from the Dashboard.
        </p>
      </section>
    </div>
  );
}
