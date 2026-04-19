import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import type { Metadata } from 'next';

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

export function generateStaticParams(): { slug: string }[] {
  const topics = getTopics();
  return topics.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopics().find((t) => t.slug === slug);
  if (!topic) return {};
  return {
    title: `${topic.title} — Emergency Guide | HealthLens`,
    description: topic.shortDescription,
  };
}

export default async function EmergencyTopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topics = getTopics();
  const topic = topics.find((t) => t.slug === slug);

  if (!topic) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
      {/* Back link */}
      <Link
        href="/emergency"
        className="text-teal-600 text-sm hover:text-teal-700 transition-colors"
      >
        ← All emergency guides
      </Link>

      {/* Warning box */}
      {topic.warning && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 mt-4 flex items-start gap-3">
          <AlertTriangle className="text-red-600 mt-0.5 shrink-0" size={18} />
          <p className="text-red-800 text-sm leading-relaxed">{topic.warning}</p>
        </div>
      )}

      {/* Topic header */}
      <div className="flex items-center gap-4 mt-4 mb-2">
        <span className="text-5xl">{topic.icon}</span>
        <h1 className="text-3xl font-bold text-[#1E3A5F]">{topic.title}</h1>
      </div>
      <p className="text-gray-500 text-sm leading-relaxed mb-8">{topic.shortDescription}</p>

      {/* Steps */}
      <div className="space-y-3">
        {topic.steps.map((step) => (
          <div
            key={step.stepNumber}
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-5"
          >
            {/* Step number */}
            <span className="text-3xl font-bold text-teal-600 min-w-[2.5rem] leading-none pt-0.5">
              {step.stepNumber}
            </span>

            {/* Instruction + time indicator */}
            <div className="text-base text-gray-700 leading-relaxed">
              {step.instruction}
              {step.timeIndicator && (
                <span className="ml-2 bg-teal-100 text-teal-800 rounded-full px-2 py-0.5 text-xs inline">
                  {step.timeIndicator}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom call-to-action box */}
      <div className="bg-gray-50 rounded-xl p-4 mt-8 text-center">
        <p className="text-gray-700 font-medium">
          When in doubt, always call 112. Do not hesitate.
        </p>
      </div>
    </div>
  );
}
