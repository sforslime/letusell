"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Clock, MapPin, ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { formatNGN } from "@/lib/utils/currency";
import { koboToNaira } from "@/lib/utils/currency";
import { formatPickupTime } from "@/lib/utils/date";
import type { OrderWithItems } from "@/types/database.types";
import { use } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderConfirmationPage({ params }: PageProps) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Keep polling if payment still pending
      if (data.payment_status === "pending" || data.status === "awaiting_payment") {
        interval = setInterval(async () => {
          const r = await fetch(`/api/orders/${id}`);
          if (r.ok) {
            const updated = await r.json();
            setOrder(updated);
            if (updated.status !== "awaiting_payment" && updated.payment_status !== "pending") {
              clearInterval(interval);
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
              Pickup: <strong>{formatPickupTime(order.pickup_time)}</strong>
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
