import { notFound } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatNGN } from "@/lib/utils/currency";
import { koboToNaira } from "@/lib/utils/currency";
import { formatPickupTime } from "@/lib/utils/date";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order Receipt" };

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = getSupabaseAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select(`
      id, status, payment_status, amount_kobo, pickup_time,
      customer_name, customer_email, notes, created_at,
      order_items (id, item_name, item_price, quantity, subtotal, notes, modifiers),
      vendors (id, name, slug, location_text)
    `)
    .eq("id", id)
    .single();

  if (!order) notFound();

  const vendor = Array.isArray(order.vendors) ? order.vendors[0] : order.vendors;
  const items = order.order_items ?? [];
  const orderDate = new Date(order.created_at).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 flex items-start justify-center py-10 px-4 print:bg-white print:py-0">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-sm print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="border-b border-gray-100 px-6 py-5 text-center">
            <p className="text-lg font-bold text-gray-900">LetuSell</p>
            <p className="text-sm text-gray-500">{vendor?.name}</p>
            {vendor?.location_text && (
              <p className="text-xs text-gray-400">{vendor.location_text}</p>
            )}
          </div>

          {/* Order info */}
          <div className="border-b border-dashed border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Order</span>
              <span className="font-mono font-semibold text-gray-800">#{order.id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="text-gray-800">{orderDate}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-gray-500">Customer</span>
              <span className="text-gray-800">{order.customer_name}</span>
            </div>
            {order.pickup_time && (
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-gray-500">Pickup</span>
                <span className="text-gray-800">{formatPickupTime(order.pickup_time)}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border-b border-dashed border-gray-200 px-6 py-4">
            {items.map((item) => {
              const modifiers = (item.modifiers ?? []) as { name: string; priceAdjustment: number }[];
              return (
                <div key={item.id} className="mb-3 last:mb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {item.quantity}× {item.item_name}
                      </p>
                      {modifiers.length > 0 && (
                        <p className="text-xs text-gray-400">
                          {modifiers.map((m) => m.name).join(", ")}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-xs italic text-gray-400">{item.notes}</p>
                      )}
                    </div>
                    <p className="ml-4 text-sm font-medium text-gray-800">
                      {formatNGN(item.item_price * item.quantity + modifiers.reduce((s, m) => s + m.priceAdjustment * item.quantity, 0))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-900">Total</p>
              <p className="text-lg font-bold text-gray-900">{formatNGN(koboToNaira(order.amount_kobo))}</p>
            </div>
            {order.notes && (
              <p className="mt-2 text-xs italic text-gray-400">Note: {order.notes}</p>
            )}
          </div>

          {/* Print button */}
          <div className="no-print border-t border-gray-100 px-6 py-4 text-center">
            <button
              onClick={() => window.print()}
              className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
            >
              Print receipt
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
