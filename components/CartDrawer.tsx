"use client";

import { useCartStore } from "@/lib/stores/cartStore";
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";

export default function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { items, removeItem, updateQty, clearCart, totalPrice } = useCartStore();

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-full bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-teal-600" />
            <h2 className="font-semibold text-[#1E3A5F]">
              Your Cart{" "}
              {items.length > 0 && (
                <span className="text-teal-600">({items.length})</span>
              )}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <span className="text-5xl">🛒</span>
              <p className="text-sm font-medium text-gray-500">Your cart is empty</p>
              <p className="text-xs text-gray-400">
                Add medicines from the catalog
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.medicine.id}
                className="bg-gray-50 rounded-xl p-3 flex items-start gap-3"
              >
                <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-xl shrink-0">
                  {item.medicine.imageEmoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1E3A5F] truncate">
                    {item.medicine.name}
                  </p>
                  <p className="text-xs text-gray-400">₹{item.medicine.price} each</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                      <button
                        onClick={() => updateQty(item.medicine.id, item.qty - 1)}
                        className="text-gray-500 hover:text-teal-600"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.medicine.id, item.qty + 1)}
                        className="text-gray-500 hover:text-teal-600"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-teal-700 ml-auto">
                      ₹{item.medicine.price * item.qty}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.medicine.id)}
                  className="text-red-400 hover:text-red-600 mt-0.5"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span className="text-base font-bold text-[#1E3A5F]">₹{totalPrice()}</span>
            </div>
            <p className="text-[10px] text-gray-400">
              Free delivery on orders above ₹299. Estimated delivery: 2–4 days.
            </p>
            <Link
              href="/medicines/checkout"
              onClick={onClose}
              className="block w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold text-center py-3 rounded-xl transition-colors"
            >
              Proceed to Checkout →
            </Link>
            <button
              onClick={clearCart}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 size={12} />
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
