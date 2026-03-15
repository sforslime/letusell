"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ModifierGroup, ModifierOption } from "@/types/database.types";

interface ModifierGroupsEditorProps {
  menuItemId: string;
}

export function ModifierGroupsEditor({ menuItemId }: ModifierGroupsEditorProps) {
  const supabase = getSupabaseBrowserClient();
  const [groups, setGroups] = useState<(ModifierGroup & { modifier_options: ModifierOption[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
  }, [menuItemId]);

  async function fetchGroups() {
    const { data } = await supabase
      .from("modifier_groups")
      .select("*, modifier_options(*)")
      .eq("menu_item_id", menuItemId)
      .order("sort_order");
    setGroups((data ?? []) as (ModifierGroup & { modifier_options: ModifierOption[] })[]);
    setLoading(false);
  }

  async function addGroup() {
    const { data } = await supabase
      .from("modifier_groups")
      .insert({ menu_item_id: menuItemId, name: "New group", sort_order: groups.length })
      .select()
      .single();
    if (data) {
      const newGroup = { ...data, modifier_options: [] } as ModifierGroup & { modifier_options: ModifierOption[] };
      setGroups((prev) => [...prev, newGroup]);
      setExpanded((prev) => new Set([...prev, data.id]));
    }
  }

  async function updateGroup(id: string, patch: Partial<ModifierGroup>) {
    setSaving(id);
    await supabase.from("modifier_groups").update(patch).eq("id", id);
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    setSaving(null);
  }

  async function deleteGroup(id: string) {
    await supabase.from("modifier_groups").delete().eq("id", id);
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }

  async function addOption(groupId: string) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const { data } = await supabase
      .from("modifier_options")
      .insert({ group_id: groupId, name: "New option", price_adjustment: 0, sort_order: group.modifier_options.length })
      .select()
      .single();
    if (data) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, modifier_options: [...g.modifier_options, data as ModifierOption] }
            : g
        )
      );
    }
  }

  async function updateOption(groupId: string, optionId: string, patch: Partial<ModifierOption>) {
    setSaving(optionId);
    await supabase.from("modifier_options").update(patch).eq("id", optionId);
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, modifier_options: g.modifier_options.map((o) => (o.id === optionId ? { ...o, ...patch } : o)) }
          : g
      )
    );
    setSaving(null);
  }

  async function deleteOption(groupId: string, optionId: string) {
    await supabase.from("modifier_options").delete().eq("id", optionId);
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, modifier_options: g.modifier_options.filter((o) => o.id !== optionId) }
          : g
      )
    );
  }

  if (loading) return <p className="text-sm text-gray-400">Loading modifiers…</p>;

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => {
        const isOpen = expanded.has(group.id);
        return (
          <div key={group.id} className="rounded-xl border border-gray-200 bg-gray-50">
            {/* Group header */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              <button
                type="button"
                onClick={() =>
                  setExpanded((prev) => {
                    const next = new Set(prev);
                    isOpen ? next.delete(group.id) : next.add(group.id);
                    return next;
                  })
                }
                className="text-gray-400"
              >
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <input
                className="flex-1 rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-gray-800 focus:border-gray-300 focus:bg-white focus:outline-none"
                value={group.name}
                onChange={(e) =>
                  setGroups((prev) => prev.map((g) => (g.id === group.id ? { ...g, name: e.target.value } : g)))
                }
                onBlur={(e) => updateGroup(group.id, { name: e.target.value })}
              />
              <label className="flex items-center gap-1 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={group.is_required}
                  onChange={(e) => updateGroup(group.id, { is_required: e.target.checked })}
                  className="rounded"
                />
                Required
              </label>
              <button
                type="button"
                onClick={() => deleteGroup(group.id)}
                className="text-gray-300 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Options */}
            {isOpen && (
              <div className="border-t border-gray-200 px-3 pb-3 pt-2">
                <div className="flex flex-col gap-1.5">
                  {group.modifier_options.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-800 focus:border-brand-400 focus:outline-none"
                        value={opt.name}
                        onChange={(e) =>
                          setGroups((prev) =>
                            prev.map((g) =>
                              g.id === group.id
                                ? { ...g, modifier_options: g.modifier_options.map((o) => o.id === opt.id ? { ...o, name: e.target.value } : o) }
                                : g
                            )
                          )
                        }
                        onBlur={(e) => updateOption(group.id, opt.id, { name: e.target.value })}
                        placeholder="Option name"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">+₦</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-800 focus:border-brand-400 focus:outline-none"
                          value={opt.price_adjustment}
                          onChange={(e) =>
                            setGroups((prev) =>
                              prev.map((g) =>
                                g.id === group.id
                                  ? { ...g, modifier_options: g.modifier_options.map((o) => o.id === opt.id ? { ...o, price_adjustment: parseFloat(e.target.value) || 0 } : o) }
                                  : g
                              )
                            )
                          }
                          onBlur={(e) => updateOption(group.id, opt.id, { price_adjustment: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <label className="flex items-center gap-1 text-xs text-gray-400" title="Available">
                        <input
                          type="checkbox"
                          checked={opt.is_available}
                          onChange={(e) => updateOption(group.id, opt.id, { is_available: e.target.checked })}
                          className="rounded"
                        />
                        On
                      </label>
                      <button
                        type="button"
                        onClick={() => deleteOption(group.id, opt.id)}
                        className="text-gray-300 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addOption(group.id)}
                  className="mt-2 flex items-center gap-1 text-xs text-brand-500 hover:text-brand-700"
                >
                  <Plus className="h-3 w-3" /> Add option
                </button>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addGroup}
        className="flex items-center gap-1.5 rounded-xl border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600"
      >
        <Plus className="h-4 w-4" /> Add modifier group
      </button>
    </div>
  );
}
