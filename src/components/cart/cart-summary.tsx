import { formatNGN } from "@/lib/utils/currency";

interface CartSummaryProps {
  subtotal: number;
}

export function CartSummary({ subtotal }: CartSummaryProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Subtotal</span>
        <span>{formatNGN(subtotal)}</span>
      </div>
      <div className="my-2 border-t border-gray-200" />
      <div className="flex justify-between font-bold text-gray-900">
        <span>Total</span>
        <span>{formatNGN(subtotal)}</span>
      </div>
      <p className="mt-1 text-xs text-gray-400">Pickup order · No delivery fee</p>
    </div>
  );
}
