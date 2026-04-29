"use client";

import { useState } from "react";
import { Loader2, X, Plus, Minus } from "lucide-react";

type MedicineRow = { name: string; quantity: number; dosage: string };

interface Props {
  onOtpSent: (phone: string) => void;
}

export default function MedicineOrderForm({ onOtpSent }: Props) {
  const [patientName, setPatientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [medicines, setMedicines] = useState<MedicineRow[]>([
    { name: "", quantity: 1, dosage: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Medicine row helpers ────────────────────────────────────────────────
  const updateMedicine = (i: number, field: keyof MedicineRow, value: string | number) => {
    setMedicines((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m))
    );
  };

  const addMedicine = () => {
    if (medicines.length < 10)
      setMedicines((prev) => [...prev, { name: "", quantity: 1, dosage: "" }]);
  };

  const removeMedicine = (i: number) => {
    if (medicines.length > 1)
      setMedicines((prev) => prev.filter((_, idx) => idx !== i));
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!patientName.trim()) return setError("Patient name is required.");
    if (!phoneNumber.trim()) return setError("Phone number is required.");
    if (!deliveryAddress.trim()) return setError("Delivery address is required.");

    const validMeds = medicines.filter((m) => m.name.trim() && m.quantity > 0);
    if (validMeds.length === 0)
      return setError("Add at least one medicine with a name and quantity.");

    setIsLoading(true);

    // Save pending order to localStorage
    const pendingOrder = {
      patientName: patientName.trim(),
      medicines: validMeds.map((m) => ({
        name: m.name.trim(),
        quantity: m.quantity,
        ...(m.dosage.trim() && { dosage: m.dosage.trim() }),
      })),
      deliveryAddress: deliveryAddress.trim(),
      ...(notes.trim() && { notes: notes.trim() }),
    };
    localStorage.setItem("pendingOrder", JSON.stringify(pendingOrder));

    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        onOtpSent(phoneNumber.trim());
      } else if (res.status === 403) {
        setError("This phone number is not authorised to place orders.");
      } else if (res.status === 429) {
        setError("Too many OTP requests. Please wait before trying again.");
      } else {
        setError(data.message ?? "Failed to send OTP. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
    >
      <h2 className="text-2xl font-bold text-[#1E3A5F]">Place Medicine Order</h2>
      <p className="text-sm text-gray-400 mt-1">
        Only authorised phone numbers can place orders.
      </p>

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} className="shrink-0 hover:text-red-900">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="mt-6 space-y-5">
        {/* Patient Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Patient Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Full name of patient"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+91XXXXXXXXXX"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Must be an authorised number in international format (+91…)
          </p>
        </div>

        {/* Medicines */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medicines <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {medicines.map((med, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={med.name}
                  onChange={(e) => updateMedicine(i, "name", e.target.value)}
                  placeholder="Medicine name"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                />
                <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => updateMedicine(i, "quantity", Math.max(1, med.quantity - 1))}
                    className="text-gray-400 hover:text-teal-600 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={med.quantity}
                    onChange={(e) => updateMedicine(i, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-10 text-center text-sm outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => updateMedicine(i, "quantity", Math.min(100, med.quantity + 1))}
                    className="text-gray-400 hover:text-teal-600 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <input
                  type="text"
                  value={med.dosage}
                  onChange={(e) => updateMedicine(i, "dosage", e.target.value)}
                  placeholder="Dosage (opt.)"
                  className="w-28 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                />
                {medicines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMedicine(i)}
                    className="shrink-0 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addMedicine}
            disabled={medicines.length >= 10}
            className="mt-2 text-sm font-medium text-teal-600 border border-teal-200 hover:bg-teal-50 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-1.5 rounded-xl transition-colors"
          >
            + Add Medicine
          </button>
        </div>

        {/* Delivery Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Delivery Address <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Full delivery address with pincode"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all resize-none"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions (optional)"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all resize-none"
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="mt-8 w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white py-4 rounded-xl font-medium text-base transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Sending OTP…
          </>
        ) : (
          "Send OTP to Verify"
        )}
      </button>
    </form>
  );
}
