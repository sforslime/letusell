"use client";

import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { formatNGN } from "@/lib/utils/currency";
import type { CartItem } from "@/types/cart.types";

export function CartItemRow({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="56px" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-gray-300" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
        <p className="text-sm text-brand-600 font-semibold">{formatNGN(item.price)}</p>
        {item.notes && (
          <p className="truncate text-xs text-gray-400">{item.notes}</p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          {item.quantity === 1 ? (
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
          ) : (
            <Minus className="h-3.5 w-3.5" />
          )}
        </button>
        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="w-16 text-right text-sm font-semibold text-gray-900">
        {formatNGN(item.price * item.quantity)}
      </p>
    </div>
  );
}
