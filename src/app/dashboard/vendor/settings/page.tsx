"use client";

import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { vendorDashboardLinks } from "@/config/nav";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Vendor } from "@/types/database.types";

export default function VendorSettingsPage() {
  const supabase = getSupabaseBrowserClient();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }: { data: { user: User | null } }) => {
      if (!data.user) return;
      const { data: v } = await supabase
        .from("vendors")
        .select("*")
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
    <div className="flex min-h-screen">
      <DashboardSidebar links={vendorDashboardLinks} title="Vendor" />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 mb-6 text-sm text-gray-500">Update your vendor profile</p>

        <form onSubmit={handleSave} className="max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-4">
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
      </main>
    </div>
  );
}
