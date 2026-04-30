"use client";

import { useState } from "react";
import {
  CreditCard, Smartphone, Building2, Truck, ShieldCheck,
  ChevronDown, ChevronUp, Loader2, Lock, IndianRupee, Package
} from "lucide-react";

type MedicineItem = {
  name: string;
  quantity: number;
  dosage?: string;
  price?: number;
};

type PendingOrder = {
  patientName: string;
  medicines: MedicineItem[];
  deliveryAddress: string;
  notes?: string;
  total?: number;
};

interface Props {
  phoneNumber: string;
  verificationToken: string;
  onOrderPlaced: (orderId: string) => void;
  onBack: () => void;
}

type PaymentMethod = "upi" | "card" | "netbanking" | "cod";

const METHODS: { key: PaymentMethod; label: string; sub: string; icon: React.ReactNode }[] = [
  {
    key: "upi",
    label: "UPI",
    sub: "Pay via Google Pay, PhonePe, Paytm or any UPI app",
    icon: <Smartphone size={20} className="text-teal-600" />,
  },
  {
    key: "card",
    label: "Debit / Credit Card",
    sub: "Visa, Mastercard, RuPay accepted",
    icon: <CreditCard size={20} className="text-blue-600" />,
  },
  {
    key: "netbanking",
    label: "Net Banking",
    sub: "All major Indian banks supported",
    icon: <Building2 size={20} className="text-purple-600" />,
  },
  {
    key: "cod",
    label: "Cash on Delivery",
    sub: "Pay when your order arrives",
    icon: <Truck size={20} className="text-orange-500" />,
  },
];

export default function PaymentScreen({
  phoneNumber,
  verificationToken,
  onOrderPlaced,
  onBack,
}: Props) {
  const [method, setMethod]         = useState<PaymentMethod>("upi");
  const [upiId, setUpiId]           = useState("");
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(true);

  // Read order from localStorage
  const raw    = typeof window !== "undefined" ? localStorage.getItem("pendingOrder") : null;
  const order: PendingOrder | null = raw ? JSON.parse(raw) : null;

  const subtotal = order?.total ?? order?.medicines.reduce(
    (s, m) => s + (m.price ?? 0) * m.quantity, 0
  ) ?? 0;
  const deliveryFee = subtotal >= 299 || subtotal === 0 ? 0 : 49;
  const total       = subtotal + deliveryFee;

  const handlePay = async () => {
    setError(null);
    if (!order) {
      setError("Order data not found. Please go back and fill the form again.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...order,
          phoneNumber,
          verificationToken,
          paymentMethod: method,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.removeItem("pendingOrder");
        onOrderPlaced(data.data.orderId);
      } else {
        setError(data.message ?? "Failed to place order. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">

      {/* Back */}
      <button
        onClick={onBack}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        ← Back to OTP
      </button>

      {/* Order Summary Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowSummary((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-2 font-semibold text-[#1E3A5F]">
            <Package size={18} className="text-teal-600" />
            Order Summary
            {order && (
              <span className="text-xs font-normal text-gray-400 ml-1">
                ({order.medicines.length} item{order.medicines.length > 1 ? "s" : ""})
              </span>
            )}
          </div>
          {showSummary ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>

        {showSummary && order && (
          <div className="border-t border-gray-50 px-5 pb-4">
            {/* Patient info */}
            <div className="pt-3 pb-2 text-xs text-gray-500">
              Patient: <span className="font-medium text-gray-700">{order.patientName}</span>
              {" · "}
              <span className="font-medium text-gray-700">{phoneNumber}</span>
            </div>

            {/* Medicine list */}
            <div className="space-y-2 mt-1">
              {order.medicines.map((m, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.name}</p>
                    {m.dosage && (
                      <p className="text-xs text-gray-400 mt-0.5">{m.dosage}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm text-gray-600">× {m.quantity}</p>
                    {m.price && (
                      <p className="text-xs font-semibold text-teal-700">
                        ₹{m.price * m.quantity}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery address */}
            <div className="mt-3 text-xs text-gray-500">
              📍 {order.deliveryAddress}
            </div>

            {/* Pricing */}
            {subtotal > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Delivery fee</span>
                  <span className={deliveryFee === 0 ? "text-green-600 font-medium" : ""}>
                    {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#1E3A5F] pt-1 border-t border-gray-100">
                  <span>Total</span>
                  <span className="flex items-center gap-0.5">
                    <IndianRupee size={14} />
                    {total}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
        <h3 className="font-semibold text-[#1E3A5F] mb-4">Select Payment Method</h3>
        <div className="space-y-2">
          {METHODS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMethod(m.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                method === m.key
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-100 hover:border-teal-200 hover:bg-gray-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                method === m.key ? "bg-white shadow-sm" : "bg-gray-50"
              }`}>
                {m.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{m.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{m.sub}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                method === m.key ? "border-teal-500" : "border-gray-300"
              }`}>
                {method === m.key && (
                  <div className="w-2 h-2 rounded-full bg-teal-500" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* UPI ID input */}
        {method === "upi" && (
          <div className="mt-3">
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="Enter UPI ID (e.g. name@upi)"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Security note */}
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
          <ShieldCheck size={14} className="text-green-500 shrink-0" />
          <span>Your payment information is encrypted and secure. OTP verified ✓</span>
        </div>
      </div>

      {/* Pay Button */}
      <button
        onClick={handlePay}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white py-4 rounded-2xl font-semibold text-base shadow-lg shadow-teal-200 transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Placing Order…
          </>
        ) : (
          <>
            <Lock size={16} />
            {method === "cod"
              ? "Confirm Order (Cash on Delivery)"
              : total > 0
              ? `Pay ₹${total}`
              : "Confirm & Place Order"}
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-400 pb-4">
        By placing the order you agree to our terms. Delivery in 2–4 business days.
      </p>
    </div>
  );
}
