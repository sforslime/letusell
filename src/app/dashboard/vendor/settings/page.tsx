"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { vendorDashboardLinks } from "@/config/nav";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ExternalLink, Store } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { Vendor } from "@/types/database.types";

export default function VendorSettingsPage() {
  const supabase = getSupabaseBrowserClient();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }: { data: { user: User | null } }) => {
      if (!data.user) return;
      const { data: v } = await supabase
        .from("vendors")
        .select("*, slug, is_active")
        .eq("owner_id", data.user.id)
        .single();
      setVendor(v as Vendor);
    });
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!vendor) return;
    setSaving(true);
    const form = new FormData(e.currentTarget);
    await supabase.from("vendors").update({
      description: form.get("description") as string,
      location_text: form.get("location_text") as string,
      phone: form.get("phone") as string,
      opens_at: form.get("opens_at") as string || null,
      closes_at: form.get("closes_at") as string || null,
      avg_prep_time: Number(form.get("avg_prep_time")),
      min_order: Number(form.get("min_order")),
    }).eq("id", vendor.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function toggleActive() {
    if (!vendor) return;
    setTogglingActive(true);
    const newActive = !vendor.is_active;
    await supabase.from("vendors").update({ is_active: newActive }).eq("id", vendor.id);
    setVendor({ ...vendor, is_active: newActive });
    setTogglingActive(false);
  }

  if (!vendor) {
    return (
      <div className="flex min-h-screen">
        <DashboardSidebar links={vendorDashboardLinks} title="Vendor" />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar links={vendorDashboardLinks} title="Vendor" vendorName={vendor.name} />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 mb-6 text-sm text-gray-500">
          Manage your vendor profile, hours, and storefront visibility.
        </p>

        <div className="max-w-lg space-y-5">
          {/* Profile form card */}
          <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Profile details</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Update your public-facing information that customers see on your storefront.
              </p>
            </div>
            <form onSubmit={handleSave} className="flex flex-col gap-4 p-6">
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <p className="text-sm font-semibold text-gray-700">{vendor.name}</p>
                <p className="text-xs text-gray-400">Vendor name can only be changed by an admin</p>
              </div>

              <Textarea
                label="Description"
                name="description"
                defaultValue={vendor.description ?? ""}
                placeholder="Tell customers about your food..."
              />

              <Input
                label="Location on campus"
                name="location_text"
                defaultValue={vendor.location_text ?? ""}
                placeholder="e.g. Block D Canteen"
              />

              <Input
                label="Phone number"
                name="phone"
                defaultValue={vendor.phone ?? ""}
                placeholder="08012345678"
              />

              <div className="grid grid-cols-2 gap-3">
                <Input label="Opens at" name="opens_at" type="time" defaultValue={vendor.opens_at ?? ""} />
                <Input label="Closes at" name="closes_at" type="time" defaultValue={vendor.closes_at ?? ""} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Avg. prep time (min)"
                  name="avg_prep_time"
                  type="number"
                  min={5}
                  max={120}
                  defaultValue={vendor.avg_prep_time}
                />
                <Input
                  label="Min. order (₦)"
                  name="min_order"
                  type="number"
                  min={0}
                  defaultValue={vendor.min_order}
                />
              </div>

              <Button type="submit" loading={saving} className="w-full">
                {saved ? "Saved!" : "Save changes"}
              </Button>
            </form>
          </section>

          {/* Open / Closed status card */}
          <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Open / Closed status</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Manually control whether customers can place orders right now.
              </p>
            </div>
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-3">
                <span
                  className={`h-3 w-3 rounded-full ${vendor.is_active ? "bg-green-500" : "bg-gray-300"}`}
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {vendor.is_active ? "Open for orders" : "Closed"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {vendor.is_active
                      ? "Customers can browse and place orders."
                      : "Your storefront is hidden from customers."}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                loading={togglingActive}
                onClick={toggleActive}
                className={
                  vendor.is_active
                    ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-none"
                    : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 shadow-none"
                }
              >
                {vendor.is_active ? "Close store" : "Open store"}
              </Button>
            </div>
          </section>

          {/* Storefront preview card */}
          <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Storefront preview</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                See how your store appears to customers on the marketplace.
              </p>
            </div>
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-brand-50 p-2.5">
                  <Store className="h-4 w-4 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{vendor.name}</p>
                  <p className="text-xs text-gray-400">/vendors/{vendor.slug}</p>
                </div>
              </div>
              <Link
                href={`/vendors/${vendor.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                View storefront
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
