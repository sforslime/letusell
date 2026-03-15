"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { formatNGN } from "@/lib/utils/currency";
import type { ModifierGroup, ModifierOption, MenuItem } from "@/types/database.types";
import type { SelectedCartModifier } from "@/types/cart.types";

interface ModifierSelectionModalProps {
  item: MenuItem;
  onClose: () => void;
  onConfirm: (quantity: number, modifiers: SelectedCartModifier[]) => void;
}

export function ModifierSelectionModal({ item, onClose, onConfirm }: ModifierSelectionModalProps) {
  const supabase = getSupabaseBrowserClient();
  const [groups, setGroups] = useState<(ModifierGroup & { modifier_options: ModifierOption[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
          if (defaultOpts.length > 0) {
            defaults[g.id] = defaultOpts.map((o) => o.id);
          }
        });
        setSelections(defaults);
        setLoading(false);
      });
  }, [item.id]);

  function toggleOption(groupId: string, optionId: string, maxSelections: number) {
    setSelections((prev) => {
      const current = prev[groupId] ?? [];
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }
      if (maxSelections === 1) {
        return { ...prev, [groupId]: [optionId] };
      }
      if (current.length >= maxSelections) return prev;
      return { ...prev, [groupId]: [...current, optionId] };
    });
  }

  function validate(): SelectedCartModifier[] | null {
    for (const group of groups) {
      const sel = selections[group.id] ?? [];
      if (group.is_required && sel.length < group.min_selections) {
        setError(`Please select at least ${group.min_selections} option(s) for "${group.name}"`);
        return null;
      }
    }
    setError(null);
    const result: SelectedCartModifier[] = [];
    groups.forEach((g) => {
      (selections[g.id] ?? []).forEach((optId) => {
        const opt = g.modifier_options.find((o) => o.id === optId);
        if (opt) {
          result.push({ groupId: g.id, optionId: opt.id, name: opt.name, priceAdjustment: opt.price_adjustment });
        }
      });
    });
    return result;
  }

  function handleConfirm() {
    const modifiers = validate();
    if (modifiers === null) return;
    onConfirm(quantity, modifiers);
  }

  const modifierTotal = groups.reduce((sum, g) => {
    return sum + (selections[g.id] ?? []).reduce((s, optId) => {
      const opt = g.modifier_options.find((o) => o.id === optId);
      return s + (opt?.price_adjustment ?? 0);
    }, 0);
  }, 0);

  const totalPrice = (item.price + modifierTotal) * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="font-bold text-gray-900">{item.name}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="text-center text-sm text-gray-400">Loading options…</p>
          ) : (
            <div className="flex flex-col gap-5">
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
        </div>

        <div className="border-t border-gray-100 px-5 py-4">
          {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
          <div className="mb-3 flex items-center gap-3">
            <span className="text-sm text-gray-600">Quantity</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>
          <Button className="w-full" onClick={handleConfirm}>
            Add to cart — {formatNGN(totalPrice)}
          </Button>
        </div>
      </div>
    </div>
  );
}
