"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { PaystackButton } from "@/components/checkout/paystack-button";
import { CartSummary } from "@/components/cart/cart-summary";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { Button } from "@/components/ui/button";
import { formatNGN } from "@/lib/utils/currency";
import { koboToNaira } from "@/lib/utils/currency";
import type { CheckoutFormValues } from "@/lib/validations/checkout.schema";
import type { CheckoutInitializeResponse } from "@/types/api.types";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, vendorId, vendorSlug, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [initData, setInitData] = useState<CheckoutInitializeResponse | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <h2 className="text-xl font-bold text-gray-800">Your cart is empty</h2>
          <Link href="/vendors" className="mt-4 inline-block">
            <Button>Browse vendors</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  async function handleFormSubmit(values: CheckoutFormValues) {
    setError(null);
    setIsInitializing(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      // Attach token if logged in
      if (user) {
        const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
        const supabase = getSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
      }

      const res = await fetch("/api/checkout/initialize", {
        method: "POST",
        headers,
        body: JSON.stringify({
          cart: items,
          customer: {
            name: values.name,
            email: values.email,
            phone: values.phone || undefined,
          },
          vendorId,
          pickupTime: values.pickupTime,
          notes: values.notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to initialize checkout");
        return;
      }

      setInitData(data as CheckoutInitializeResponse);
      setOrderId(data.orderId);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsInitializing(false);
    }
  }

  function handlePaymentSuccess() {
    clearCart();
    router.push(`/orders/${orderId}`);
  }

  function handlePaymentClose() {
    // User closed Paystack popup — order was created but not paid
    // It will remain as awaiting_payment
    setInitData(null);
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/cart">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
          {/* Left: form */}
          <div>
            {!initData ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <CheckoutForm
                  vendorSlug={vendorSlug ?? ""}
                  onSubmit={handleFormSubmit}
                  isSubmitting={isInitializing}
                >
                  {error && (
                    <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                      {error}
                    </p>
                  )}
                  <Button type="submit" className="w-full" size="lg" loading={isInitializing}>
                    Continue to payment
                  </Button>
                </CheckoutForm>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Total: <strong>{formatNGN(koboToNaira(initData.amount))}</strong>
                </p>
                <PaystackButton
                  accessCode={initData.accessCode}
                  amount={initData.amount}
                  onSuccess={handlePaymentSuccess}
                  onClose={handlePaymentClose}
                />
                <button
                  className="mt-3 text-xs text-gray-400 hover:text-gray-600"
                  onClick={() => setInitData(null)}
                >
                  Go back and edit details
                </button>
              </div>
            )}
          </div>

          {/* Right: order summary */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-gray-900">Order summary</h2>
              <div className="divide-y divide-gray-50">
                {items.map((item) => (
                  <CartItemRow key={item.menuItemId} item={item} />
                ))}
              </div>
            </div>
            <CartSummary subtotal={total} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
