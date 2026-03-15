"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Order } from "@/types/database.types";

export function useRealtimeOrders(vendorId: string | null) {
  const supabase = getSupabaseBrowserClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vendorId) return;

    // Initial fetch — includes pending, confirmed, preparing, ready
    supabase
      .from("orders")
      .select("*")
      .eq("vendor_id", vendorId)
      .not("status", "in", '("completed","cancelled","awaiting_payment")')
      .order("created_at", { ascending: false })
      .then(({ data }: { data: Order[] | null }) => {
        setOrders(data ?? []);
        setLoading(false);
      });

    // Realtime subscription
    const channel = supabase
      .channel(`vendor-orders-${vendorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `vendor_id=eq.${vendorId}`,
        },
        (payload: RealtimePostgresChangesPayload<Order>) => {
          if (payload.eventType === "INSERT") {
            setOrders((prev) => [payload.new as Order, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === (payload.new as Order).id ? (payload.new as Order) : o
              )
            );
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) =>
              prev.filter((o) => o.id !== (payload.old as Order).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId]);

  return { orders, loading };
}
