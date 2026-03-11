"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { vendorDashboardLinks } from "@/config/nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatNGN } from "@/lib/utils/currency";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Plus, Pencil, ToggleLeft, ToggleRight, ImageOff } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { MenuItem, MenuItemCategory } from "@/types/database.types";
import { MenuItemFormModal } from "@/components/menu/menu-item-form-modal";

export default function VendorMenuPage() {
  const supabase = getSupabaseBrowserClient();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState<string | undefined>(undefined);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuItemCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }: { data: { user: User | null } }) => {
      if (!data.user) return;
      const { data: vendor } = await supabase
        .from("vendors")
        .select("id, name")
        .eq("owner_id", data.user.id)
        .single();

      if (!vendor) { setLoading(false); return; }
      setVendorId(vendor.id);
      setVendorName(vendor.name);

      const { data: menu } = await supabase
        .from("menus")
        .select("id")
        .eq("vendor_id", vendor.id)
        .single();

      setMenuId(menu?.id ?? null);

      const [{ data: itemsData }, { data: catsData }] = await Promise.all([
        supabase.from("menu_items").select("*").eq("vendor_id", vendor.id).order("sort_order"),
        supabase.from("menu_item_categories").select("*").eq("vendor_id", vendor.id).order("sort_order"),
      ]);

      setItems((itemsData ?? []) as MenuItem[]);
      setCategories((catsData ?? []) as MenuItemCategory[]);
      setLoading(false);
    });
  }, []);

  async function toggleAvailability(item: MenuItem) {
    await supabase
      .from("menu_items")
      .update({ is_available: !item.is_available })
      .eq("id", item.id);
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_available: !i.is_available } : i))
    );
  }

  function handleSaved(savedItem: MenuItem) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === savedItem.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedItem;
        return next;
      }
      return [savedItem, ...prev];
    });
    setFormOpen(false);
    setEditing(null);
  }

  function handleDeleted(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setFormOpen(false);
    setEditing(null);
  }

  const available = items.filter((i) => i.is_available).length;
  const unavailable = items.length - available;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar links={vendorDashboardLinks} title="Vendor" vendorName={vendorName} />

      <main className="flex-1 overflow-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Menu</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              <span>{items.length} items</span>
              {items.length > 0 && (
                <>
                  <span className="text-gray-200">·</span>
                  <span className="text-green-600">{available} available</span>
                  {unavailable > 0 && (
                    <>
                      <span className="text-gray-200">·</span>
                      <span className="text-gray-400">{unavailable} unavailable</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="mr-1.5 h-4 w-4" /> Add item
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
              <ImageOff className="h-6 w-6 text-gray-300" />
            </div>
            <p className="mt-4 font-medium text-gray-600">No menu items yet</p>
            <p className="mt-1 text-sm text-gray-400">Add your first item to get started</p>
            <Button className="mt-5" onClick={() => setFormOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add item
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3">Item</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="hidden px-5 py-3 sm:table-cell">Category</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => {
                  const cat = categories.find((c) => c.id === item.category_id);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      {/* Name + image */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <ImageOff className="h-4 w-4 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                            {item.is_featured && (
                              <span className="text-[10px] font-medium uppercase tracking-wide text-brand-500">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3 font-medium text-gray-800">
                        {formatNGN(item.price)}
                      </td>

                      <td className="hidden px-5 py-3 text-gray-500 sm:table-cell">
                        {cat?.name ?? <span className="text-gray-300">—</span>}
                      </td>

                      <td className="px-5 py-3">
                        <Badge variant={item.is_available ? "success" : "outline"}>
                          {item.is_available ? "Available" : "Off"}
                        </Badge>
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleAvailability(item)}
                            title="Toggle availability"
                            className="text-gray-400 hover:text-brand-500 transition-colors"
                          >
                            {item.is_available ? (
                              <ToggleRight className="h-5 w-5 text-green-500" />
                            ) : (
                              <ToggleLeft className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => { setEditing(item); setFormOpen(true); }}
                            className="text-gray-400 hover:text-brand-500 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {formOpen && vendorId && menuId && (
        <MenuItemFormModal
          vendorId={vendorId}
          menuId={menuId}
          categories={categories}
          item={editing}
          onClose={() => { setFormOpen(false); setEditing(null); }}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
