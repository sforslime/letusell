import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { adminDashboardLinks } from "@/config/nav";
import { formatNGN, koboToNaira } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { LayoutDashboard, Store, ShoppingBag, BarChart2 } from "lucide-react";
import type { OrderStatus } from "@/types/database.types";

export const metadata: Metadata = { title: "All Orders" };
export const dynamic = "force-dynamic";

const navLinks = adminDashboardLinks.map((link, i) => ({
  ...link,
  icon: [
    <LayoutDashboard key={0} className="h-4 w-4" />,
    <Store key={1} className="h-4 w-4" />,
    <ShoppingBag key={2} className="h-4 w-4" />,
    <BarChart2 key={3} className="h-4 w-4" />,
  ][i],
}));

const paymentStyles: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
  pending: "bg-yellow-100 text-yellow-700",
};

export default async function AdminOrdersPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const admin = getSupabaseAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select("id, customer_name, customer_email, amount_kobo, status, payment_status, created_at, vendors(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const totalRevenue = (orders ?? [])
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + koboToNaira(o.amount_kobo), 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar links={navLinks} title="Admin" />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">All Orders</h1>
            <p className="mt-1 text-sm text-gray-500">
              {orders?.length ?? 0} orders · {formatNGN(totalRevenue)} collected
            </p>
          </div>
          {/* Status summary pills */}
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            {["confirmed", "preparing", "ready", "completed", "cancelled"].map((s) => {
              const count = (orders ?? []).filter((o) => o.status === s).length;
              if (count === 0) return null;
              return (
                <span key={s} className="rounded-full bg-white border border-gray-200 px-3 py-1 text-gray-600 shadow-sm">
                  {count} {s}
                </span>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {(!orders || orders.length === 0) ? (
            <div className="py-16 text-center text-sm text-gray-400">No orders yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Vendor</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Payment</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 font-mono text-xs font-medium text-gray-400">
                        #{order.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{order.customer_name}</p>
                        <p className="text-xs text-gray-400">{order.customer_email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {(order.vendors as unknown as { name: string } | null)?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900">
                        {formatNGN(koboToNaira(order.amount_kobo))}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${paymentStyles[order.payment_status] ?? "bg-gray-100 text-gray-600"}`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <OrderStatusBadge status={order.status as OrderStatus} />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
