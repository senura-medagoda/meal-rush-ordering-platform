import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  maxQty: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? {
                      ...i,
                      price: item.price,
                      maxQty: item.maxQty,
                      quantity: Math.min(i.quantity + quantity, item.maxQty),
                    }
                  : i,
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: Math.min(quantity, item.maxQty) }],
          };
        }),

      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxQty)) }
              : i,
          ),
        })),

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

      clear: () => set({ items: [] }),
    }),
    { name: 'mealrush-cart' }, // the localStorage key
  ),
);