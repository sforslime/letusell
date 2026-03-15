"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { productSchema, type ProductFormValues } from "@/lib/validations/product.schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ModifierGroupsEditor } from "@/components/menu/modifier-groups-editor";
import type { Product, ProductCategory } from "@/types/database.types";

interface ProductFormModalProps {
  vendorId: string;
  categories: ProductCategory[];
  item: Product | null;
  onClose: () => void;
  onSaved: (item: Product) => void;
  onDeleted?: (id: string) => void;
}

export function ProductFormModal({
  vendorId,
  categories,
  item,
  onClose,
  onSaved,
  onDeleted,
}: ProductFormModalProps) {
  const supabase = getSupabaseBrowserClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(item?.image_url ?? null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Image must be under 2 MB");
      return;
    }
    setUploadError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function uploadImage(file: File): Promise<string> {
    const ext = file.name.split(".").pop();
    const path = `${vendorId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("menu-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw new Error("Image upload failed: " + error.message);
    const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function onSubmit(values: ProductFormValues) {
    setUploadError(null);
    let imageUrl: string | null = item?.image_url ?? null;

    if (imageFile) {
      try {
        imageUrl = await uploadImage(imageFile);
      } catch (e) {
        setUploadError((e as Error).message);
        return;
      }
    } else if (!imagePreview) {
      imageUrl = null;
    }

    const payload = {
      ...values,
      vendor_id: vendorId,
      category_id: values.category_id || null,
      image_url: imageUrl,
    };

    let saved: Product;
    if (item) {
      const { data, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", item.id)
        .select()
        .single();
      if (error) throw error;
      saved = data as Product;
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      saved = data as Product;
    }
    onSaved(saved);
  }

  async function handleDelete() {
    if (!item || !onDeleted) return;
    setDeleting(true);
    await supabase.from("products").delete().eq("id", item.id);
    onDeleted(item.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {item ? "Edit product" : "New product"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Image upload */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Photo (optional)
              </label>
              {imagePreview ? (
                <div className="relative h-40 w-full overflow-hidden rounded-xl border border-gray-200">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized={imagePreview.startsWith("blob:")}
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-sm">Click to upload image</span>
                  <span className="text-xs">JPG, PNG, WEBP — max 2 MB</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {uploadError && <p className="mt-1 text-xs text-red-500">{uploadError}</p>}
            </div>

            <Input
              label="Product name"
              placeholder="e.g. Handmade Beaded Bracelet"
              error={errors.name?.message}
              {...register("name")}
            />

            <Textarea
              label="Description (optional)"
              placeholder="Short description of the product"
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

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" className="rounded" {...register("is_available")} />
                Available
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" className="rounded" {...register("is_featured")} />
                Featured
              </label>
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full mt-1">
              {item ? "Save changes" : "Add product"}
            </Button>
          </form>

          {/* Modifiers — only shown for existing items (need ID) */}
          {item && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="mb-3 text-sm font-semibold text-gray-700">Variants / Options</p>
              <ModifierGroupsEditor productId={item.id} />
            </div>
          )}

          {/* Delete */}
          {item && onDeleted && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete this product
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Are you sure?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-sm text-gray-400 hover:text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
