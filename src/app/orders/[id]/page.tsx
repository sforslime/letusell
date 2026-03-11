"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Clock, MapPin, ArrowLeft, Link2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { formatNGN } from "@/lib/utils/currency";
import { koboToNaira } from "@/lib/utils/currency";
import { formatPickupTime } from "@/lib/utils/date";
import type { OrderWithItems } from "@/types/database.types";
import { use, useCallback } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderConfirmationPage({ params }: PageProps) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function fetchOrder() {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) {
        setError("Order not found");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setOrder(data);
      setLoading(false);

      // If payment still pending, poll — and proactively verify with Paystack
      if (data.payment_status === "pending" || data.status === "awaiting_payment") {
        // Trigger a server-side verify immediately (handles case where webhook hasn't fired yet)
        fetch(`/api/orders/${id}/verify`, { method: "POST" }).catch(() => null);

        interval = setInterval(async () => {
          const r = await fetch(`/api/orders/${id}`);
          if (r.ok) {
            const updated = await r.json();
            setOrder(updated);
            if (updated.status !== "awaiting_payment" && updated.payment_status !== "pending") {
              clearInterval(interval);
            } else {
              // Re-verify on each poll in case previous verify hadn't settled
              fetch(`/api/orders/${id}/verify`, { method: "POST" }).catch(() => null);
            }
          }
        }, 3000);
      }
    }

    fetchOrder();
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center py-24">
          <Spinner className="h-8 w-8" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg font-semibold text-gray-700">Order not found</p>
          <Link href="/" className="mt-4 inline-block">
            <Button>Go home</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isPaid = order.payment_status === "paid";
  const isPending = order.status === "awaiting_payment";

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-6 text-center">
          {isPending ? (
            <>
              <Spinner className="mx-auto h-10 w-10" />
              <h1 className="mt-4 text-xl font-bold text-gray-900">Waiting for payment confirmation...</h1>
              <p className="mt-1 text-sm text-gray-500">This updates automatically</p>
            </>
          ) : isPaid ? (
            <>
              <CheckCircle className="mx-auto h-14 w-14 text-green-500" />
              <h1 className="mt-3 text-2xl font-bold text-gray-900">Order confirmed!</h1>
              <p className="mt-1 text-sm text-gray-500">Your food is being prepared</p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</h1>
            </>
          )}
        </div>

        {/* Status + details */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Status</p>
            <OrderStatusBadge status={order.status} />
          </div>

          {order.pickup_time && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
              <Clock className="h-4 w-4 text-gray-400" />
              {(() => {
                const minsLeft = Math.round((new Date(order.pickup_time).getTime() - Date.now()) / 60_000);
                if (minsLeft <= 0) return <span>Ready for pickup</span>;
                return <span>Ready in approx. <strong>{minsLeft} min</strong></span>;
              })()}
            </div>
          )}

          {order.vendor && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-700">
              <MapPin className="h-4 w-4 text-gray-400" />
              {order.vendor.name}
              {order.vendor.location_text && ` · ${order.vendor.location_text}`}
            </div>
          )}

          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Items</p>
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-gray-700">
                  {item.quantity}× {item.item_name}
                </span>
                <span className="font-medium">{formatNGN(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 border-t border-gray-100 pt-3 flex items-center justify-between font-bold">
            <span>Total</span>
            <span>{formatNGN(koboToNaira(order.amount_kobo))}</span>
          </div>
        </div>

        {/* Guest save-link prompt */}
        {!order.user_id && isPaid && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">Save your order link</p>
            <p className="mt-0.5 text-xs text-amber-700">
              You placed this as a guest. Bookmark this page or copy the link below to track your order later.
            </p>
            <button
              onClick={copyLink}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-50 transition-colors"
            >
              <Link2 className="h-3.5 w-3.5" />
              {linkCopied ? "Link copied!" : "Copy order link"}
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <Link href="/vendors">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Order more food
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
