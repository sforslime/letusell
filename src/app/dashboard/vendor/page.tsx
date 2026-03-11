import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { vendorDashboardLinks } from "@/config/nav";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { formatNGN } from "@/lib/utils/currency";
import { koboToNaira } from "@/lib/utils/currency";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import type { OrderStatus } from "@/types/database.types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Vendor Dashboard" };

const navLinks = vendorDashboardLinks.map((link, i) => ({
  ...link,
  icon: [
    <LayoutDashboard key={0} className="h-4 w-4" />,
    <UtensilsCrossed key={1} className="h-4 w-4" />,
    <ShoppingBag key={2} className="h-4 w-4" />,
    <Settings key={3} className="h-4 w-4" />,
  ][i],
}));

export default async function VendorDashboardPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "vendor" && profile.role !== "admin")) {
    redirect("/");
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, name, rating, review_count")
    .eq("owner_id", user.id)
    .single();

  if (!vendor) {
    return (
      <div className="flex min-h-screen">
        <DashboardSidebar links={navLinks} title="Vendor" />
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">No vendor account found</h2>
            <p className="mt-2 text-gray-500">Contact admin to set up your vendor profile.</p>
          </div>
        </div>
      </div>
    );
  }

  // Today's stats
  const today = new Date().toISOString().slice(0, 10);
  const { data: todayOrders } = await supabase
    .from("orders")
    .select("id, amount_kobo, status, customer_name")
    .eq("vendor_id", vendor.id)
    .gte("created_at", `${today}T00:00:00`)
    .lte("created_at", `${today}T23:59:59`);

  const paid = (todayOrders ?? []).filter((o) => o.status !== "awaiting_payment" && o.status !== "cancelled");
  const pending = (todayOrders ?? []).filter((o) => o.status === "confirmed" || o.status === "preparing");
  const completed = (todayOrders ?? []).filter((o) => o.status === "completed");
  const revenue = paid.reduce((sum, o) => sum + koboToNaira(o.amount_kobo), 0);

  const recentOrders = (todayOrders ?? []).slice(0, 5);

  const stats = [
    {
      label: "Today's Revenue",
      value: formatNGN(revenue),
      icon: <TrendingUp className="h-5 w-5 text-brand-600" />,
      borderColor: "border-brand-500",
      bgColor: "bg-brand-50",
    },
    {
      label: "Active Orders",
      value: pending.length,
      icon: <Clock className="h-5 w-5 text-yellow-600" />,
      borderColor: "border-yellow-400",
      bgColor: "bg-yellow-50",
    },
    {
      label: "Completed Today",
      value: completed.length,
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      borderColor: "border-green-500",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar links={navLinks} title="Vendor" vendorName={vendor.name} />
      <main className="flex-1 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {vendor.name}</h1>
          <p className="mt-1 text-sm text-gray-500">Today&apos;s overview</p>
        </div>

        {/* Stats cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl border-l-4 border border-gray-100 bg-white p-5 shadow-sm ${stat.borderColor}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Quick actions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/dashboard/vendor/orders"
              className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-brand-50 p-3">
                  <ShoppingBag className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Manage Orders</h3>
                  <p className="mt-0.5 text-sm text-gray-500">View and update order status in real-time</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500" />
            </Link>
            <Link
              href="/dashboard/vendor/menu"
              className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-orange-50 p-3">
                  <UtensilsCrossed className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Menu Manager</h3>
                  <p className="mt-0.5 text-sm text-gray-500">Add, edit, or toggle availability of items</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500" />
            </Link>
          </div>
        </div>

        {/* Today's orders mini-list */}
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Today&apos;s orders</h2>
            <Link
              href="/dashboard/vendor/orders"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View all &rarr;
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No orders yet today</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between px-5 py-3.5">
                  <p className="text-sm font-medium text-gray-800">{order.customer_name}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatNGN(koboToNaira(order.amount_kobo))}
                    </span>
                    <OrderStatusBadge status={order.status as OrderStatus} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
