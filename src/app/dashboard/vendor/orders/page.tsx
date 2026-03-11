"use client";

import { useEffect, useState } from "react";
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
import type { Order, OrderStatus } from "@/types/database.types";

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

const COLUMN_CONFIG: {
  label: string;
  statuses: string[];
  dot: string;
  badgeBg: string;
  badgeText: string;
  readonly?: boolean;
}[] = [
  {
    label: "Confirmed",
    statuses: ["confirmed"],
    dot: "bg-yellow-400",
    badgeBg: "bg-yellow-50",
    badgeText: "text-yellow-700",
  },
  {
    label: "Preparing",
    statuses: ["preparing"],
    dot: "bg-blue-400",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
  },
  {
    label: "Ready",
    statuses: ["ready"],
    dot: "bg-green-400",
    badgeBg: "bg-green-50",
    badgeText: "text-green-700",
  },
  {
    label: "Completed today",
    statuses: ["completed"],
    dot: "bg-gray-300",
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-500",
    readonly: true,
  },
];

export default function VendorOrdersPage() {
  const supabase = getSupabaseBrowserClient();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [completedToday, setCompletedToday] = useState<Order[]>([]);
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

  // Fetch completed orders for today separately (realtime hook excludes them)
  useEffect(() => {
    if (!vendorId) return;
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("orders")
      .select("*")
      .eq("vendor_id", vendorId)
      .eq("status", "completed")
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`)
      .order("created_at", { ascending: false })
      .then(({ data }: { data: Order[] | null }) => {
        setCompletedToday(data ?? []);
      });
  }, [vendorId]);

  // Keep completedToday in sync when an order transitions to completed
  useEffect(() => {
    // orders from realtime hook does not include completed; listen for status changes
    // handled via completedToday state above; re-fetch when orders change
    // (simple approach: orders array changes trigger re-check)
  }, [orders]);

  async function updateStatus(orderId: string, currentStatus: string) {
    const next = STATUS_FLOW[currentStatus];
    if (!next) return;
    setUpdating(orderId);
    await supabase.from("orders").update({ status: next }).eq("id", orderId);
    // If transitioning to completed, fetch completed list again
    if (next === "completed" && vendorId) {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("vendor_id", vendorId)
        .eq("status", "completed")
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`)
        .order("created_at", { ascending: false });
      setCompletedToday((data as Order[]) ?? []);
    }
    setUpdating(null);
  }

  const allActive = orders.filter((o) =>
    ["confirmed", "preparing", "ready"].includes(o.status)
  );

  const getColumnOrders = (col: (typeof COLUMN_CONFIG)[number]) => {
    if (col.readonly) return completedToday;
    return orders.filter((o) => col.statuses.includes(o.status));
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar links={vendorDashboardLinks} title="Vendor" />
      <main className="flex-1 overflow-x-auto p-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="mt-1 text-sm text-gray-500">Live updates via Supabase Realtime</p>
          </div>
          {!loading && (
            <div className="rounded-xl bg-white border border-gray-100 px-4 py-2 shadow-sm">
              <span className="text-sm text-gray-500">Active orders: </span>
              <span className="text-sm font-bold text-gray-900">{allActive.length}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="mt-10 flex justify-center"><Spinner /></div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-4">
            {COLUMN_CONFIG.map((col) => {
              const columnOrders = getColumnOrders(col);
              return (
                <div key={col.label}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                      <h2 className="font-semibold text-gray-700">{col.label}</h2>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${col.badgeBg} ${col.badgeText}`}
                    >
                      {columnOrders.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {columnOrders.map((order) => (
                      <div
                        key={order.id}
                        className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ${col.readonly ? "opacity-75" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-xs text-gray-400">
                            #{order.id.slice(-6).toUpperCase()}
                          </p>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="mt-2 text-sm font-semibold text-gray-800">{order.customer_name}</p>
                        <p className="text-xs text-gray-500">{order.customer_phone || order.customer_email}</p>
                        {order.pickup_time && (
                          <p className="mt-1 text-xs text-brand-600">
                            Pickup: {formatPickupTime(order.pickup_time)}
                          </p>
                        )}
                        <div className="my-3 border-t border-gray-100" />
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-gray-900">
                            {formatNGN(koboToNaira(order.amount_kobo))}
                          </p>
                        </div>
                        {order.notes && (
                          <p className="mt-1 text-xs italic text-gray-400">{order.notes}</p>
                        )}
                        {!col.readonly && STATUS_LABELS[order.status] && (
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
                      <div
                        className={`rounded-2xl border border-dashed p-6 text-center text-sm ${
                          col.readonly
                            ? "border-gray-200 text-gray-300"
                            : "border-gray-200 text-gray-400"
                        }`}
                      >
                        {col.readonly ? "None completed yet" : "No orders"}
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
