import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { adminDashboardLinks } from "@/config/nav";
import { formatNGN } from "@/lib/utils/currency";
import { koboToNaira } from "@/lib/utils/currency";

export const metadata: Metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const admin = getSupabaseAdminClient();

  // Platform totals
  const { data: orders } = await admin
    .from("orders")
    .select("amount_kobo, status, vendor_id, created_at, vendors(name)")
    .eq("payment_status", "paid");

  const totalRevenue = (orders ?? []).reduce((sum, o) => sum + koboToNaira(o.amount_kobo), 0);

  // Top vendors by order count
  const vendorCounts = new Map<string, { name: string; count: number; revenue: number }>();
  (orders ?? []).forEach((o) => {
    const name = (o.vendors as unknown as { name: string } | null)?.name ?? o.vendor_id;
    const key = o.vendor_id;
    const existing = vendorCounts.get(key) ?? { name, count: 0, revenue: 0 };
    vendorCounts.set(key, {
      name,
      count: existing.count + 1,
      revenue: existing.revenue + koboToNaira(o.amount_kobo),
    });
  });
  const topVendors = [...vendorCounts.values()].sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar links={adminDashboardLinks} title="Admin" />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 mb-6 text-sm text-gray-500">Platform performance overview</p>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Revenue (paid orders)</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{formatNGN(totalRevenue)}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Paid Orders</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{orders?.length ?? 0}</p>
          </div>
        </div>

        <h2 className="mb-3 text-lg font-bold text-gray-900">Top Vendors</h2>
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topVendors.map((v, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
                  <td className="px-4 py-3 text-gray-700">{v.count}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatNGN(v.revenue)}</td>
                </tr>
              ))}
              {topVendors.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-400">No data yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
