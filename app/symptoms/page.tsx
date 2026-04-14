import prisma from '@/lib/prisma';

export default async function SymptomsPage() {
  // 1. Fetch data directly from the DB
  const symptoms = await prisma.symptom.findMany();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Available Symptoms</h1>
      <ul>
        {symptoms.map((s) => (
          <li key={s.id} className="border-b py-2">
            {s.displayName} — <span className="text-gray-500">{s.bodyArea}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}