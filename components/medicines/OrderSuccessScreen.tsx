"use client";

import { CheckCircle2 } from "lucide-react";

interface Props {
  orderId: string;
  onNewOrder: () => void;
}

export default function OrderSuccessScreen({ orderId, onNewOrder }: Props) {
  return (
    <div className="max-w-sm mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
      {/* Checkmark */}
      <div className="flex justify-center">
        <CheckCircle2 size={64} className="text-green-600" strokeWidth={1.5} />
      </div>

      <h2 className="text-2xl font-bold text-[#1E3A5F] mt-4">Order Confirmed!</h2>
      <p className="text-gray-500 text-sm mt-2">
        Your medicine order has been placed successfully.
      </p>

      {/* Order ID */}
      <div className="mt-6 bg-gray-50 rounded-xl p-4 text-left">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Order ID</p>
        <p className="font-mono font-semibold text-sm text-gray-700 mt-1 break-all">
          {orderId}
        </p>
      </div>

      {/* New order */}
      <button
        onClick={onNewOrder}
        className="mt-8 w-full py-3 rounded-xl border-2 border-teal-600 text-teal-600 font-medium hover:bg-teal-50 transition-colors"
      >
        Place Another Order
      </button>
    </div>
  );
}
