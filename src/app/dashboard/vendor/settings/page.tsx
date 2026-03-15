import { redirect } from "next/navigation";
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, Settings } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { vendorDashboardLinks } from "@/config/nav";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { VendorSettingsForm } from "@/components/vendor/vendor-settings-form";
import { BusinessHoursForm } from "@/components/vendor/business-hours-form";
import { SpecialClosuresForm } from "@/components/vendor/special-closures-form";
import { PayoutSettingsForm } from "@/components/vendor/payout-settings-form";
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
        <div className="max-w-lg space-y-5">
          <VendorSettingsForm vendor={vendor as Vendor} />

          {/* Business Hours */}
          <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Business hours</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Set your opening hours for each day of the week.
              </p>
            </div>
            <div className="p-6">
              <BusinessHoursForm vendorId={(vendor as Vendor).id} />
            </div>
          </section>

          {/* Special Closures */}
          <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Special closures</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Mark specific dates when you will be closed (holidays, etc.).
              </p>
            </div>
            <div className="p-6">
              <SpecialClosuresForm vendorId={(vendor as Vendor).id} />
            </div>
          </section>

          {/* Payout / Banking */}
          <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Payout & banking</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Set up your bank account to receive payouts via Paystack.
              </p>
            </div>
            <div className="p-6">
              <PayoutSettingsForm vendorId={(vendor as Vendor).id} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
