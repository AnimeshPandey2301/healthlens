"use client";

import { useCartStore } from "@/lib/stores/cartStore";
import type { Medicine } from "@/data/medicines";
import { ShoppingCart, Plus, Minus, X } from "lucide-react";
import Link from "next/link";

function categoryColor(cat: string) {
  const map: Record<string, string> = {
    "Fever": "bg-orange-100 text-orange-700",
    "Cold & Cough": "bg-blue-100 text-blue-700",
    "Pain Relief": "bg-red-100 text-red-700",
    "Diabetes": "bg-purple-100 text-purple-700",
    "Heart Care": "bg-pink-100 text-pink-700",
  };
  return map[cat] ?? "bg-gray-100 text-gray-600";
}

export default function MedicineCard({ medicine }: { medicine: Medicine }) {
  const { items, addItem, removeItem, updateQty } = useCartStore();
  const cartItem = items.find((i) => i.medicine.id === medicine.id);
  const inCart = !!cartItem;
  const outOfStock = medicine.stock === 0;
  const discount = Math.round(((medicine.mrp - medicine.price) / medicine.mrp) * 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200 relative">
      {/* Rx badge */}
      {medicine.requiresPrescription && (
        <span className="absolute top-3 right-3 bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
          Rx Required
        </span>
      )}

      {/* Emoji + Category */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-2xl shrink-0">
          {medicine.imageEmoji}
        </div>
        <div className="min-w-0">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryColor(medicine.category)}`}>
            {medicine.category}
          </span>
          <h3 className="text-sm font-semibold text-[#1E3A5F] mt-1 leading-tight">{medicine.name}</h3>
          <p className="text-xs text-gray-400">{medicine.genericName}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{medicine.description}</p>

      {/* Dosage */}
      <p className="text-[10px] text-teal-700 bg-teal-50 rounded-lg px-2 py-1">
        💊 {medicine.dosage}
      </p>

      {/* Price row */}
      <div className="flex items-center gap-2 mt-auto">
        <span className="text-base font-bold text-[#1E3A5F]">₹{medicine.price}</span>
        <span className="text-xs text-gray-400 line-through">₹{medicine.mrp}</span>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
          {discount}% off
        </span>
      </div>

      {/* Stock */}
      <p className={`text-[10px] font-medium ${outOfStock ? "text-red-500" : "text-emerald-600"}`}>
        {outOfStock ? "● Out of Stock" : `● In Stock (${medicine.stock} units)`}
      </p>

      {/* Cart controls */}
      {outOfStock ? (
        <button disabled className="w-full py-2 rounded-xl bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed">
          Unavailable
        </button>
      ) : !inCart ? (
        <button
          onClick={() => addItem(medicine)}
          className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingCart size={14} />
          Add to Cart
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-3 py-1.5 flex-1 justify-between">
            <button
              onClick={() => updateQty(medicine.id, cartItem.qty - 1)}
              className="text-teal-700 hover:text-teal-900"
            >
              <Minus size={14} />
            </button>
            <span className="text-sm font-bold text-teal-700">{cartItem.qty}</span>
            <button
              onClick={() => updateQty(medicine.id, cartItem.qty + 1)}
              className="text-teal-700 hover:text-teal-900"
            >
              <Plus size={14} />
            </button>
          </div>
          <button
            onClick={() => removeItem(medicine.id)}
            className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
