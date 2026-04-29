"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, Package, Home, Pill } from "lucide-react";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "HL-XXXXXXXX";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 py-16">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-10 max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>

        <h1 className="text-2xl font-bold text-[#1E3A5F] mb-2">Order Placed!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Your medicines are on their way. Thank you for using HealthLens.
        </p>

        {/* Order details */}
        <div className="bg-gray-50 rounded-2xl px-5 py-4 mb-6 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Order ID</span>
            <span className="font-semibold text-[#1E3A5F] font-mono">{orderId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className="text-emerald-600 font-semibold">✓ Confirmed</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Estimated Delivery</span>
            <span className="font-medium text-gray-700 flex items-center gap-1">
              <Package size={13} /> 2–4 business days
            </span>
          </div>
        </div>

        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 mb-6">
          ⚠️ For prescription medicines, keep your Rx ready at delivery. Our partner will verify.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/medicines"
            className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            <Pill size={16} /> Order More Medicines
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-3 rounded-xl text-sm transition-colors"
          >
            <Home size={16} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><div className="animate-spin border-4 border-teal-600 border-t-transparent rounded-full w-10 h-10"/></div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
