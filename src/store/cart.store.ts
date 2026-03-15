import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CartState, CartActions, CartDrawerState } from "@/types/cart.types";
import type { Vendor } from "@/types/database.types";

type CartStore = CartState & CartDrawerState & CartActions;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      vendorId: null,
      vendorName: null,
      vendorSlug: null,
      drawerOpen: false,

      addItem(item, vendor) {
        const { items, vendorId } = get();

        // If adding from a different vendor, clear cart first
        if (vendorId && vendorId !== vendor.id) {
          set({
            items: [item],
            vendorId: vendor.id,
            vendorName: vendor.name,
            vendorSlug: vendor.slug,
          });
          return;
        }

        const existing = items.find((i) => i.menuItemId === item.menuItemId);
        if (existing) {
          set({
            items: items.map((i) =>
              i.menuItemId === item.menuItemId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({
            items: [...items, item],
            vendorId: vendor.id,
            vendorName: vendor.name,
            vendorSlug: vendor.slug,
          });
        }
      },

      removeItem(menuItemId) {
        const items = get().items.filter((i) => i.menuItemId !== menuItemId);
        if (items.length === 0) {
          set({ items: [], vendorId: null, vendorName: null, vendorSlug: null });
        } else {
          set({ items });
        }
      },

      updateQuantity(menuItemId, quantity) {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.menuItemId === menuItemId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart() {
        set({ items: [], vendorId: null, vendorName: null, vendorSlug: null });
      },

      openDrawer() {
        set({ drawerOpen: true });
      },

      closeDrawer() {
        set({ drawerOpen: false });
      },

      getTotal() {
        return get().items.reduce((sum, item) => {
          const modifierTotal = (item.selectedModifiers ?? []).reduce(
            (s, m) => s + m.priceAdjustment,
            0
          );
          return sum + (item.price + modifierTotal) * item.quantity;
        }, 0);
      },

      getItemCount() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "letusell-cart",
      partialize: (state) => ({
        items: state.items,
        vendorId: state.vendorId,
        vendorName: state.vendorName,
        vendorSlug: state.vendorSlug,
      }),
    }
  )
);
