import { MapPin, Video, Pill } from "lucide-react";

export const metadata = {
  title: "Find a Doctor — HealthLens",
  description:
    "Find hospitals near you, consult doctors online, or look up medicine information. HealthLens connects you to trusted external services.",
};

const SPECIALTIES = [
  { label: "General Physician", query: "hospitals+near+me" },
  { label: "Cardiologist", query: "cardiologist+near+me" },
  { label: "Dermatologist", query: "dermatologist+near+me" },
  { label: "Neurologist", query: "neurologist+near+me" },
  { label: "Pediatrician", query: "pediatrician+near+me" },
  { label: "Orthopedist", query: "orthopedist+near+me" },
  { label: "Gynecologist", query: "gynecologist+near+me" },
];

export default function DoctorsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <h1 className="text-3xl font-bold text-[#1E3A5F]">
        Find Medical Help Near You
      </h1>
      <p className="text-gray-500 mt-2">
        HealthLens connects you to trusted external services. We do not book
        appointments directly.
      </p>

      {/* Option cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Card 1 — Nearby Hospitals */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-50 rounded-xl mb-4">
            <MapPin size={28} className="text-teal-600" strokeWidth={1.8} />
          </div>
          <h2 className="font-semibold text-lg text-[#1E3A5F]">
            Nearby Hospitals
          </h2>
          <p className="text-sm text-gray-500 mt-2 flex-1">
            Find hospitals, clinics, and pharmacies near your current location.
          </p>
          <a
            href="https://www.google.com/maps/search/hospitals+near+me"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-teal-600 text-white text-sm font-medium text-center rounded-lg px-5 py-2.5 w-full mt-4 hover:bg-teal-700 transition-colors"
          >
            Search Near Me
          </a>
        </div>

        {/* Card 2 — Online Consultation */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-50 rounded-xl mb-4">
            <Video size={28} className="text-teal-600" strokeWidth={1.8} />
          </div>
          <h2 className="font-semibold text-lg text-[#1E3A5F]">
            Online Consultation
          </h2>
          <p className="text-sm text-gray-500 mt-2 flex-1">
            Consult a qualified doctor from home. Available 24/7 across India.
          </p>
          <a
            href="https://www.practo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-teal-600 text-white text-sm font-medium text-center rounded-lg px-5 py-2.5 w-full mt-4 hover:bg-teal-700 transition-colors"
          >
            Consult Now
          </a>
          <p className="text-xs text-gray-400 text-center mt-2">
            Powered by Practo
          </p>
        </div>

        {/* Card 3 — Medicine Information */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-50 rounded-xl mb-4">
            <Pill size={28} className="text-teal-600" strokeWidth={1.8} />
          </div>
          <h2 className="font-semibold text-lg text-[#1E3A5F]">
            Medicine Information
          </h2>
          <p className="text-sm text-gray-500 mt-2 flex-1">
            Look up medicines, dosages, and generic alternatives.
          </p>
          <a
            href="https://www.1mg.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-teal-600 text-white text-sm font-medium text-center rounded-lg px-5 py-2.5 w-full mt-4 hover:bg-teal-700 transition-colors"
          >
            Search Medicines
          </a>
          <p className="text-xs text-gray-400 text-center mt-2">
            Powered by 1mg
          </p>
        </div>
      </div>

      {/* Specialty section */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
          Find by specialty
        </h2>
        <div className="flex overflow-x-auto gap-3 pb-2">
          {SPECIALTIES.map((s) => (
            <a
              key={s.label}
              href={`https://www.google.com/maps/search/${s.query}`}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 transition-colors"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
