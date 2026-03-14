import { redirect } from "next/navigation";
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, Settings } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { vendorDashboardLinks } from "@/config/nav";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { VendorSettingsForm } from "@/components/vendor/vendor-settings-form";
import type { Vendor } from "@/types/database.types";

const navLinks = vendorDashboardLinks.map((link, i) => ({
  ...link,
  icon: [
    <LayoutDashboard key={0} className="h-4 w-4" />,
    <UtensilsCrossed key={1} className="h-4 w-4" />,
    <ShoppingBag key={2} className="h-4 w-4" />,
    <Settings key={3} className="h-4 w-4" />,
  ][i],
}));

export default async function VendorSettingsPage() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!vendor) {
    redirect("/dashboard/vendor");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar links={navLinks} title="Vendor" vendorName={(vendor as Vendor).name} />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 mb-6 text-sm text-gray-500">
          Manage your vendor profile, hours, and storefront visibility.
        </p>
        <VendorSettingsForm vendor={vendor as Vendor} />
      </main>
    </div>
  );
}
