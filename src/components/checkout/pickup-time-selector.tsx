"use client";

import { useEffect, useState } from "react";
import { formatPickupTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/spinner";

interface PickupTimeSelectorProps {
  vendorSlug: string;
  value: string;
  onChange: (value: string) => void;
}

export function PickupTimeSelector({ vendorSlug, value, onChange }: PickupTimeSelectorProps) {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/vendors/${vendorSlug}/availability`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [vendorSlug]);

  if (loading) {
    return (
      <div className="flex h-20 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
        No pickup slots available right now. The vendor may be closed.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => onChange(slot)}
          className={cn(
            "rounded-xl border py-2 text-xs font-medium transition-colors",
            value === slot
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
          )}
        >
          {formatPickupTime(slot)}
        </button>
      ))}
    </div>
  );
}
