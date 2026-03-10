"use client";

import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { vendorDashboardLinks } from "@/config/nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatNGN } from "@/lib/utils/currency";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Plus, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { MenuItem, MenuItemCategory } from "@/types/database.types";
import { MenuItemFormModal } from "@/components/menu/menu-item-form-modal";

export default function VendorMenuPage() {
  const supabase = getSupabaseBrowserClient();
  const [vendorId, setVendorId] = useState<string | null>(null);
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
        .select("id")
        .eq("owner_id", data.user.id)
        .single();

      if (!vendor) { setLoading(false); return; }
      setVendorId(vendor.id);

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

  async function handleSaved(savedItem: MenuItem) {
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

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar links={vendorDashboardLinks} title="Vendor" />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
            <p className="mt-1 text-sm text-gray-500">{items.length} items</p>
          </div>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Add item
          </Button>
        </div>

        {loading ? (
          <div className="mt-10 flex justify-center"><Spinner /></div>
        ) : (
          <div className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {items.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <p>No menu items yet.</p>
                <Button className="mt-4" onClick={() => setFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-1.5" /> Add your first item
                </Button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100">
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item) => {
                    const cat = categories.find((c) => c.id === item.category_id);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-gray-700">{formatNGN(item.price)}</td>
                        <td className="px-4 py-3 text-gray-500">{cat?.name ?? "—"}</td>
                        <td className="px-4 py-3">
                          <Badge variant={item.is_available ? "success" : "outline"}>
                            {item.is_available ? "Available" : "Unavailable"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => toggleAvailability(item)}
                              className="text-gray-400 hover:text-brand-500"
                              title="Toggle availability"
                            >
                              {item.is_available ? (
                                <ToggleRight className="h-5 w-5 text-green-500" />
                              ) : (
                                <ToggleLeft className="h-5 w-5" />
                              )}
                            </button>
                            <button
                              onClick={() => { setEditing(item); setFormOpen(true); }}
                              className="text-gray-400 hover:text-brand-500"
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
            )}
          </div>
        )}

        {formOpen && vendorId && menuId && (
          <MenuItemFormModal
            vendorId={vendorId}
            menuId={menuId}
            categories={categories}
            item={editing}
            onClose={() => { setFormOpen(false); setEditing(null); }}
            onSaved={handleSaved}
          />
        )}
      </main>
    </div>
  );
}
