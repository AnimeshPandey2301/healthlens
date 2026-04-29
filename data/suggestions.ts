/** Maps a disease keyword → array of medicine names from the internal dataset */
export const DISEASE_SUGGESTIONS: Record<string, string[]> = {
  fever: ["Paracetamol 500mg", "Dolo 650", "Ibuprofen 400mg", "Crocin Advance", "Combiflam"],
  cold: ["Cetirizine 10mg", "Sinarest Tablet", "D-Cold Total", "Honitus Syrup"],
  cough: ["Benadryl Cough Syrup", "Honitus Syrup", "Azithromycin 500mg"],
  "sore throat": ["Azithromycin 500mg", "Honitus Syrup", "Cetirizine 10mg"],
  headache: ["Paracetamol 500mg", "Crocin Advance", "Ibuprofen 400mg", "Combiflam"],
  bodyache: ["Combiflam", "Ibuprofen 400mg", "Flexon Tablet", "Diclofenac 50mg"],
  "joint pain": ["Diclofenac 50mg", "Naproxen 500mg", "Volini Gel 30g", "Flexon Tablet"],
  "back pain": ["Diclofenac 50mg", "Moov Pain Relief Cream", "Volini Gel 30g", "Flexon Tablet"],
  "muscle pain": ["Volini Gel 30g", "Moov Pain Relief Cream", "Naproxen 500mg", "Flexon Tablet"],
  toothache: ["Ibuprofen 400mg", "Paracetamol 500mg", "Flexon Tablet"],
  "menstrual pain": ["Meftal Spas", "Naproxen 500mg", "Ibuprofen 400mg"],
  diabetes: ["Metformin 500mg", "Glimepiride 2mg", "Gluconorm-G2", "Diabetic Support Capsules"],
  "high blood sugar": ["Metformin 500mg", "Glimepiride 2mg", "Januvia 100mg"],
  "high cholesterol": ["Atorvastatin 10mg", "Omega-3 Fish Oil 1000mg"],
  hypertension: ["Amlodipine 5mg", "Metoprolol 25mg", "Ramipril 5mg"],
  "blood pressure": ["Amlodipine 5mg", "Ramipril 5mg", "Metoprolol 25mg"],
  "heart pain": ["Aspirin 75mg", "Clopidogrel 75mg"],
  allergy: ["Cetirizine 10mg", "Sinarest Tablet"],
  sneezing: ["Cetirizine 10mg", "D-Cold Total", "Sinarest Tablet"],
  congestion: ["Sinarest Tablet", "D-Cold Total"],
};

export const DISCLAIMER =
  "⚠️ Disclaimer: This information is for educational purposes only and does not constitute medical advice. " +
  "Always consult a qualified doctor before taking any medication. " +
  "Self-medication can be harmful. HealthLens is not responsible for any health outcomes.";
