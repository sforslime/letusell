"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { menuItemSchema, type MenuItemFormValues } from "@/lib/validations/menu-item.schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { MenuItem, MenuItemCategory } from "@/types/database.types";

interface MenuItemFormModalProps {
  vendorId: string;
  menuId: string;
  categories: MenuItemCategory[];
  item: MenuItem | null;
  onClose: () => void;
  onSaved: (item: MenuItem) => void;
}

export function MenuItemFormModal({
  vendorId,
  menuId,
  categories,
  item,
  onClose,
  onSaved,
}: MenuItemFormModalProps) {
  const supabase = getSupabaseBrowserClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      price: item?.price ?? 0,
      category_id: item?.category_id ?? "",
      is_available: item?.is_available ?? true,
      is_featured: item?.is_featured ?? false,
      sort_order: item?.sort_order ?? 0,
    },
  });

  async function onSubmit(values: MenuItemFormValues) {
    const payload = {
      ...values,
      vendor_id: vendorId,
      menu_id: menuId,
      category_id: values.category_id || null,
    };

    let saved: MenuItem;
    if (item) {
      const { data, error } = await supabase
        .from("menu_items")
        .update(payload)
        .eq("id", item.id)
        .select()
        .single();
      if (error) throw error;
      saved = data as MenuItem;
    } else {
      const { data, error } = await supabase
        .from("menu_items")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      saved = data as MenuItem;
    }
    onSaved(saved);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {item ? "Edit item" : "New menu item"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Item name"
            placeholder="e.g. Jollof Rice + Chicken"
            error={errors.name?.message}
            {...register("name")}
          />

          <Textarea
            label="Description (optional)"
            placeholder="Short description of the item"
            error={errors.description?.message}
            {...register("description")}
          />

          <Input
            label="Price (₦)"
            type="number"
            step="0.01"
            placeholder="1500"
            error={errors.price?.message}
            {...register("price", { valueAsNumber: true })}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Category (optional)</label>
            <select
              className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              {...register("category_id")}
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" className="rounded" {...register("is_available")} />
              Available
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" className="rounded" {...register("is_featured")} />
              Featured
            </label>
          </div>

          <Button type="submit" loading={isSubmitting} className="w-full mt-2">
            {item ? "Save changes" : "Add item"}
          </Button>
        </form>
      </div>
    </div>
  );
}
