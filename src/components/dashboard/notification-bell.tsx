"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatNGN } from "@/lib/utils/currency";
import { koboToNaira } from "@/lib/utils/currency";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Order } from "@/types/database.types";

interface NotificationBellProps {
  vendorId: string;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
}

export function NotificationBell({ vendorId, onAccept, onReject }: NotificationBellProps) {
  const supabase = getSupabaseBrowserClient();
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [open, setOpen] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("orders")
      .select("*")
      .eq("vendor_id", vendorId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .then(({ data }: { data: Order[] | null }) => setPendingOrders(data ?? []));

    const channel = supabase
      .channel(`notif-bell-${vendorId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `vendor_id=eq.${vendorId}` },
        (payload: RealtimePostgresChangesPayload<Order>) => {
          const newOrder = payload.new as Order;
          const oldOrder = payload.old as Order;
          if (payload.eventType === "INSERT" && newOrder.status === "pending") {
            setPendingOrders((prev) => [newOrder, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setPendingOrders((prev) =>
              newOrder.status === "pending"
                ? prev.map((o) => (o.id === newOrder.id ? newOrder : o))
                : prev.filter((o) => o.id !== newOrder.id)
            );
          } else if (payload.eventType === "DELETE") {
            setPendingOrders((prev) => prev.filter((o) => o.id !== oldOrder.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [vendorId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleAccept(orderId: string) {
    setActing(orderId);
    await supabase.from("orders").update({ status: "confirmed" }).eq("id", orderId);
    onAccept(orderId);
    setActing(null);
  }

  async function handleReject(orderId: string) {
    setActing(orderId);
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
    onReject(orderId);
    setActing(null);
  }

  const count = pendingOrders.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-gray-100 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">
              Pending orders {count > 0 && `(${count})`}
            </p>
          </div>
          {count === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">No pending orders</p>
          ) : (
            <ul className="max-h-96 divide-y divide-gray-50 overflow-y-auto">
              {pendingOrders.map((order) => (
                <li key={order.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{order.customer_name}</p>
                      <p className="text-xs text-gray-500">
                        #{order.id.slice(-6).toUpperCase()} &middot; {formatNGN(koboToNaira(order.amount_kobo))}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(order.id)}
                        disabled={acting === order.id}
                        className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(order.id)}
                        disabled={acting === order.id}
                        className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
