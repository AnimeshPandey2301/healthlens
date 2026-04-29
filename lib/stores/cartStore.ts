import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Medicine } from "@/data/medicines";

export type CartItem = {
  medicine: Medicine;
  qty: number;
};

type CartStore = {
  items: CartItem[];
  addItem: (medicine: Medicine) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (medicine) => {
        const existing = get().items.find((i) => i.medicine.id === medicine.id);
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.medicine.id === medicine.id ? { ...i, qty: i.qty + 1 } : i
            ),
          }));
        } else {
          set((s) => ({ items: [...s.items, { medicine, qty: 1 }] }));
        }
      },

      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.medicine.id !== id) })),

      updateQty: (id, qty) => {
        if (qty <= 0) {
          get().removeItem(id);
          return;
        }
        set((s) => ({
          items: s.items.map((i) => (i.medicine.id === id ? { ...i, qty } : i)),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.qty, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.medicine.price * i.qty, 0),
    }),
    { name: "healthlens-cart" }
  )
);
