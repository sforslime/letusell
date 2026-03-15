"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { VendorHours } from "@/types/database.types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEFAULT_HOURS: Omit<VendorHours, "id" | "vendor_id">[] = DAYS.map((_, i) => ({
  day_of_week: i,
  opens_at: i < 5 ? "09:00" : null,
  closes_at: i < 5 ? "18:00" : null,
  is_closed: i >= 5,
}));

interface BusinessHoursFormProps {
  vendorId: string;
}

export function BusinessHoursForm({ vendorId }: BusinessHoursFormProps) {
  const supabase = getSupabaseBrowserClient();
  const [hours, setHours] = useState<Omit<VendorHours, "id" | "vendor_id">[]>(DEFAULT_HOURS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase
      .from("vendor_hours")
      .select("day_of_week, opens_at, closes_at, is_closed")
      .eq("vendor_id", vendorId)
      .order("day_of_week")
      .then(({ data }: { data: Pick<VendorHours, "day_of_week" | "opens_at" | "closes_at" | "is_closed">[] | null }) => {
        if (!data || data.length === 0) return;
        setHours(
          DAYS.map((_, i) => {
            const row = data.find((r) => r.day_of_week === i);
            return row ?? DEFAULT_HOURS[i];
          })
        );
      });
  }, [vendorId]);

  function update(dayIndex: number, patch: Partial<Omit<VendorHours, "id" | "vendor_id">>) {
    setHours((prev) => prev.map((h, i) => (i === dayIndex ? { ...h, ...patch } : h)));
  }

  async function save() {
    setSaving(true);
    const rows = hours.map((h) => ({ vendor_id: vendorId, ...h }));
    await supabase.from("vendor_hours").upsert(rows, { onConflict: "vendor_id,day_of_week" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      {DAYS.map((day, i) => {
        const row = hours[i];
        return (
          <div key={day} className="flex items-center gap-3">
            <span className="w-8 text-sm font-medium text-gray-700">{day}</span>
            <label className="flex items-center gap-1.5 text-sm text-gray-500">
              <input
                type="checkbox"
                checked={row.is_closed}
                onChange={(e) => update(i, { is_closed: e.target.checked })}
                className="rounded"
              />
              Closed
            </label>
            {!row.is_closed && (
              <>
                <input
                  type="time"
                  value={row.opens_at ?? ""}
                  onChange={(e) => update(i, { opens_at: e.target.value || null })}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-brand-400 focus:outline-none"
                />
                <span className="text-gray-400">–</span>
                <input
                  type="time"
                  value={row.closes_at ?? ""}
                  onChange={(e) => update(i, { closes_at: e.target.value || null })}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-brand-400 focus:outline-none"
                />
              </>
            )}
          </div>
        );
      })}
      <Button size="sm" loading={saving} onClick={save} className="mt-2 w-fit">
        {saved ? "Saved!" : "Save hours"}
      </Button>
    </div>
  );
}
