import { Badge } from "@/components/ui/badge";
import type { Vendor } from "@/types/database.types";

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
      {open ? `Open · Closes ${vendor.closes_at}` : `Closed · Opens ${vendor.opens_at}`}
    </Badge>
  );
}
