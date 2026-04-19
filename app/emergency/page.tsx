import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Emergency First Aid Guide — HealthLens',
  description:
    'Step-by-step first aid guides for common emergencies: CPR, choking, burns, fractures, seizures, snakebite, and heat stroke. Works offline.',
};

interface EmergencyStep {
  stepNumber: number;
  instruction: string;
  timeIndicator: string | null;
}

interface EmergencyTopic {
  slug: string;
  title: string;
  icon: string;
  shortDescription: string;
  warning: string | null;
  steps: EmergencyStep[];
}

function getTopics(): EmergencyTopic[] {
  const filePath = path.join(process.cwd(), 'public', 'data', 'emergency-topics.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as EmergencyTopic[];
}

export default function EmergencyPage() {
  const topics = getTopics();

  return (
    <div className="pb-16 md:pb-0">
      {/* Red alert banner */}
      <div className="bg-red-600 text-white text-center py-3 font-medium text-sm px-4">
        In any life-threatening emergency, always call 112 first
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page heading */}
        <h1 className="text-3xl font-bold text-[#1E3A5F] mt-6">Emergency First Aid Guide</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Step-by-step guides for common emergencies. Bookmark this page — it works offline.
        </p>

        {/* Topic grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 mb-12">
          {topics.map((topic) => (
            <Link
              key={topic.slug}
              href={`/emergency/${topic.slug}`}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer block no-underline"
            >
              <p className="text-4xl mb-3">{topic.icon}</p>
              <p className="text-lg font-semibold text-gray-900">{topic.title}</p>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                {topic.shortDescription}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
