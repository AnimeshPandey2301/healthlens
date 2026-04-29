"use client";

import { useState } from "react";
import { Stethoscope, Check } from "lucide-react";
import Link from "next/link";
import MedicineOrderForm from "@/components/medicines/MedicineOrderForm";
import OtpVerifyScreen from "@/components/medicines/OtpVerifyScreen";
import OrderSuccessScreen from "@/components/medicines/OrderSuccessScreen";

type Screen = "form" | "otp" | "success";

const STEPS = [
  { key: "form",    label: "Order Details" },
  { key: "otp",     label: "Verify OTP" },
  { key: "success", label: "Confirmed" },
] as const;

export default function MedicineOrderPage() {
  const [screen, setScreen]                   = useState<Screen>("form");
  const [phoneNumber, setPhoneNumber]         = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [orderId, setOrderId]                 = useState("");
  const [orderError, setOrderError]           = useState<string | null>(null);

  // ── form → otp ──────────────────────────────────────────────────────────
  const handleOtpSent = (phone: string) => {
    setPhoneNumber(phone);
    setScreen("otp");
  };

  // ── otp → success ───────────────────────────────────────────────────────
  const handleVerified = async (token: string) => {
    setVerificationToken(token);
    setOrderError(null);

    try {
      const raw = localStorage.getItem("pendingOrder");
      if (!raw) {
        setOrderError("Order data not found. Please fill the form again.");
        setScreen("form");
        return;
      }
      const pendingOrder = JSON.parse(raw);

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pendingOrder, phoneNumber, verificationToken: token }),
      });
      const data = await res.json();

      if (res.ok) {
        setOrderId(data.data.orderId);
        localStorage.removeItem("pendingOrder");
        setScreen("success");
      } else {
        setOrderError(data.message ?? "Failed to place order. Please try again.");
      }
    } catch {
      setOrderError("Network error. Please check your connection and try again.");
    }
  };

  // ── success → form ──────────────────────────────────────────────────────
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

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Progress pills */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((step, i) => {
            const isDone    = i < currentStep;
            const isActive  = i === currentStep;
            return (
              <div key={step.key} className="flex items-center gap-2">
                <span
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? "bg-teal-600 text-white shadow-sm"
                      : isDone
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isDone && <Check size={13} />}
                  {step.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-px ${isDone ? "bg-green-300" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Order creation error banner */}
        {orderError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-700">
            {orderError}
          </div>
        )}

        {/* Screen render — wrap OTP screen in relative so back button positions correctly */}
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
          {screen === "success" && (
            <OrderSuccessScreen orderId={orderId} onNewOrder={handleNewOrder} />
          )}
        </div>
      </div>
    </div>
  );
}
