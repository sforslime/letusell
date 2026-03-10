"use client";

import Image from "next/image";
import { X, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatNGN } from "@/lib/utils/currency";
import { useCart } from "@/hooks/use-cart";
import type { MenuItem } from "@/types/database.types";

interface MenuItemModalProps {
  item: MenuItem;
  vendor: { id: string; name: string; slug: string };
  open: boolean;
  onClose: () => void;
}

export function MenuItemModal({ item, vendor, open, onClose }: MenuItemModalProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const { vendorId, clearCart, items } = useCart();

  if (!open) return null;

  const isDifferentVendor = vendorId && vendorId !== vendor.id && items.length > 0;

  function handleAdd() {
    if (isDifferentVendor && !confirmClear) {
      setConfirmClear(true);
      return;
    }

    if (isDifferentVendor) {
      clearCart();
    }

    addItem(
      {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity,
        imageUrl: item.image_url,
        notes: notes || undefined,
      },
      vendor
    );

    setQuantity(1);
    setNotes("");
    setConfirmClear(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Image */}
        <div className="relative h-48 w-full bg-gray-100">
          {item.image_url ? (
            <Image src={item.image_url} alt={item.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">🍽️</div>
          )}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <h2 className="text-lg font-bold text-gray-900">{item.name}</h2>
          {item.description && (
            <p className="mt-1 text-sm text-gray-500">{item.description}</p>
          )}
          <p className="mt-2 text-xl font-bold text-gray-900">{formatNGN(item.price)}</p>

          {/* Notes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requests? (optional)"
            rows={2}
            className="mt-4 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
          />

          {/* Different vendor warning */}
          {confirmClear && isDifferentVendor && (
            <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
              Your cart has items from <strong>{vendor.name}</strong>. Adding this will clear your current cart. Continue?
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center text-sm font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button className="flex-1" onClick={handleAdd}>
              {confirmClear ? "Yes, replace cart" : `Add to cart · ${formatNGN(item.price * quantity)}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
