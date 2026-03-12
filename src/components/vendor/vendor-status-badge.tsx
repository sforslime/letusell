import { Badge } from "@/components/ui/badge";
import type { Vendor } from "@/types/database.types";

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function VendorStatusBadge({ vendor }: { vendor: Vendor }) {
  if (!vendor.opens_at || !vendor.closes_at) {
    return <Badge variant="success">Open</Badge>;
  }

  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = vendor.opens_at.split(":").map(Number);
  const [ch, cm] = vendor.closes_at.split(":").map(Number);
  const open = current >= oh * 60 + om && current < ch * 60 + cm;

  return (
    <Badge variant={open ? "success" : "destructive"}>
      {open
        ? `Open · Closes ${formatTime(vendor.closes_at)}`
        : `Closed · Opens ${formatTime(vendor.opens_at)}`}
    </Badge>
  );
}
