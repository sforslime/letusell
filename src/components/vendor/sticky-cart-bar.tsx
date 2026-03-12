"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { formatNGN, koboToNaira } from "@/lib/utils/currency";

interface StickyCartBarProps {
  vendorId: string;
}

export function StickyCartBar({ vendorId }: StickyCartBarProps) {
  // Avoid hydration mismatch — cart is only available client-side
  const [mounted, setMounted] = useState(false);
  const { items, vendorId: cartVendorId, getTotal, getItemCount } = useCart();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  // Only show if cart has items from this vendor
  if (items.length === 0 || cartVendorId !== vendorId) return null;

  const count = getItemCount();
  const total = getTotal();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 sm:px-6">
      <Link
        href="/cart"
        className="mx-auto flex max-w-4xl items-center justify-between rounded-2xl bg-brand-600 px-5 py-4 shadow-lg transition-transform active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
            {count}
          </span>
          <span className="text-sm font-semibold text-white">View cart</span>
        </div>
        <span className="text-sm font-bold text-white">{formatNGN(koboToNaira(total))}</span>
      </Link>
    </div>
  );
}
