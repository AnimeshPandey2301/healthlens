/**
 * Shared in-memory pending session store.
 * Consumed by /api/symptoms/analyse (write) and /api/sessions/save (read + delete).
 */

export type PendingSession = {
  symptoms: string[];
  ageGroup: string;
  gender: string;
  duration: string;
  results: {
    condition: {
      slug: string;
      name: string;
      description: string;
      symptoms: string[];
      severityLevel: string;
      speciality: string;
      precautions: string[];
      medicineAwareness: string[];
      articleUrl: string;
    };
    matchScore: number;
    severityLevel: string;
    rank: number;
  }[];
  createdAt: number;
};

export const pendingSessionMap = new Map<string, PendingSession>();
