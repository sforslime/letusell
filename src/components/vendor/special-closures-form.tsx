"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { VendorSpecialClosure } from "@/types/database.types";

interface SpecialClosuresFormProps {
  vendorId: string;
}

export function SpecialClosuresForm({ vendorId }: SpecialClosuresFormProps) {
  const supabase = getSupabaseBrowserClient();
  const [closures, setClosures] = useState<VendorSpecialClosure[]>([]);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    supabase
      .from("vendor_special_closures")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("closure_date")
      .then(({ data }: { data: VendorSpecialClosure[] | null }) => setClosures(data ?? []));
  }, [vendorId]);

  async function addClosure() {
    if (!date) return;
    setAdding(true);
    const { data } = await supabase
      .from("vendor_special_closures")
      .upsert({ vendor_id: vendorId, closure_date: date, reason: reason || null }, { onConflict: "vendor_id,closure_date" })
      .select()
      .single();
    if (data) {
      setClosures((prev) => {
        const next = prev.filter((c) => c.closure_date !== date);
        return [...next, data as VendorSpecialClosure].sort((a, b) => a.closure_date.localeCompare(b.closure_date));
      });
    }
    setDate("");
    setReason("");
    setAdding(false);
  }

  async function removeClosure(id: string) {
    await supabase.from("vendor_special_closures").delete().eq("id", id);
    setClosures((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      {closures.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {closures.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-gray-800">{c.closure_date}</p>
                {c.reason && <p className="text-xs text-gray-500">{c.reason}</p>}
              </div>
              <button onClick={() => removeClosure(c.id)} className="text-gray-300 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs text-gray-500">Reason (optional)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Public holiday"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>
        <Button size="sm" loading={adding} onClick={addClosure} disabled={!date}>
          Add
        </Button>
      </div>
    </div>
  );
}
