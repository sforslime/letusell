"use client";

import Image from "next/image";
import { X, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatNGN } from "@/lib/utils/currency";
import { useCart } from "@/hooks/use-cart";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { MenuItem, ModifierGroup, ModifierOption } from "@/types/database.types";
import type { SelectedCartModifier } from "@/types/cart.types";

interface MenuItemModalProps {
  item: MenuItem;
  vendor: { id: string; name: string; slug: string };
  open: boolean;
  onClose: () => void;
}

export function MenuItemModal({ item, vendor, open, onClose }: MenuItemModalProps) {
  const { addItem, vendorId, clearCart, items } = useCart();
  const supabase = getSupabaseBrowserClient();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [groups, setGroups] = useState<(ModifierGroup & { modifier_options: ModifierOption[] })[]>([]);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [modifierError, setModifierError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    supabase
      .from("modifier_groups")
      .select("*, modifier_options(*)")
      .eq("menu_item_id", item.id)
      .order("sort_order")
      .then(({ data }: { data: (ModifierGroup & { modifier_options: ModifierOption[] })[] | null }) => {
        const gs = data ?? [];
        setGroups(gs);
        // Pre-select defaults
        const defaults: Record<string, string[]> = {};
        gs.forEach((g) => {
          const defaultOpts = g.modifier_options.filter((o) => o.is_default && o.is_available);
          if (defaultOpts.length > 0) defaults[g.id] = defaultOpts.map((o) => o.id);
        });
        setSelections(defaults);
      });
  }, [open, item.id]);

  if (!open) return null;

  const isDifferentVendor = vendorId && vendorId !== vendor.id && items.length > 0;

  function toggleOption(groupId: string, optionId: string, maxSelections: number) {
    setModifierError(null);
    setSelections((prev) => {
      const current = prev[groupId] ?? [];
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }
      if (maxSelections === 1) return { ...prev, [groupId]: [optionId] };
      if (current.length >= maxSelections) return prev;
      return { ...prev, [groupId]: [...current, optionId] };
    });
  }

  function buildModifiers(): SelectedCartModifier[] | null {
    for (const group of groups) {
      const sel = selections[group.id] ?? [];
      if (group.is_required && sel.length < group.min_selections) {
        setModifierError(`Please select at least ${group.min_selections} option(s) for "${group.name}"`);
        return null;
      }
    }
    setModifierError(null);
    const result: SelectedCartModifier[] = [];
    groups.forEach((g) => {
      (selections[g.id] ?? []).forEach((optId) => {
        const opt = g.modifier_options.find((o) => o.id === optId);
        if (opt) result.push({ groupId: g.id, optionId: opt.id, name: opt.name, priceAdjustment: opt.price_adjustment });
      });
    });
    return result;
  }

  const modifierTotal = groups.reduce((sum, g) =>
    sum + (selections[g.id] ?? []).reduce((s, optId) => {
      const opt = g.modifier_options.find((o) => o.id === optId);
      return s + (opt?.price_adjustment ?? 0);
    }, 0), 0);

  function handleAdd() {
    if (isDifferentVendor && !confirmClear) {
      setConfirmClear(true);
      return;
    }
    const modifiers = buildModifiers();
    if (modifiers === null) return;

    if (isDifferentVendor) clearCart();

    addItem(
      {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity,
        imageUrl: item.image_url,
        notes: notes || undefined,
        selectedModifiers: modifiers.length > 0 ? modifiers : undefined,
      },
      vendor
    );

    setQuantity(1);
    setNotes("");
    setConfirmClear(false);
    onClose();
  }

  const linePrice = (item.price + modifierTotal) * quantity;

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

        <div className="max-h-[60vh] overflow-y-auto">
          <div className="p-5">
            <h2 className="text-lg font-bold text-gray-900">{item.name}</h2>
            {item.description && (
              <p className="mt-1 text-sm text-gray-500">{item.description}</p>
            )}
            <p className="mt-2 text-xl font-bold text-gray-900">{formatNGN(item.price)}</p>

            {/* Modifier groups */}
            {groups.length > 0 && (
              <div className="mt-4 flex flex-col gap-4">
                {groups.map((group) => (
                  <div key={group.id}>
                    <div className="mb-2 flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">{group.name}</p>
                      {group.is_required && (
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium uppercase text-red-500">
                          Required
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {group.modifier_options.filter((o) => o.is_available).map((opt) => {
                        const checked = (selections[group.id] ?? []).includes(opt.id);
                        return (
                          <label
                            key={opt.id}
                            className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 transition-colors ${
                              checked ? "border-brand-400 bg-brand-50" : "border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type={group.max_selections === 1 ? "radio" : "checkbox"}
                                name={group.id}
                                checked={checked}
                                onChange={() => toggleOption(group.id, opt.id, group.max_selections)}
                                className="accent-brand-500"
                              />
                              <span className="text-sm text-gray-800">{opt.name}</span>
                            </div>
                            {opt.price_adjustment > 0 && (
                              <span className="text-xs font-medium text-gray-500">
                                +{formatNGN(opt.price_adjustment)}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

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
                Your cart has items from another vendor. Adding this will clear your current cart. Continue?
              </div>
            )}

            {modifierError && (
              <p className="mt-2 text-xs text-red-500">{modifierError}</p>
            )}
          </div>
        </div>

        {/* Quantity + Add to cart */}
        <div className="border-t border-gray-100 p-5">
          <div className="flex items-center gap-3">
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
              {confirmClear ? "Yes, replace cart" : `Add to cart · ${formatNGN(linePrice)}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
