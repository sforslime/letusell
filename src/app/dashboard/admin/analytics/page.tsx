import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { adminDashboardLinks } from "@/config/nav";
import { formatNGN, koboToNaira } from "@/lib/utils/currency";
import { LayoutDashboard, Store, ShoppingBag, BarChart2, TrendingUp, Award } from "lucide-react";

export const metadata: Metadata = { title: "Analytics" };
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

export default async function AdminAnalyticsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const admin = getSupabaseAdminClient();

  const [{ data: paidOrders }, { data: allOrders }] = await Promise.all([
    admin
      .from("orders")
      .select("amount_kobo, vendor_id, created_at, vendors(name)")
      .eq("payment_status", "paid"),
    admin
      .from("orders")
      .select("status")
      .neq("status", "awaiting_payment"),
  ]);

  const totalRevenue = (paidOrders ?? []).reduce((sum, o) => sum + koboToNaira(o.amount_kobo), 0);
  const totalPaid = paidOrders?.length ?? 0;
  const avgOrderValue = totalPaid > 0 ? totalRevenue / totalPaid : 0;
  const completedCount = (allOrders ?? []).filter((o) => o.status === "completed").length;
  const cancelledCount = (allOrders ?? []).filter((o) => o.status === "cancelled").length;

  // Top vendors by revenue
  const vendorMap = new Map<string, { name: string; count: number; revenue: number }>();
  (paidOrders ?? []).forEach((o) => {
    const name = (o.vendors as unknown as { name: string } | null)?.name ?? o.vendor_id;
    const existing = vendorMap.get(o.vendor_id) ?? { name, count: 0, revenue: 0 };
    vendorMap.set(o.vendor_id, {
      name,
      count: existing.count + 1,
      revenue: existing.revenue + koboToNaira(o.amount_kobo),
    });
  });
  const topVendors = [...vendorMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const maxRevenue = topVendors[0]?.revenue ?? 1;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar links={navLinks} title="Admin" />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Platform performance overview</p>
        </div>

        {/* Summary stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total Revenue",
              value: formatNGN(totalRevenue),
              icon: <TrendingUp className="h-5 w-5 text-brand-600" />,
              bg: "bg-brand-50",
              border: "border-l-brand-500",
            },
            {
              label: "Paid Orders",
              value: totalPaid,
              icon: <ShoppingBag className="h-5 w-5 text-purple-600" />,
              bg: "bg-purple-50",
              border: "border-l-purple-500",
            },
            {
              label: "Avg. Order Value",
              value: formatNGN(avgOrderValue),
              icon: <BarChart2 className="h-5 w-5 text-blue-600" />,
              bg: "bg-blue-50",
              border: "border-l-blue-500",
            },
            {
              label: "Completed",
              value: completedCount,
              icon: <Award className="h-5 w-5 text-green-600" />,
              bg: "bg-green-50",
              border: "border-l-green-500",
              sub: cancelledCount > 0 ? `${cancelledCount} cancelled` : undefined,
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-2xl border border-gray-100 border-l-4 ${s.border} bg-white p-5 shadow-sm`}
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                {s.icon}
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
              <p className="mt-0.5 text-sm text-gray-500">{s.label}</p>
              {s.sub && <p className="mt-0.5 text-xs text-gray-400">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Top vendors */}
        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-900">Top vendors by revenue</h2>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {topVendors.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">No data yet</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {topVendors.map((v, i) => (
                  <div key={i} className="flex items-center gap-5 px-5 py-4 hover:bg-gray-50/50">
                    {/* Rank */}
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                      i === 0 ? "bg-yellow-100 text-yellow-700" :
                      i === 1 ? "bg-gray-100 text-gray-600" :
                      i === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-gray-50 text-gray-400"
                    }`}>
                      {i + 1}
                    </div>

                    {/* Name + bar */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="font-semibold text-gray-900 truncate">{v.name}</p>
                        <div className="ml-4 flex items-center gap-3 flex-shrink-0 text-sm">
                          <span className="text-gray-500">{v.count} orders</span>
                          <span className="font-bold text-gray-900">{formatNGN(v.revenue)}</span>
                        </div>
                      </div>
                      {/* Revenue bar */}
                      <div className="h-1.5 w-full rounded-full bg-gray-100">
                        <div
                          className="h-1.5 rounded-full bg-brand-500"
                          style={{ width: `${(v.revenue / maxRevenue) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
