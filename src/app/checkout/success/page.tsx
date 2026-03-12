"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Suspense } from "react";
import { useCartStore } from "@/store/cart.store";

function SuccessRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    // Clear the cart now that payment succeeded
    clearCart();

    // Save to recent orders for guest tracking
    if (orderId) {
      try {
        const existing = JSON.parse(localStorage.getItem("letusell-recent-orders") ?? "[]");
        const updated = [orderId, ...existing.filter((id: string) => id !== orderId)].slice(0, 10);
        localStorage.setItem("letusell-recent-orders", JSON.stringify(updated));
      } catch {
        // localStorage unavailable — ignore
      }

      router.replace(`/orders/${orderId}`);
    } else {
      router.replace("/");
    }
  }, [orderId, router, clearCart]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Spinner className="mx-auto h-10 w-10" />
        <p className="mt-4 text-gray-600">Processing your payment...</p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Spinner className="h-10 w-10" /></div>}>
      <SuccessRedirect />
    </Suspense>
  );
}
