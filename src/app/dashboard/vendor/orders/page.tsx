"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { vendorDashboardLinks } from "@/config/nav";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatNGN } from "@/lib/utils/currency";
import { koboToNaira } from "@/lib/utils/currency";
import { formatPickupTime } from "@/lib/utils/date";
import { useRealtimeOrders } from "@/hooks/use-realtime-orders";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { OrderStatus } from "@/types/database.types";

const STATUS_FLOW: Record<string, OrderStatus | null> = {
  confirmed: "preparing",
  preparing: "ready",
  ready: "completed",
  completed: null,
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Start Preparing",
  preparing: "Mark Ready",
  ready: "Mark Completed",
};

export default function VendorOrdersPage() {
  const supabase = getSupabaseBrowserClient();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const { orders, loading } = useRealtimeOrders(vendorId);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }: { data: { user: User | null } }) => {
      if (!data.user) return;
      const { data: vendor } = await supabase
        .from("vendors")
        .select("id")
        .eq("owner_id", data.user.id)
        .single();
      setVendorId(vendor?.id ?? null);
    });
  }, []);

  async function updateStatus(orderId: string, currentStatus: string) {
    const next = STATUS_FLOW[currentStatus];
    if (!next) return;
    setUpdating(orderId);
    await supabase.from("orders").update({ status: next }).eq("id", orderId);
    setUpdating(null);
  }

  const columns: { label: string; statuses: string[] }[] = [
    { label: "Confirmed", statuses: ["confirmed"] },
    { label: "Preparing", statuses: ["preparing"] },
    { label: "Ready", statuses: ["ready"] },
  ];

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar links={vendorDashboardLinks} title="Vendor" />
      <main className="flex-1 overflow-x-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">Live updates via Supabase Realtime</p>

        {loading ? (
          <div className="mt-10 flex justify-center"><Spinner /></div>
        ) : orders.length === 0 ? (
          <div className="mt-10 text-center text-gray-500">No active orders right now</div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {columns.map(({ label, statuses }) => {
              const columnOrders = orders.filter((o) => statuses.includes(o.status));
              return (
                <div key={label}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-700">{label}</h2>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      {columnOrders.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {columnOrders.map((order) => (
                      <div key={order.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-mono text-gray-400">#{order.id.slice(-6).toUpperCase()}</p>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="mt-2 text-sm font-semibold text-gray-800">{order.customer_name}</p>
                        <p className="text-xs text-gray-500">{order.customer_phone || order.customer_email}</p>
                        {order.pickup_time && (
                          <p className="mt-1 text-xs text-brand-600">
                            Pickup: {formatPickupTime(order.pickup_time)}
                          </p>
                        )}
                        <p className="mt-2 font-bold text-gray-900">{formatNGN(koboToNaira(order.amount_kobo))}</p>
                        {order.notes && (
                          <p className="mt-1 text-xs text-gray-400 italic">{order.notes}</p>
                        )}
                        {STATUS_LABELS[order.status] && (
                          <Button
                            className="mt-3 w-full"
                            size="sm"
                            loading={updating === order.id}
                            onClick={() => updateStatus(order.id, order.status)}
                          >
                            {STATUS_LABELS[order.status]}
                          </Button>
                        )}
                      </div>
                    ))}
                    {columnOrders.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                        No orders
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
