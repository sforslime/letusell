"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { CartSummary } from "@/components/cart/cart-summary";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const { items, vendorName, vendorSlug, getTotal, clearCart } = useCart();
  const total = getTotal();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/vendors">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Your cart</h1>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-50">
              <ShoppingBag className="h-10 w-10 text-gray-300" />
            </div>
            <h2 className="mt-5 text-lg font-bold text-gray-800">Your cart is empty</h2>
            <p className="mt-1.5 text-sm text-gray-400">Browse vendors and add items to get started</p>
            <Link href="/vendors" className="mt-7">
              <Button size="lg" className="shadow-sm shadow-brand-500/20">Browse vendors</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Vendor info */}
            {vendorName && vendorSlug && (
              <div className="flex items-center justify-between rounded-2xl bg-brand-50 px-4 py-3 border border-brand-100">
                <div>
                  <p className="text-xs font-medium text-brand-500 uppercase tracking-wide">Ordering from</p>
                  <Link href={`/vendors/${vendorSlug}`} className="text-sm font-bold text-brand-700 hover:underline">
                    {vendorName}
                  </Link>
                </div>
                <button onClick={clearCart} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                  Clear cart
                </button>
              </div>
            )}

            {/* Items */}
            <div className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-50 px-4 shadow-sm">
              {items.map((item) => (
                <CartItemRow key={item.productId} item={item} />
              ))}
            </div>

            {/* Summary */}
            <CartSummary subtotal={total} />

            {/* Checkout CTA */}
            <Link href="/checkout">
              <Button className="w-full shadow-lg shadow-brand-500/20" size="lg">
                Checkout · {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(total)}
              </Button>
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
