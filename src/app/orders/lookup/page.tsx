"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { Search, ArrowLeft, Clock, CheckCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatNGN } from "@/lib/utils/currency";
import { koboToNaira } from "@/lib/utils/currency";
import { formatPickupTime } from "@/lib/utils/date";

interface LookupResult {
  id: string;
  status: string;
  payment_status: string;
  amount_kobo: number;
  pickup_time: string | null;
  customer_email: string;
  created_at: string;
}

export default function OrderLookupPage() {
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), orderId: orderId.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError("No order found for those details. Check your email and order ID.");
        return;
      }
      setResult(data as LookupResult);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-md px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Find your order</h1>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-5 text-sm text-gray-500">
            Enter the email address you used at checkout and your order ID to retrieve your order.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Order ID</label>
              <input
                type="text"
                required
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Paste the order ID from your confirmation page"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
              />
              <p className="mt-1 text-xs text-gray-400">
                Found in the URL of your order confirmation page: /orders/&#123;order-id&#125;
              </p>
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" loading={loading} className="w-full">
              <Search className="mr-2 h-4 w-4" />
              Look up order
            </Button>
          </form>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Order found</p>
              <OrderStatusBadge status={result.status as never} />
            </div>

            <div className="mt-3 space-y-2">
              {result.payment_status === "paid" && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Payment confirmed
                </div>
              )}
              {result.pickup_time && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="h-4 w-4 text-gray-400" />
                  Pickup: <strong>{formatPickupTime(result.pickup_time)}</strong>
                </div>
              )}
              <p className="text-sm text-gray-700">
                Total: <strong>{formatNGN(koboToNaira(result.amount_kobo))}</strong>
              </p>
            </div>

            <Link href={`/orders/${result.id}`} className="mt-4 block">
              <Button className="w-full" variant="outline">
                View full order details
              </Button>
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
