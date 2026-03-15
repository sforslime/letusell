import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/types/database.types";

const statusMap: Record<OrderStatus, { label: string; variant: "default" | "success" | "warning" | "destructive" | "outline" }> = {
  awaiting_payment: { label: "Awaiting Payment", variant: "warning" },
  pending: { label: "Pending", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "default" },
  preparing: { label: "Preparing", variant: "default" },
  ready: { label: "Ready for Pickup", variant: "success" },
  completed: { label: "Completed", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, variant } = statusMap[status] ?? { label: status, variant: "outline" };
  return <Badge variant={variant}>{label}</Badge>;
}
