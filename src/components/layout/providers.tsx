"use client";

import { CartDrawer } from "@/components/cart/cart-drawer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CartDrawer />
    </>
  );
}
