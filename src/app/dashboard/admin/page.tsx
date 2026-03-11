import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { adminDashboardLinks } from "@/config/nav";
import { formatNGN, koboToNaira } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import {
  LayoutDashboard, Store, ShoppingBag, BarChart2,
  TrendingUp, AlertTriangle, Users, ArrowRight, CheckCircle,
} from "lucide-react";
import type { OrderStatus } from "@/types/database.types";

export const metadata: Metadata = { title: "Admin Dashboard" };
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

export default async function AdminDashboardPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const admin = getSupabaseAdminClient();

  const [
    { count: totalVendors },
    { count: pendingVendors },
    { count: totalOrders },
    { count: totalUsers },
    { data: recentOrders },
    { data: paidOrders },
  ] = await Promise.all([
    admin.from("vendors").select("id", { count: "exact", head: true }).eq("is_approved", true),
    admin.from("vendors").select("id", { count: "exact", head: true }).eq("is_approved", false).eq("is_active", true),
    admin.from("orders").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user"),
    admin
      .from("orders")
      .select("id, customer_name, customer_email, amount_kobo, status, payment_status, created_at, vendors(name)")
      .order("created_at", { ascending: false })
      .limit(8),
    admin
      .from("orders")
      .select("amount_kobo")
      .eq("payment_status", "paid"),
  ]);

  const totalRevenue = (paidOrders ?? []).reduce((sum, o) => sum + koboToNaira(o.amount_kobo), 0);

  const stats = [
    {
      label: "Total Revenue",
      value: formatNGN(totalRevenue),
      icon: <TrendingUp className="h-5 w-5 text-brand-600" />,
      bg: "bg-brand-50",
      border: "border-l-brand-500",
    },
    {
      label: "Active Vendors",
      value: totalVendors ?? 0,
      icon: <Store className="h-5 w-5 text-blue-600" />,
      bg: "bg-blue-50",
      border: "border-l-blue-500",
    },
    {
      label: "Total Orders",
      value: totalOrders ?? 0,
      icon: <ShoppingBag className="h-5 w-5 text-purple-600" />,
      bg: "bg-purple-50",
      border: "border-l-purple-500",
    },
    {
      label: "Registered Users",
      value: totalUsers ?? 0,
      icon: <Users className="h-5 w-5 text-orange-600" />,
      bg: "bg-orange-50",
      border: "border-l-orange-500",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar links={navLinks} title="Admin" />
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Platform overview</p>
        </div>

        {/* Pending approval alert */}
        {(pendingVendors ?? 0) > 0 && (
          <Link
            href="/dashboard/admin/vendors"
            className="mb-6 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 transition-colors hover:bg-amber-100"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900">
                  {pendingVendors} vendor{(pendingVendors ?? 0) > 1 ? "s" : ""} awaiting approval
                </p>
                <p className="text-xs text-amber-700">Review and approve to make them live</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-amber-600" />
          </Link>
        )}

        {/* Stats grid */}
        <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`rounded-2xl border border-gray-100 border-l-4 ${s.border} bg-white p-5 shadow-sm`}
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                {s.icon}
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
              <p className="mt-0.5 text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick nav */}
        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          {[
            { href: "/dashboard/admin/vendors", icon: <Store className="h-5 w-5 text-brand-600" />, label: "Manage Vendors", desc: "Approve, reject or remove vendors" },
            { href: "/dashboard/admin/orders", icon: <ShoppingBag className="h-5 w-5 text-purple-600" />, label: "All Orders", desc: "Browse every order on the platform" },
            { href: "/dashboard/admin/analytics", icon: <BarChart2 className="h-5 w-5 text-blue-600" />, label: "Analytics", desc: "Revenue and top vendor breakdown" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-brand-100"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 group-hover:bg-brand-50 transition-colors">
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{item.label}</p>
                <p className="mt-0.5 text-xs text-gray-500">{item.desc}</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 flex-shrink-0 text-gray-300 group-hover:text-brand-500 transition-colors" />
            </Link>
          ))}
        </div>

        {/* Recent orders */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent orders</h2>
            <Link href="/dashboard/admin/orders" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {(!recentOrders || recentOrders.length === 0) ? (
              <div className="py-12 text-center text-sm text-gray-400">No orders yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Vendor</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50">
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
                        <OrderStatusBadge status={order.status as OrderStatus} />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
