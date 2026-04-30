"use client";

import { useState } from "react";
import { Stethoscope, Check } from "lucide-react";
import Link from "next/link";
import MedicineOrderForm from "@/components/medicines/MedicineOrderForm";
import OtpVerifyScreen from "@/components/medicines/OtpVerifyScreen";
import PaymentScreen from "@/components/medicines/PaymentScreen";
import OrderSuccessScreen from "@/components/medicines/OrderSuccessScreen";

type Screen = "form" | "otp" | "payment" | "success";

const STEPS: { key: Screen; label: string }[] = [
  { key: "form",    label: "Order Details" },
  { key: "otp",     label: "Verify OTP" },
  { key: "payment", label: "Payment" },
  { key: "success", label: "Confirmed" },
];

export default function MedicineOrderPage() {
  const [screen, setScreen]                       = useState<Screen>("form");
  const [phoneNumber, setPhoneNumber]             = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [orderId, setOrderId]                     = useState("");
  const [orderError, setOrderError]               = useState<string | null>(null);

  // ── form → otp ────────────────────────────────────────────────────────
  const handleOtpSent = (phone: string) => {
    setPhoneNumber(phone);
    setScreen("otp");
  };

  // ── otp → payment ─────────────────────────────────────────────────────
  const handleVerified = (token: string) => {
    setVerificationToken(token);
    setOrderError(null);
    setScreen("payment");
  };

  // ── payment → success ─────────────────────────────────────────────────
  const handleOrderPlaced = (id: string) => {
    setOrderId(id);
    setScreen("success");
  };

  // ── success → form ────────────────────────────────────────────────────
  const handleNewOrder = () => {
    setScreen("form");
    setPhoneNumber("");
    setVerificationToken("");
    setOrderId("");
    setOrderError(null);
  };

  const currentStep = STEPS.findIndex((s) => s.key === screen);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-teal-600 font-bold text-lg">
            <Stethoscope size={20} />
            HealthLens
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500">Medicine Orders</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress pills */}
        <div className="flex items-center justify-center gap-1.5 mb-8 flex-wrap">
          {STEPS.map((step, i) => {
            const isDone   = i < currentStep;
            const isActive = i === currentStep;
            return (
              <div key={step.key} className="flex items-center gap-1.5">
                <span
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-teal-600 text-white shadow-sm shadow-teal-200"
                      : isDone
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isDone && <Check size={11} />}
                  {step.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`w-5 h-px ${isDone ? "bg-green-300" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Error banner */}
        {orderError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-700">
            {orderError}
          </div>
        )}

        {/* Screens */}
        <div className={screen === "otp" ? "relative" : ""}>
          {screen === "form" && (
            <MedicineOrderForm onOtpSent={handleOtpSent} />
          )}
          {screen === "otp" && (
            <OtpVerifyScreen
              phoneNumber={phoneNumber}
              onVerified={handleVerified}
              onBack={() => setScreen("form")}
            />
          )}
          {screen === "payment" && (
            <PaymentScreen
              phoneNumber={phoneNumber}
              verificationToken={verificationToken}
              onOrderPlaced={handleOrderPlaced}
              onBack={() => setScreen("otp")}
            />
          )}
          {screen === "success" && (
            <OrderSuccessScreen orderId={orderId} onNewOrder={handleNewOrder} />
          )}
        </div>
      </div>
    </div>
  );
}
