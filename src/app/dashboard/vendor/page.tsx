import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { vendorDashboardLinks } from "@/config/nav";
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, Settings } from "lucide-react";
import { formatNGN } from "@/lib/utils/currency";
import { koboToNaira } from "@/lib/utils/currency";
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
    .select("id, amount_kobo, status")
    .eq("vendor_id", vendor.id)
    .gte("created_at", `${today}T00:00:00`)
    .lte("created_at", `${today}T23:59:59`);

  const paid = (todayOrders ?? []).filter((o) => o.status !== "awaiting_payment" && o.status !== "cancelled");
  const pending = (todayOrders ?? []).filter((o) => o.status === "confirmed" || o.status === "preparing");
  const revenue = paid.reduce((sum, o) => sum + koboToNaira(o.amount_kobo), 0);

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar links={navLinks} title="Vendor" />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {vendor.name}</h1>
        <p className="mt-1 text-sm text-gray-500">Today&apos;s overview</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Today's Revenue", value: formatNGN(revenue) },
            { label: "Active Orders", value: pending.length },
            { label: "Total Orders Today", value: paid.length },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/dashboard/vendor/orders" className="flex-1 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900">Manage Orders</h3>
            <p className="mt-1 text-sm text-gray-500">View and update order status in real-time</p>
          </Link>
          <Link href="/dashboard/vendor/menu" className="flex-1 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900">Menu Manager</h3>
            <p className="mt-1 text-sm text-gray-500">Add, edit, or toggle availability of items</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
