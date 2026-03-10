import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { adminDashboardLinks } from "@/config/nav";
import { formatNGN } from "@/lib/utils/currency";
import { koboToNaira } from "@/lib/utils/currency";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const [
    { count: totalVendors },
    { count: pendingVendors },
    { count: totalOrders },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from("vendors").select("id", { count: "exact", head: true }).eq("is_approved", true),
    supabase.from("vendors").select("id", { count: "exact", head: true }).eq("is_approved", false),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id, customer_name, amount_kobo, status, created_at, vendors(name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar links={adminDashboardLinks} title="Admin" />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Platform overview</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Active Vendors", value: totalVendors ?? 0 },
            { label: "Pending Approvals", value: pendingVendors ?? 0, highlight: (pendingVendors ?? 0) > 0 },
            { label: "Total Orders", value: totalOrders ?? 0 },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl border p-5 shadow-sm ${stat.highlight ? "border-amber-200 bg-amber-50" : "border-gray-100 bg-white"}`}
            >
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {(pendingVendors ?? 0) > 0 && (
          <Link
            href="/dashboard/admin/vendors"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
          >
            Review pending vendors →
          </Link>
        )}

        <div className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-gray-900">Recent orders</h2>
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(recentOrders ?? []).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{order.customer_name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {(order.vendors as unknown as { name: string } | null)?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">{formatNGN(koboToNaira(order.amount_kobo))}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
