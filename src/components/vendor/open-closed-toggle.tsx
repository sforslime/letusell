"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface OpenClosedToggleProps {
  vendorId: string;
  initialIsActive: boolean;
}

export function OpenClosedToggle({ vendorId, initialIsActive }: OpenClosedToggleProps) {
  const supabase = getSupabaseBrowserClient();
  const [isActive, setIsActive] = useState(initialIsActive);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const newActive = !isActive;
    await supabase.from("vendors").update({ is_active: newActive }).eq("id", vendorId);
    setIsActive(newActive);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        isActive
          ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
          : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`} />
      {loading ? "Saving…" : isActive ? "Open" : "Closed"}
    </button>
  );
}
